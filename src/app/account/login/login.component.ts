// import { CommonModule } from '@angular/common';
import { NgFor, NgIf } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    Inject,
    OnInit,
    inject,
} from "@angular/core";
import {
    ReactiveFormsModule,
    FormGroup,
    FormBuilder,
    FormControl,
    Validators,
    FormsModule,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialog,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import {
    ConfigurationService,
    ICollection,
    IUser,
    ROLES,
    UserService,
    CollectionService,
} from "@domain";
import { UsersRepoService } from "@infrastructure";
import { checkPasswordValidator } from "@utils";
import { BtnComponent } from "@infrastructure";
import { Subscription } from "rxjs";
//import * as bcrypt from "bcryptjs";

@Component({
    selector: "app-login",
    standalone: true,
    templateUrl: "./login.component.html",
    styleUrl: "./login.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgFor,
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        // MatSelectModule,
        MatInputModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatDialogModule,
        BtnComponent,
    ],
})
export class LoginComponent implements OnInit {
    // private readonly repo = inject(UsersRepoService);

    // protected data: {
    //     position: number;
    //     user: IUser;
    //     action: string;
    // } = inject(MAT_DIALOG_DATA);
    // protected data: string = inject(MAT_DIALOG_DATA);
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
    protected loginForm: FormGroup = this.formBuilder.group({});
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
    //protected roles = ROLES;

    // constructor() // public data: { // @Inject(MAT_DIALOG_DATA) //private dialog: MatDialog, // private dialogRef: MatDialogRef<UserComponent>, //private repo: UsersRepoService, //private formBuilder: FormBuilder,
    //     position: number;
    //     user: IUser;
    //     action: string;
    // }
    // @Inject(MAT_DIALOG_DATA) public data: string
    // {}

    ngOnInit(): void {
        const formGroup = {
            // _id: new FormControl(""),
            // updatedAt: new FormControl(""),
            // createdAt: new FormControl(""),
            // __v: new FormControl(""),
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
            stayLoggedIn: new FormControl(
                this.conf.getConfig().stayLoggedIn,
                {}
            ),
            // firstName: new FormControl("", {
            //     validators: [Validators.required],
            // }),
            // lastName: new FormControl("", {
            //     validators: [Validators.required],
            // }),
            // role: new FormControl("", {
            //     validators: [Validators.required],
            // }),
        };
        // this.data.user._id = this.data.user._id ?? "";
        // this.data.user.createdAt = this.data.user.createdAt ?? "";
        // this.data.user.updatedAt = this.data.user.updatedAt ?? "";
        // this.data.user.role = this.data.user.role ?? "default";
        // this.data.user.__v = this.data.user.__v ?? "";
        this.loginForm = this.formBuilder.group(formGroup);
        // this.userForm.setValue(this.data.user);
        // if (this.data.action == "Delete") {
        //     this.formDisabled = true;
        // }
    }

    protected getError = (field: string) => {
        const control = this.loginForm.get(field);
        const errors = control?.errors ?? {};
        // console.log(field, control);
        if (Object.keys(errors).length === 0) return null;
        if (!control!.touched) return null;
        const subject =
            field === "email"
                ? "The email"
                : field === "password"
                ? "The password"
                : "The collection";
        // : field === "firstName"
        // ? "The first name"
        // : field === "lastName"
        // ? "The last name"
        // : field === "password"
        // ? "The password"
        // : "The role";

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

    // protected save() {
    //     const newVal: IUser = this.userForm.value;

    //     if (this.data.action == "Delete") {
    //         this.delete(newVal._id!);
    //         return;
    //     }

    //     if (newVal.password != this.data.user.password)
    //         newVal.password = bcrypt.hashSync(newVal.password, 12);

    //     newVal.email = newVal.email.toLowerCase();

    //     if (this.data.action == "Add") this.emailExists(newVal, this.add);

    //     if (this.data.action == "Edit") this.emailExists(newVal, this.edit);
    // }
    /*
    protected delete(id: string) {
        // this.repo.deleteUser(id).subscribe(resp => {
        //     if (resp.status == 200) this.dialogRef.close(resp);
        //     else {
        //         this.dialog.open(Dialog2Component, {
        //             data: {
        //                 title: "Error",
        //                 text: `The user can not be deleted.\n${resp.message}`,
        //                 yes: "OK",
        //             },
        //         });
        //     }
        // });
    }

    private emailExists = (
        newVal: IUser,
        callback: (newVal: IUser) => void
    ) => {
        // this.repo.getUsers({ email: newVal.email }).subscribe(resp => {
        //     if (resp.data.length > 0 && resp.data[0]._id !== newVal._id) {
        //         this.dialog.open(Dialog2Component, {
        //             data: {
        //                 title: "Alert",
        //                 text: "A user with the same email has already been registered",
        //                 yes: "OK",
        //             },
        //         });
        //     } else {
        //         callback(newVal);
        //     }
        // });
    };

    private edit = (newVal: IUser) => {
        // this.repo.putUser(newVal).subscribe(resp => {
        //     if (resp.status == 200) this.dialogRef.close(resp);
        //     else {
        //         this.dialog.open(Dialog2Component, {
        //             data: {
        //                 title: "Error",
        //                 text: `The user can not be updated.\n${resp.message}`,
        //                 yes: "OK",
        //             },
        //         });
        //     }
        // });
    };

    private add = (newVal: IUser) => {
        // delete newVal._id;
        // this.repo.addUser(newVal).subscribe(resp => {
        //     if (resp.status == 200) this.dialogRef.close(resp);
        //     else {
        //         this.dialog.open(Dialog2Component, {
        //             data: {
        //                 title: "Error",
        //                 text: `The user can not be added.\n${resp.message}`,
        //                 yes: "OK",
        //             },
        //         });
        //     }
        // });
    };
*/
    protected togglePwdState = () => this.pwdState.state = 1 - this.pwdState.state;

    /*

    getCtrl = (name: string) => this.userForm.get(name) as FormControl;
    isSet = (name: string) => this.userForm.get(name)?.value != "";
    set = (name: string, val: unknown) =>
        this.userForm.get(name)?.setValue(val);
    get = (name: string) => this.userForm.get(name)?.value;
    areChanges = () => {
        const a = this.userForm.value;
        const b = this.data.user;
        return Object.keys(a).some(key => a[key] !== b[key as keyof IUser]);
    }; */

    protected setData = () => {
        const stay = this.loginForm.get("stayLoggedIn")?.value ?? false;
        let email = (this.loginForm.get("email")?.value as string)
            .trim()
            .toLowerCase();
        let password = (this.loginForm.get("password")?.value as string);
        let collection = (this.loginForm.get("collection")?.value as string)
            .trim();

        if (this.getError("email")) email = "";
        if (this.getError("password")) password = "";
        if (this.getError("collection")) collection = "";

        this.userService.setUser({
            email: email,
            password: password,
            firstName: this.user?.firstName ?? "",
            lastName: this.user?.lastName ?? ""
        });
        this.collectionService.setCollection({
            name: collection,
            description: this.collection?.description ?? "",
            users: email == "" ? [] : [email],
            roles: email == "" ? [] : ["owner"],
            documents: [],
        });
        this.conf.setStayLoggedIn(stay);
    };

    protected getCtrl = (name: string) =>
        this.loginForm.get(name) as FormControl;
    protected isSet = (name: string) => this.loginForm.get(name)?.value != "";
    protected set = (name: string, val: unknown) =>
        this.loginForm.get(name)?.setValue(val);
}
