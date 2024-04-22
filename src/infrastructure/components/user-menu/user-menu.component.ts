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
import { UsersComponent } from '@app';
import { accessRepo } from '@utils';

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
        const data = await accessRepo(
            `Getting data in progress`,
            obs$,
            this.working,
            this.toast
        );

        console.log("DATA", data);
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
            if (ev == "logout") this.logout();
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
            data: { title, text },
        });
        ref.afterClosed().subscribe(ev => {
            console.log("EVENTDLG", ev);
        });
    };

    protected logout = async () => {
        if (this.working()) return;

        try {
            const obs$ = this.repo.logout();
            await accessRepo(
                `Logout in progress`,
                obs$,
                this.working,
                this.toast
            );
            this.toast.success("Successful logout.");
        }
        finally {
            this.userService.setUser(null);
            this.collectionService.setCollection(null);
            this.router.navigateByUrl("login", {
                replaceUrl: true,
            });
        }

    };
}
