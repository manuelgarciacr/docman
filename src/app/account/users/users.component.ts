import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, ViewChild, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BtnComponent, CollectionsRepoService, UsersRepoService } from "@infrastructure";
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { accessRepo, trimFormControl } from '@utils';
import { HotToastService } from '@ngneat/hot-toast';
import { NgIf } from '@angular/common';
import { CollectionService } from '@domain';

type actualization = { email: string; userId: string; name: string; action: string }

@Component({
    selector: "app-users",
    standalone: true,
    templateUrl: "./users.component.html",
    styleUrl: "./users.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgIf,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
        MatDialogContent,
        BtnComponent,
        MatListModule,
        MatIconModule,
        MatDividerModule,
    ],
})
export class UsersComponent implements OnInit {
    @ViewChild("firstItem", {static: true}) firstItem!: ElementRef;

    private readonly repo = inject(UsersRepoService);
    private readonly collectionsRepo = inject(CollectionsRepoService);
    private readonly collection = inject(CollectionService).collection();
    private readonly formBuilder = inject(FormBuilder);
    private readonly toast = inject(HotToastService);
    private readonly injector = inject(Injector);

    protected readonly data: actualization[] =
        inject(MAT_DIALOG_DATA);
    protected readonly dialogRef = inject(MatDialogRef<UsersComponent>);
    protected readonly working = signal<ReturnType<typeof setTimeout> | null>(
        null
    );
    protected usersForm: FormGroup = this.formBuilder.group({});

    protected email = "";

    ngOnInit(): void {
        const formGroup = {
            email: new FormControl(this.email, {
                validators: [
                    trimFormControl,
                    Validators.required,
                    Validators.email,
                ],
            }),
        };
        this.usersForm = this.formBuilder.group(formGroup);

        runInInjectionContext(this.injector, () => {
            effect(() => {
                if (this.working()) this.usersForm.disable();
                else this.usersForm.enable();
            });
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.firstItem.nativeElement.focus();
        }, 1000);
    }

    protected getError = (field: string) => {
        const control = this.usersForm.get(field);
        const errors = control?.errors ?? {};

        if (Object.keys(errors).length === 0) return null;
        if (!control!.touched) return null;

        const subject = field === "email" ? "The email" : "The email";

        if (errors["required"]) return subject + " is mandatory.";

        return subject + " is not valid.";
    };

    protected add = async () => {
        if (this.working()) return;

        const email = this.getValue("email");

        if (email == "") return;

        const exists = this.data.findIndex(v => v.email == email);

        if (exists >= 0) {
            const action = this.data[exists].action;

            if (action == "REMOVE") this.data[exists].action = "";
            else this.toast.error("User already exists");

            return;
        }

        const obs$ = this.repo.getUserByEmail(email);
        const users = await accessRepo(
            `Validating data in progress`,
            obs$,
            this.working,
            this.toast
        );
        this.toast.success("Successful validation.");

        const action = "NEW";
        let name = "";
        let userId = "";

        if (Array.isArray(users) && users.length) {
            const firstName = users[0].firstName ?? "";
            const lastName = users[0].lastName ?? "";

            name = `${firstName} ${lastName}`;
            userId = users[0]._id ?? "";
        }

        this.data.push({ email, userId, name, action });
    };

    protected setRemove = async (idx: number) => {
        if (this.working()) return;

        let action = this.data[idx].action

        if (action == "NEW") action = "SPLICE";
        else if (action == "REMOVE") action = "";
        else if (action == "INVITED") action = "REJECTED";
        else if (action == "REJECTED") action = "INVITED";
        else action = "REMOVE";

        if (action == "SPLICE")
            this.data.splice(idx, 1);
        else
            this.data[idx].action = action;

        this.toast.success("Successful removal.");
    };

    protected actualize = async () => {
        if (this.working()) return;

        const usersActualization = this.data.filter(
            user =>
                user.action == "NEW" ||
                user.action == "REMOVE" ||
                user.action == "REJECTED"
        );

        if (usersActualization.length == 0) return;

        try {
            const obs$ = this.collectionsRepo.actualizeUsers(
                this.collection?._id ?? "",
                usersActualization
            );
            await accessRepo(
                `Users update in progress`,
                obs$,
                this.working,
                this.toast
            );
            this.toast.success("Successful update.");
            this.dialogRef.close();
        } catch (err) {
            //TODO: SAVE DATA AND LOCATION BEFORE LOGING OUT.
            //TODO: Check on session error/expiration
            if (
                typeof err == "string" &&
                (
                    err == "refresh jwt expired" ||
                    (err.includes("Invalid") && err.includes("token"))
                )
            )
                this.dialogRef.close("logout");
        }
    };

    // Form Control helpers

    private getValue = (name: string) => this.usersForm.get(name)?.value;
    protected getCtrl = (name: string) =>
        this.usersForm.get(name) as FormControl;
    protected isSet = (name: string) => this.getValue(name) != "";
    protected set = (name: string, val: unknown) =>
        this.usersForm.get(name)?.setValue(val);
}
