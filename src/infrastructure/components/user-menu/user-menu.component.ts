import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from '@angular/material/icon';
import { CollectionService, UserService } from '@domain';
import { AccountRepoService, BtnComponent, DlgComponent, UsersRepoService } from '@infrastructure';
import { NgIf } from '@angular/common';
import { HotToastService } from '@ngneat/hot-toast';
import { map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UsersComponent } from '@app';

const DISMISS = {
    autoClose: false,
    dismissible: true,
};

@Component({
    selector: "user-menu",
    standalone: true,
    imports: [
        NgIf,
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        BtnComponent,
        MatDialogModule,
    ],
    templateUrl: "./user-menu.component.html",
    styleUrl: "./user-menu.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
    private readonly userService = inject(UserService);
    private readonly collectionService = inject(CollectionService);
    private readonly usersRepo = inject(UsersRepoService);
    private readonly repo = inject(AccountRepoService);
    private readonly toast = inject(HotToastService);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);

    private logging: ReturnType<typeof setTimeout> | null = null;

    protected isOwner = computed(() => this.userService.isOwner());
    protected hasDocuments = signal(false);
    protected hasGroup = signal(false);

    protected icon = this.isOwner() ? "supervisor_account" : "person";

    protected users = async () => {
        const users = this.collectionService.collection()?.users ?? [];
        const roles = this.collectionService.collection()?.roles ?? [];
        const data: Array<{email: string, name: string, action: string}> = [];

        users.forEach((userId, idx) => {
            this.usersRepo
                .getUser(userId)
                .pipe(
                    map(resp => {
                        const user = (resp.data ?? [])[0];
                        const email = user.email;
                        const firstName = user.firstName;
                        const lastName = user.lastName;
                        const name = `${firstName} ${lastName}`;
                        const action = roles[idx] == "owner" ? "OWNER" : "";
                        return {email, name, action}
                    }),
                    tap(user => {
                        if (user.action == "OWNER")
                            data.unshift(user);
                        else
                            data.push(user)
                    })
                ).subscribe()
        })
        const ref = this.dialog.open(UsersComponent, {
            maxWidth: "30rem",
            enterAnimationDuration: "1000ms",
            exitAnimationDuration: "1000ms",
            restoreFocus: false,
            backdropClass: "",
            panelClass: ["w-75", "w-sm-25"],
            data,
        });
        ref.afterClosed().subscribe(ev => {
            console.log("EVENTDLG", ev);
            if (ev == "logout")
                this.logout();
        });
    };

    protected removeAccount = () => {
        const text =
            "Do you want to delete your account?<br> \
            Download all your documents before deleting the account. \
            Your documents will only be kept for a minimum of two months. \
            You can contact us at 'accounts@docman,com'";
        const title = "Delete account";
        const ref = this.dialog.open(DlgComponent, {
            maxWidth: "30rem",
            enterAnimationDuration: "1000ms",
            exitAnimationDuration: "1000ms",
            restoreFocus: false,
            backdropClass: "pepe",
            panelClass: ["w-75", "w-sm-25"],
            data: {title, text}
        });
        ref.afterClosed().subscribe(ev => {
            console.log("EVENTDLG", ev);
        });
    };

    protected logout = () => {
        if (this.logging) return;

        this.logging = setTimeout(() => {
            if (!this.logging) return;

            this.toast.loading(`Logout in progress`, {
                autoClose: false,
                dismissible: true,
                id: "loggingToast",
            });
        }, 500);

        this.repo
            .logout()
            .pipe(
                tap({
                    next: resp => {
                        const err = this.briefError(resp.message.toString());

                        if (resp.status == 200) {
                            this.toast.success("Successful logout.");
                        } else {
                            this.toast.error(err, DISMISS);
                        }
                    },
                    // Operation failed; error is an HttpErrorResponse
                    error: _error => console.log("logout error:", _error),
                    complete: () => {
                        clearTimeout(this.logging ?? undefined);
                        this.toast.close("loggingToast");
                        this.userService.setUser(null);
                        this.collectionService.setCollection(null);
                        this.logging = null;
                        this.router.navigateByUrl("login", {
                            replaceUrl: true,
                        });
                    },
                })
            )
            .subscribe({
                next: () => {},
                error: err => console.error("LOGOUT", err),
            });
    };

    private briefError = (err: string) => (err.split(":").pop() ?? "").trim();
}
