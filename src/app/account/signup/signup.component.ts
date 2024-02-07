import { MediaMatcher } from '@angular/cdk/layout';
import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
    private media = inject(MediaMatcher);
    private matcher = this.media.matchMedia("(max-width: 600px)");
    protected isMobile = signal(this.matcher.matches);
    private matcherListener = (e: MediaQueryListEvent) =>
        this.isMobile.set(e.matches ? true : false);
    private readonly formBuilder = inject(FormBuilder);
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
            firstName: new FormControl("", {
                validators: [Validators.required],
            }),
            lastName: new FormControl("", {
                validators: [Validators.required],
            }),
            email: new FormControl("", {
                validators: [Validators.required, Validators.email],
            }),
            password: new FormControl("", {
                validators: [
                    Validators.required,
                    Validators.minLength(8),
                    checkPasswordValidator(),
                ],
            }),
            collection: new FormControl("", {
                validators: [Validators.required, Validators.minLength(3)],
            }),
            stayLoggedIn: new FormControl("", {}),
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

    protected togglePwdState() {
        this.pwdState.state = 1 - this.pwdState.state;
    }

    protected getCtrl = (name: string) =>
        this.signupForm.get(name) as FormControl;
    protected isSet = (name: string) => this.signupForm.get(name)?.value != "";
    protected set = (name: string, val: unknown) =>
        this.signupForm.get(name)?.setValue(val);
}
