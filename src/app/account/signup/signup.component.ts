import { MediaMatcher } from '@angular/cdk/layout';
import { NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NavigationStart, Router } from '@angular/router';
import { CollectionService, ConfigurationService, UserService } from '@domain';
import { AccountRepoService, BtnComponent } from '@infrastructure';
import { HotToastService } from '@ngneat/hot-toast';
import { UniqueCollectionValidator, UniqueEmailValidator, passwordValidator, ltrimFormControl, trimFormControl } from '@utils';
import { Subscription, tap } from 'rxjs';

const DISMISS = {
    autoClose: false,
    dismissible: true,
};

@Component({
    selector: "app-signup",
    standalone: true,
    imports: [
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        // MatSelectModule,
        MatInputModule,
        MatFormFieldModule,
        MatCheckboxModule,
        //MatDialogModule,
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
    private readonly conf = inject(ConfigurationService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly userService = inject(UserService);
    private readonly collectionService = inject(CollectionService);
    private readonly toast = inject(HotToastService);
    private readonly changeDetectionRef = inject(ChangeDetectorRef);
    //private readonly uniqueEmailValidator = inject(UniqueEmailValidator());
    private readonly uniqueEmailValidator = new UniqueEmailValidator(
        this.changeDetectionRef
    );
    private readonly uniqueCollectionValidator = new UniqueCollectionValidator(
        this.changeDetectionRef
    );
    //private readonly user: IUser | null = null;
    private readonly user = this.userService.user();
    private readonly collection = this.collectionService.collection();

    private navigationSubscription?: Subscription;
    private media = inject(MediaMatcher);
    private matcher = this.media.matchMedia("(max-width: 600px)");
    protected isMobile = signal(this.matcher.matches);
    private matcherListener = (e: MediaQueryListEvent) =>
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
    protected formDisabled = false;

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
                this.conf.getConfig().stayLoggedIn,
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
        const stay = this.getValue("stayLoggedIn") ?? false;
        const firstName = this.trimValue("firstName");
        const lastName = this.trimValue("lastName");
        let email = this.trimValue("email").toLowerCase();
        let password = this.getValue("password") as string;
        let collection = this.trimValue("collection");
        const description = this.trimValue("description");

        if (this.getError("email")) email = "";
        if (this.getError("password")) password = "";
        if (this.getError("collection")) collection = "";

        this.userService.setUser({
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
            enabled: false,
        });
        this.collectionService.setCollection({
            name: collection,
            description: description,
            users: [],
            roles: [],
            documents: [],
        });
        this.conf.setStayLoggedIn(stay);
    };

    protected signup = () => {
        this.setData();
        const user = this.userService.user()!;
        const collection = this.collectionService.collection()!;
        const stayLoggedIn = this.conf.getConfig().stayLoggedIn;
        const briefError = (err: string) => (err.split(":").pop() ?? "").trim();

        collection!.users = [];
        collection!.roles = [];
        collection!.documents = [];

        this.repo
            .ownerSignup({ user, collection, stayLoggedIn })
            .pipe(
                this.toast.observe({
                    loading: { content: "Registering" },
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
                            "Successful registration. Pending validation."
                        );
                    } else {
                        this.toast.error(err, DISMISS);
                    }
                })
            )
            .subscribe({
                next: resp => {
                    console.log(resp);
                    if (resp.status == 200)
                        this.router.navigateByUrl("validation"); //, { replaceUrl: true });
                },
                error: err => console.error("SIGNUP ERROR", err),
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
