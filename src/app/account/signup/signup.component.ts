import { MediaMatcher } from '@angular/cdk/layout';
import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CollectionService, ConfigurationService, ICollection, UserService } from '@domain';
import { BtnComponent } from '@infrastructure';
import { checkPasswordValidator } from '@utils';

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
export class SignupComponent implements OnInit, OnDestroy {
    private readonly conf = inject(ConfigurationService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly userService = inject(UserService);
    private readonly collectionService = inject(CollectionService);
    //private readonly user: IUser | null = null;
    private readonly user = this.userService.getUser();
    private collection: ICollection | null = null;
    // private readonly userSubscription = this.userService.user$.subscribe(
    //     user => (this.user = user)
    // );
    private collectionSubscription =
        this.collectionService.collection$.subscribe(
            collection => (this.collection = collection)
        );
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
                validators: [Validators.required],
            }),
            lastName: new FormControl(this.user?.lastName ?? "", {
                validators: [Validators.required],
            }),
            email: new FormControl(this.user?.email ?? "", {
                validators: [Validators.required, Validators.email],
            }),
            password: new FormControl(this.user?.password ?? "", {
                validators: [
                    Validators.required,
                    Validators.minLength(8),
                    checkPasswordValidator(),
                ],
            }),
            collection: new FormControl(this.collection?.name ?? "", {
                validators: [Validators.required, Validators.minLength(3)],
            }),
            description: new FormControl(
                this.collection?.description ?? "",
                {}
            ),
            stayLoggedIn: new FormControl(
                this.conf.getConfig().stayLoggedIn,
                {}
            ),
        };
        this.signupForm = this.formBuilder.group(formGroup);
        this.matcher.addEventListener("change", this.matcherListener);
    }

    ngOnDestroy(): void {
        this.matcher.removeEventListener("change", this.matcherListener);
    }

    protected getError = (field: string) => {
        const control = this.signupForm.get(field);
        const errors = control?.errors ?? {};
        // console.log(field, control);
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
        return subject + " is not valid.";
    };

    protected togglePwdState = () => this.pwdState.state = 1 - this.pwdState.state;

    setData = () => {
        const stay = this.signupForm.get("stayLoggedIn")?.value ?? false;
        let firstName = (this.signupForm.get("firstName")?.value as string)
            .trim();
        let lastName = (this.signupForm.get("lastName")?.value as string)
            .trim();
        let email = (this.signupForm.get("email")?.value as string)
            .trim()
            .toLowerCase();
        let password = (this.signupForm.get("password")?.value as string);
        let collection = (this.signupForm.get("collection")?.value as string)
            .trim();
        let description = (this.signupForm.get("description")?.value as string)
            .trim();

        if (this.getError("firstName")) firstName = "";
        if (this.getError("lastName")) lastName = "";
        if (this.getError("email")) email = "";
        if (this.getError("password")) password = "";
        if (this.getError("collection")) collection = "";
        if (this.getError("description")) description = "";

        this.userService.setUser({
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
        });
        this.collectionService.setCollection({
            name: collection,
            description: description,
            users: email == "" ? [] : [email],
            roles: email == "" ? [] : ["owner"],
            documents: [],
        });
        this.conf.setStayLoggedIn(stay);
    };

    protected getCtrl = (name: string) =>
        this.signupForm.get(name) as FormControl;
    protected isSet = (name: string) => this.signupForm.get(name)?.value != "";
    protected set = (name: string, val: unknown) =>
        this.signupForm.get(name)?.setValue(val);
}
