import { NgIf, DecimalPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild,inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AccountRepoService, BtnComponent } from '@infrastructure';
import { NumbersOnlyDirective, codeFormControl, getTokenPayload } from '@utils';
import { CountdownComponent, CountdownEvent, CountdownModule } from 'ngx-countdown';
import { HotToastService } from "@ngneat/hot-toast";
import { tap } from 'rxjs';
import { UserService } from '@domain';
import { Router } from '@angular/router';

const DISMISS = {
    autoClose: false,
    dismissible: true,
};

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

    private readonly formBuilder = inject(FormBuilder);
    private readonly toast = inject(HotToastService);
    private readonly repo = inject(AccountRepoService);
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);

    protected readonly validationForm = this.formBuilder.group({});
    protected readonly validationExpiration = this.userService.validationExpiration(); // In seconds
    protected readonly config = {
        leftTime: this.validationExpiration,
        format: "mm:ss",
    };

    // Signals
    private _code = signal<ElementRef>(this.firstItem);
    //private nativeCode = computed(() => this._code)
    protected btnLabel = signal("Validate");
    protected btnLink = signal<string | null>(null);

    ngOnInit(): void {
        const formGroup = {
            code: new FormControl("00000", {
                validators: [codeFormControl(this._code)], //this.nativeCode)],
            }),
        };
        this.validationForm.controls = formGroup
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

        const subject = field === "code" ? "The code" : "The code";

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

        return subject + " is not valid.";
    };

    protected handleEvent = (event: CountdownEvent) => {
        console.log(event);
        if (event.action == "done") {
            // this.repo.cleanDB()
            //     .pipe(
            //         tap(d => console.log("D", d)),
            //         map(m => console.log("M", m))
            //     ).subscribe(
            //         res => console.log("RES", res)
            //     );
            this.toast.error("Timeout");
            this.getCtrl("code").disable();
            this.validationForm.clearValidators();
            this.btnLabel.set("Log In");
            this.btnLink.set("/login");
        }
    };

    protected validation = () => {
        const briefError = (err: string) => (err.split(":").pop() ?? "").trim();

        if (this.btnLink()) return;

        this.userService.setValidationCode(this.getValue("code"));

        this.repo
            .ownerValidation()
            .pipe(
                // TODO: Toast loading delay (like in logout method)
                this.toast.observe({
                    loading: { content: "Validating" },
                    success: {
                        content: "Success",
                        style: { display: "none" },
                    },
                    error: {
                        content: err => `Error: ${err.toString()}`,
                    },
                }),
                tap(resp => {
                    const err = briefError(resp.message.toString());
                    if (resp.status == 200) {
                        this.toast.success(
                            "Successful validation."
                        );
                        console.log(
                            getTokenPayload(this.userService.refreshToken()),
                            getTokenPayload(this.userService.accessToken())
                        );
                        this.router.navigateByUrl("test");
                    } else {
                        this.toast.error(err, DISMISS);
                    }
                })
            )
            .subscribe({
                next: resp => {
                    console.log(resp);
                    //if (resp.status == 200) this.router.navigateByUrl("validation"); //, { replaceUrl: true });
                },
                error: err => console.error("VALIDATION ERROR", err),
            });
    };

    // Form Control helpers

    private getValue = (name: string) => this.validationForm.get(name)?.value;
    private trimValue = (name: string) => {
        const v = (this.getValue(name) as string).trim();
        this.set(name, v);
        return v;
    };
    protected getCtrl = (name: string) =>
        this.validationForm.get(name) as FormControl;
    protected isSet = (name: string) => this.getValue(name) != "";
    protected set = (name: string, val: unknown) =>
        this.validationForm.get(name)?.setValue(val);
}
