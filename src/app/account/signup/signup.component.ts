import { MediaMatcher } from '@angular/cdk/layout';
import { NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NavigationStart, Router } from '@angular/router';
import { CollectionService, UserService } from '@domain';
import { AccountRepoService, BtnComponent } from '@infrastructure';
import { HotToastService } from '@ngneat/hot-toast';
import { UniqueCollectionValidator, UniqueEmailValidator, passwordValidator, ltrimFormControl, trimFormControl, accessRepo } from '@utils';
import { Subscription } from 'rxjs';

@Component({
    selector: "app-signup",
    standalone: true,
    imports: [
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatCheckboxModule,
        BtnComponent,
    ],
    templateUrl: "./signup.component.html",
    styleUrl: "./signup.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("firstItem") firstItem!: ElementRef;
    private readonly router = inject(Router);
    private readonly repo = inject(AccountRepoService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly userService = inject(UserService);
    private readonly collectionService = inject(CollectionService);
    private readonly toast = inject(HotToastService);
    private readonly changeDetectionRef = inject(ChangeDetectorRef);

    private readonly uniqueEmailValidator = new UniqueEmailValidator(
        this.changeDetectionRef
    );
    private readonly uniqueCollectionValidator = new UniqueCollectionValidator(
        this.changeDetectionRef
    );
    private readonly user = this.userService.user();
    private readonly collection = this.collectionService.collection();

    private navigationSubscription?: Subscription;
    private media = inject(MediaMatcher);
    private matcher = this.media.matchMedia("(max-width: 600px)");
    protected readonly working = signal<ReturnType<typeof setTimeout> | null>(
        null
    );
    protected readonly loading = computed(() => this.working() != null);
    protected isMobile = signal(this.matcher.matches);
    protected matcherListener = (e: MediaQueryListEvent) =>
        this.isMobile.set(e.matches ? true : false);
    protected signupForm: FormGroup = this.formBuilder.group({});
    protected pwdState = {
        type: ["password", "text"],
        svg: ["eye-slash", "eye"],
        alt: [
            "The password text is not visible",
            "The password text is visible",
        ],
        state: 0,
    };

    ngOnInit(): void {
        const formGroup = {
            firstName: new FormControl(this.user?.firstName ?? "", {
                validators: [ltrimFormControl, Validators.required],
            }),
            lastName: new FormControl(this.user?.lastName ?? "", {
                validators: [ltrimFormControl, Validators.required],
            }),
            email: new FormControl(this.user?.email ?? "", {
                validators: [
                    trimFormControl,
                    Validators.required,
                    Validators.email,
                ],
                asyncValidators: [
                    this.uniqueEmailValidator.validate.bind(
                        this.uniqueEmailValidator
                    ),
                ],
                updateOn: "blur",
            }),
            password: new FormControl(this.user?.password ?? "", {
                validators: [
                    Validators.required,
                    Validators.minLength(8),
                    passwordValidator(),
                ],
            }),
            collection: new FormControl(this.collection?.name ?? "", {
                validators: [
                    ltrimFormControl,
                    Validators.required,
                    Validators.minLength(3),
                ],
                asyncValidators: [
                    this.uniqueCollectionValidator.validate.bind(
                        this.uniqueCollectionValidator
                    ),
                ],
                updateOn: "blur",
            }),
            description: new FormControl(this.collection?.description ?? "", {
                validators: [ltrimFormControl],
            }),
            stayLoggedIn: new FormControl(
                this.collection?.stayLoggedIn ?? false,
                {}
            ),
        };
        this.signupForm = this.formBuilder.group(formGroup);
        this.matcher.addEventListener("change", this.matcherListener);

        if (this.getValue("email") != "") this.getCtrl("email").markAsTouched();
        if (this.getValue("collection") != "")
            this.getCtrl("collection").markAsTouched();

        this.navigationSubscription = this.router.events.subscribe(e => {
            if (e instanceof NavigationStart) {
                this.uniqueEmailValidator.cancel();
                this.uniqueCollectionValidator.cancel();
                this.navigationSubscription?.unsubscribe();
            }
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.firstItem.nativeElement.focus();
        }, 0);
    }

    ngOnDestroy(): void {
        this.matcher.removeEventListener("change", this.matcherListener);
    }

    protected getError = (field: string) => {
        const control = this.signupForm.get(field);
        const errors = control?.errors ?? {};

        if (Object.keys(errors).length === 0) return null;
        if (!control!.touched) return null;
        const subject =
            field === "firstName"
                ? "The first name"
                : field === "lastName"
                ? "The last name"
                : field === "email"
                ? "The email"
                : field === "password"
                ? "The password"
                : "The collection";

        if (errors["required"]) return subject + " is mandatory.";
        if (errors["minlength"])
            return (
                subject +
                ` must be at lest ${errors["minlength"].requiredLength} characters.`
            );

        if (errors["checkPassword"])
            return (
                subject +
                " must have at least one lowercase letter, one uppercase letter, one digit, and one special character."
            );

        if (errors["unique"]) return subject + " already exists.";

        if (errors["connection"])
            return subject + " cannot be validated due to connection error.";

        return subject + " is not valid.";
    };

    protected togglePwdState = () =>
        (this.pwdState.state = 1 - this.pwdState.state);

    setData = () => {
        const firstName = this.trimValue("firstName") ?? "";
        const lastName = this.trimValue("lastName") ?? "";
        const description = this.trimValue("description") ?? "";
        const stayLoggedIn = this.getValue("stayLoggedIn") ?? false;
        let email = this.trimValue("email").toLowerCase() ?? "";
        let password = this.getValue("password") ?? "";
        let collection = this.trimValue("collection") ?? "";

        if (this.getError("email")) email = "";
        if (this.getError("password")) password = "";
        if (this.getError("collection")) collection = "";

        this.userService.setUser({
            email,
            password,
            firstName,
            lastName,
            enabled: false,
        });
        this.collectionService.setCollection({
            name: collection,
            description,
            stayLoggedIn,
            users: [],
            roles: [],
            enabled: false,
        });
    };

    protected signup = async () => {
        if (this.working()) return;

        this.setData();
        const user = this.userService.user()!;
        const collection = this.collectionService.collection()!;

        const obs$ = this.repo.ownerSignup({ user, collection });

        await accessRepo(`Registering`, obs$, this.working, this.toast);
        this.toast.success("Successful registration. Pending validation.");
        this.router.navigateByUrl("validation/signup", {
            replaceUrl: true,
        });
    };

    private getValue = (name: string) => this.signupForm.get(name)?.value;
    private trimValue = (name: string) => {
        const v = (this.getValue(name) as string).trim();
        this.set(name, v);
        return v;
    };
    protected getCtrl = (name: string) =>
        this.signupForm.get(name) as FormControl;
    protected isSet = (name: string) => this.getValue(name) != "";
    protected set = (name: string, val: unknown) =>
        this.signupForm.get(name)?.setValue(val);
}
