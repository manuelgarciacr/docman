import { NgFor, NgIf } from "@angular/common";
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Injector,
    OnInit,
    ViewChild,
    effect,
    inject,
    runInInjectionContext,
    signal,
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
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import {
    UserService,
    CollectionService,
    IUser,
    ICollection,
} from "@domain";
import { ltrimFormControl, trimFormControl } from "@utils";
import { AccountRepoService, BtnComponent } from "@infrastructure";
import { Router } from "@angular/router";
import { HotToastService } from "@ngneat/hot-toast";
import { tap } from "rxjs";

const DISMISS = {
    autoClose: false,
    dismissible: true,
};

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
        MatInputModule,
        MatFormFieldModule,
        MatCheckboxModule,
        BtnComponent,
    ],
})
export class LoginComponent implements OnInit, AfterViewInit {
    @ViewChild("firstItem") firstItem!: ElementRef;

    private readonly repo = inject(AccountRepoService);
    private readonly router = inject(Router);
    private readonly formBuilder = inject(FormBuilder);
    private readonly userService = inject(UserService);
    private readonly collectionService = inject(CollectionService);
    private readonly toast = inject(HotToastService);
    private readonly injector = inject(Injector);

    private readonly user = this.userService.user() ?? <IUser>{};
    private readonly collection =
        this.collectionService.collection() ?? <ICollection>{};

    protected readonly loading = signal(false);
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

    ngOnInit(): void {
        const formGroup = {
            email: new FormControl(this.user.email, {
                validators: [
                    trimFormControl,
                    Validators.required,
                    Validators.email,
                ],
            }),
            password: new FormControl(this.user.password, {
                validators: [Validators.required],
            }),
            collection: new FormControl(this.collection.name, {
                validators: [ltrimFormControl, Validators.required],
            }),
        };
        this.loginForm = this.formBuilder.group(formGroup);

        runInInjectionContext(this.injector, () => {
            effect(() => {
                if (this.loading())
                    this.loginForm.disable()
                else
                    this.loginForm.enable()
            });
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.firstItem.nativeElement.focus();
        }, 0);
    }

    protected getError = (field: string) => {
        const control = this.loginForm.get(field);
        const errors = control?.errors ?? {};

        if (Object.keys(errors).length === 0) return null;
        if (!control!.touched) return null;

        const subject =
            field === "email"
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

        return subject + " is not valid.";
    };

    protected togglePwdState = () =>
        (this.pwdState.state = 1 - this.pwdState.state);

    protected setData = () => {
        const email = this.trimValue("email").toLowerCase() ?? "";
        const password = this.getValue("password") ?? "";
        const collection = this.trimValue("collection") ?? "";

        this.user.firstName = this.user.firstName ?? "";
        this.user.lastName = this.user.lastName ?? "";
        this.user.email = this.getError("email") ? "" : email;
        this.user.password = this.getError("password") ? "" : password;
        this.user.enabled = false;

        // Si el nombre de la colección cambia, la descripción se borra.
        if (collection != this.collection.name) {
            this.collection.description = "";
            this.collection.stayLoggedIn = false;
        }

        this.collection.name = this.getError("collection") ? "" : collection;
        this.collection.users = [];
        this.collection.roles = [];
        this.collection.enabled = false;

        this.userService.setUser(this.user);
        this.collectionService.setCollection(this.collection);
    };

    protected login = () => {
        this.setData();
        const user = this.userService.user()!;
        const collection = this.collectionService.collection()!;
        const briefError = (err: string) => (err.split(":").pop() ?? "").trim();

        collection!.users = [];
        collection!.roles = [];
        collection!.documents = [];

        this.loading.set(true);
        this.repo
            .login({ user, collection })
            .pipe(
                this.toast.observe({
                    loading: { content: "Logging in" },
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
                        this.toast.success("Successful login");
                    } else {
                        this.toast.error(err, DISMISS);
                    }
                })
            )
            .subscribe({
                next: resp => {
                    if (resp.status != 200) {
                        console.error("LOGIN ERROR NEXT", resp);
                        return;
                    }
                    const [user, collection] = resp.data as unknown as [
                        IUser,
                        ICollection
                    ];
                    const users = collection.users;
                    const roles = collection.roles;
                    const idx = users.indexOf(user._id ?? "");
                    const isOwner = roles[idx] == "owner";

                    this.userService.setUser(user, isOwner);
                    this.collectionService.setCollection(collection);
                    this.router.navigateByUrl("test", { replaceUrl: true });
                },
                error: err => console.error("LOGIN ERROR", err),
                complete: () => this.loading.set(false),
            });
    };

    // Form Control helpers

    private getValue = (name: string) => this.loginForm.get(name)?.value;
    private trimValue = (name: string) => {
        const v = ((this.getValue(name) ?? "") as string).trim();
        this.set(name, v);
        return v;
    };
    protected getCtrl = (name: string) =>
        this.loginForm.get(name) as FormControl;
    protected isSet = (name: string) => this.getValue(name) != "";
    protected set = (name: string, val: unknown) =>
        this.loginForm.get(name)?.setValue(val);
}
