import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from '@angular/material/icon';
import { CollectionService, UserService } from '@domain';
import { AccountRepoService, BtnComponent, CollectionsRepoService, DlgComponent } from '@infrastructure';
import { NgIf } from '@angular/common';
import { HotToastService } from '@ngneat/hot-toast';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfigComponent, UsersComponent } from '@app';
import { accessRepo, isExpiredSession, isTokenError } from '@utils';
import { ComponentType } from '@angular/cdk/overlay';

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
    private readonly collectionsRepo = inject(CollectionsRepoService);
    private readonly repo = inject(AccountRepoService);
    private readonly toast = inject(HotToastService);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);

    private readonly collectionId =
        this.collectionService.collection()?._id ?? "";
    protected readonly working = signal<ReturnType<typeof setTimeout> | null>(
        null
    );

    protected isOwner = computed(() => this.userService.isOwner());
    protected hasDocuments = signal(false);
    protected hasGroup = signal(false);

    protected icon = this.isOwner() ? "supervisor_account" : "person";

    protected users = async () => {
        if (this.working()) return;

        const obs$ = this.collectionsRepo.getUsers(this.collectionId);

        await accessRepo(
            `Getting data in progress`,
            obs$,
            this.working,
            this.toast
        )
        .then(data =>
            this.openDialog(UsersComponent, data, ev => {
                console.log("EVEV", ev);
                if (ev == "OK") this.toast.success("Successful update.");
            })
        )
        // .catch(err =>
        //     isExpiredSession(err) ? this.dialogRef.close("EXPIRED SESSION")
        //     :isTokenError(err) ? this.dialogRef.close(err)
        //     : null
        // )
        // }))
        .catch(err =>
            this.tokenError(err as string)
        );
    };

    protected removeAccount = () => {
        const text =
            "Do you want to delete your account?<br> \
            Download all your documents before deleting the account. \
            Your documents will only be kept for a minimum of two months. \
            You can contact us at 'accounts@docman,com'";
        const title = "Delete account";

        this.openDialog(DlgComponent, { title, text }, ev =>
            console.log("RA", ev)
        );
    };

    protected accountManagement = async () => {
        if (this.working()) return;

        try {
            this.openDialog(ConfigComponent, {}, ev => {
                console.log("EVEV", ev);
                if (ev == "OK") this.toast.success("Successful update.");
            });
        } catch (err) {
            this.tokenError(err as string)
        }
    };

    protected logout = async (ev: string) => {
        if (this.working()) return;

        ev == "" ? ev : (ev += ". ");
        const obs$ = this.repo.logout();

        await accessRepo(
            `${ev}Logout in progress`,
            obs$,
            this.working,
            this.toast
        )
        .then(() => this.toast.success("Successful logout."))
        .finally(() => {
            this.userService.setUser(null);
            this.collectionService.setCollection(null);
            this.router.navigateByUrl("login", {
                replaceUrl: true,
            });
        });
    };

    private openDialog = (
        component: ComponentType<unknown>,
        data: object,
        callback: (ev: string) => void
    ) => {
        console.log("DATA", data);
        const ref = this.dialog.open(component, {
            minWidth: "24rem",
            maxWidth: "35rem",
            enterAnimationDuration: "1000ms",
            exitAnimationDuration: "1000ms",
            restoreFocus: false,
            backdropClass: "",
            panelClass: ["w-75", "w-sm-25"],
            data,
        });
        ref.afterClosed().subscribe(ev => {
            console.log("EVENTDLG", ev);
            callback(ev);
        });
    };

    private tokenError = (err: string) =>
        isExpiredSession(err as string) ? this.logout("EXPIRED SESSION")
        : isTokenError(err as string) ? this.logout(err as string)
        : null;
}
