import { NgFor, NgIf } from "@angular/common";
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Injector,
    OnInit,
    ViewChild,
    computed,
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
import { accessRepo, ltrimFormControl, trimFormControl } from "@utils";
import { AccountRepoService, BtnComponent } from "@infrastructure";
import { Router } from "@angular/router";
import { HotToastService } from "@ngneat/hot-toast";

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

    protected readonly working = signal<ReturnType<typeof setTimeout> | null>(
        null
    );
    protected readonly loading = computed(() => this.working() != null);

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
                if (this.working()) this.loginForm.disable();
                else this.loginForm.enable();
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

    private getData = () => {
        const _user = this.userService.user();
        const email = _user?.email ?? "";
        const password = _user?.password ?? "";
        const name = this.collectionService.collection()?.name ?? "";
        const user: IUser = {
            email,
            password,
            firstName: "",
            lastName: "",
            enabled: false,
        };
        const collection: ICollection = {
            name,
            description: "",
            enabled: false,
            stayLoggedIn: false,
            users: [],
            roles: [],
        };

        return {user, collection}
    }

    protected login = async () => {
        if (this.working()) return;

        this.setData();
        const userColl = this.getData();

        const obs$ = this.repo.login(userColl);

        await accessRepo(`Logging in`, obs$, this.working, this.toast);
        this.toast.success("Successful login.");
        this.router.navigateByUrl("test", { replaceUrl: true });
    };

    protected forgotPassword = async () => {
        if (this.working()) return;

        this.setData();

        const { user, collection } = this.getData();

        user.password = "";

        const obs$ = this.repo.forgotPassword({ user, collection })

        await accessRepo(
            `Validating data in progress`,
            obs$,
            this.working,
            this.toast
        );
        this.toast.success("Successful validation.");
        this.router.navigateByUrl("validation/forgotpassword", {
            replaceUrl: true,
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
