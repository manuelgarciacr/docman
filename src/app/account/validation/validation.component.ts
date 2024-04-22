import { NgIf, DecimalPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Injector, Input, OnInit, ViewChild,effect,inject, runInInjectionContext, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AccountRepoService, BtnComponent } from '@infrastructure';
import { NumbersOnlyDirective, accessRepo, codeFormControl, codeFormValidator, passwordValidator } from '@utils';
import { CountdownComponent, CountdownEvent, CountdownModule } from 'ngx-countdown';
import { HotToastService } from "@ngneat/hot-toast";
import { UserService } from '@domain';
import { Router } from '@angular/router';
import { MediaMatcher } from '@angular/cdk/layout';

@Component({
    selector: "app-validation",
    standalone: true,
    imports: [
        NgIf,
        DecimalPipe,
        CountdownModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        BtnComponent,
        NumbersOnlyDirective,
    ],
    templateUrl: "./validation.component.html",
    styleUrl: "./validation.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationComponent implements OnInit, AfterViewInit {
    @ViewChild("firstItem") firstItem!: ElementRef; // First input field (should receive focus)
    @ViewChild("cd", { static: false }) private countdown!: CountdownComponent;
    @Input() type?: string;

    private readonly formBuilder = inject(FormBuilder);
    private readonly toast = inject(HotToastService);
    private readonly repo = inject(AccountRepoService);
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);
    private readonly injector = inject(Injector);

    private readonly validationExp = this.userService.validationExp(); // In seconds
    private readonly validationIat = this.userService.validationIat(); // In seconds
    private readonly expiration =
        this.validationExp - Math.floor(Date.now() / 1000);

    protected readonly validationExpiration =
        this.validationExp - this.validationIat;
    protected readonly config = {
        leftTime: this.expiration > 0 ? this.expiration : 0,
        format: "mm:ss",
    };
    protected text = "after registration";
    protected validationForm: FormGroup = this.formBuilder.group({});

    // Signals

    private readonly _code = signal<ElementRef>(this.firstItem);
    private readonly media = inject(MediaMatcher);
    private readonly matcher = this.media.matchMedia("(max-width: 600px)");
    protected readonly isMobile = signal(this.matcher.matches);
    protected matcherListener = (e: MediaQueryListEvent) =>
        this.isMobile.set(e.matches ? true : false);
    protected readonly working = signal<ReturnType<typeof setTimeout> | null>(
        null
    );
    protected readonly btnLabel = signal("Validate");
    protected readonly btnLink = signal<string | null>(null);
    protected readonly pwdState = signal({
        type: ["password", "text"],
        svg: ["eye-slash", "eye"],
        alt: [
            "The password text is not visible",
            "The password text is visible",
        ],
        state: 0,
    });

    ngOnInit(): void {
        const formGroup = {
            code: new FormControl("00000", {
                validators: [
                    codeFormControl(this._code),
                    codeFormValidator(),
                ],
            }),
        };

        this.validationForm = this.formBuilder.group(formGroup);

        if (this.type == "forgotpassword") {
            this.text = "and the new password";
            this.validationForm.addControl(
                "password",
                new FormControl("", {
                    validators: [
                        Validators.required,
                        Validators.minLength(8),
                        passwordValidator(),
                    ],
                })
            );
            this.btnLabel.set("Change password");
        }

        runInInjectionContext(this.injector, () => {
            effect(() => {
                if (this.working()) this.validationForm.disable();
                else this.validationForm.enable();
            });
        });
    }

    ngAfterViewInit(): void {
        this._code.set(this.firstItem);
        setTimeout(() => {
            const ne = this.firstItem.nativeElement;
            ne.focus();
            (ne as HTMLInputElement).setSelectionRange(0, 0);
        }, 0);
        this.countdown.begin();
    }

    protected getError = (field: string) => {
        const control = this.validationForm.get(field);
        const errors = control?.errors ?? {};

        if (Object.keys(errors).length === 0) return null;
        if (!control!.touched) return null;

        const subject = field === "code" ? "The code" : "The password";

        if (errors["required"]) return subject + " is mandatory.";

        if (errors["minlength"])
            return (
                subject +
                ` must be at lest ${errors["minlength"].requiredLength} characters.`
            );

        if (errors["maxlength"])
            return (
                subject +
                ` must be less or equal ${errors["maxlength"].requiredLength} characters.`
            );

        if (errors["checkPassword"])
            return (
                subject +
                " must have at least one lowercase letter, one uppercase letter, one digit, and one special character."
            );

        if (errors["zeros"]) return subject + " cannot be zero.";

        return subject + " is not valid.";
    };

    protected togglePwdState = () =>
        this.pwdState.update(pwdState => ({
            ...pwdState,
            state: 1 - pwdState.state,
        }));

    protected handleEvent = (event: CountdownEvent) => {
        if (event.action == "done") {
            this.toast.error("Timeout");
            this.pwdState.update(pwdState => ({
                ...pwdState,
                state: 0,
            }));
            this.set("code", "00000");
            this.validationForm.disable();
            this.validationForm.clearValidators();
            this.btnLabel.set("Log in");
            this.btnLink.set("/login");
        }
    };

    protected validation = async () => {
        if (this.working()) return;
        if (this.btnLabel() == "Log in") return;

        this.userService.setValidationCode(this.getValue("code"));
        this.userService.setValidationPwd(this.getValue("password"));

        const obs$ =
            this.type == "forgotpassword"
                ? this.repo.forgotPasswordValidation()
                : this.repo.ownerValidation();

        await accessRepo(
            `Validating data in progress`,
            obs$,
            this.working,
            this.toast
        );
        this.toast.success("Successful validation.");
        this.router.navigateByUrl("test", {
            replaceUrl: true,
        });
    };

    // Form Control helpers

    private getValue = (name: string) => this.validationForm.get(name)?.value;
    protected getCtrl = (name: string) =>
        this.validationForm.get(name) as FormControl;
    protected isSet = (name: string) => this.getValue(name) != "";
    protected set = (name: string, val: unknown) =>
        this.validationForm.get(name)?.setValue(val);

    protected disabled() {
        const valid = this.validationForm.valid;
        const working = this.working() != null;
        const done = this.btnLabel() == "Log in";

        return !done && (!valid || working);
    }
}
