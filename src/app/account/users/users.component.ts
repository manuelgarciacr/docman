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
import { trimFormControl } from '@utils';
import { HotToastService } from '@ngneat/hot-toast';
import { NgIf } from '@angular/common';
import { tap } from 'rxjs';

const DISMISS = {
    autoClose: false,
    dismissible: true,
};

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
    @ViewChild("firstItem") firstItem!: ElementRef;

    private readonly repo = inject(UsersRepoService);
    private readonly collectionsRepo = inject(CollectionsRepoService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly toast = inject(HotToastService);
    private readonly injector = inject(Injector);

    protected readonly data: [{ email: string; name: string; action: string }] =
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
        }, 0);
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

        const briefError = (err: string) => (err.split(":").pop() ?? "").trim();

        const timeout = setTimeout(() => {
            if (!this.working()) return;

            this.toast.loading(`Validating data in progress`, {
                autoClose: false,
                dismissible: true,
                id: "workingToast",
            });
        }, 500);

        this.working.set(timeout);

        this.repo
            .getUserByEmail(email)
            .pipe(
                tap({
                    next: resp => {
                        const err = briefError(resp.message.toString());

                        if (resp.status == 200) {
                            this.toast.success("Successful validation.");

                            const users = resp.data ?? [];
                            const action = "NEW";
                            let name = "-- no name --";

                            if (users.length) {
                                const firstName = users[0].firstName ?? "";
                                const lastName = users[0].lastName ?? "";
                                name = `${firstName} ${lastName}`;
                            }

                            this.data.push({ email, name, action });
                        } else {
                            this.toast.error(err, DISMISS);
                        }
                    },
                    // Operation failed; error is an HttpErrorResponse
                    error: _error => console.log("Validation error:", _error),
                    complete: () => {
                        clearTimeout(this.working() ?? undefined);
                        this.toast.close("workingToast");
                        this.working.set(null);
                    },
                })
            )
            .subscribe();
    };

    protected setRemove = async (idx: number) => {
        if (this.working()) return;

        if (this.data[idx].action == "NEW") this.data.splice(idx, 1);
        else if (this.data[idx].action == "REMOVE") this.data[idx].action = "";
        else this.data[idx].action = "REMOVE";

        this.toast.success("Successful removal.");
    };

    protected actualize = async () => {
        if (this.working()) return;

        const usersActualization = this.data.filter(
            user => user.action == "NEW" || user.action == "REMOVE"
        );

        if (usersActualization.length == 0)
            return;

        const briefError = (err: string) => (err.split(":").pop() ?? "").trim();

        const timeout = setTimeout(() => {
            if (!this.working()) return;

            this.toast.loading(`Data update in progress`, {
                autoClose: false,
                dismissible: true,
                id: "workingToast",
            });
        }, 500);

        this.working.set(timeout);

        this.collectionsRepo
            .actualizeUsers(usersActualization)
            .pipe(
                tap({
                    next: resp => {
                        const msg = resp.message;
                        const err = briefError(msg.toString());

                        if (resp.status == 200) {
                            this.toast.success("Successful update.");
                            this.dialogRef.close();
                        } else if (err == "refresh jwt expired"){
                            this.toast.error("EXPIRED SESSION", DISMISS);
                            //TODO: SAVE DATA AND LOCATION BEFORE LOGING OUT
                            this.dialogRef.close("logout");
                        } else if (err.includes("Invalid") && err.includes("token")){
                            this.toast.error(err, DISMISS);
                            this.dialogRef.close("logout");
                        } else {
                            this.toast.error(err, DISMISS);
                        }

                    },
                    // Operation failed; error is an HttpErrorResponse
                    error: _error => console.log("Data update error:", _error),
                    complete: () => {
                        clearTimeout(this.working() ?? undefined);
                        this.toast.close("workingToast");
                        this.working.set(null);
                    },
                })
            )
            .subscribe();
    };

    // Form Control helpers

    private getValue = (name: string) => this.usersForm.get(name)?.value;
    protected getCtrl = (name: string) =>
        this.usersForm.get(name) as FormControl;
    protected isSet = (name: string) => this.getValue(name) != "";
    protected set = (name: string, val: unknown) =>
        this.usersForm.get(name)?.setValue(val);
}
