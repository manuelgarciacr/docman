import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '@domain';
import { AccountRepoService, BtnComponent } from '@infrastructure';
import { NgIf } from '@angular/common';
import { HotToastService } from '@ngneat/hot-toast';
import { tap } from 'rxjs';
import { Router } from '@angular/router';

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
    ],
    templateUrl: "./user-menu.component.html",
    styleUrl: "./user-menu.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnInit {
    private readonly userService = inject(UserService);
    private readonly repo = inject(AccountRepoService);
    private readonly toast = inject(HotToastService);
    private readonly router = inject(Router);

    private logging: ReturnType<typeof setTimeout> | null = null;
    protected isOwner = computed(() => this.userService.isOwner());
    protected hasDocuments = signal(false);
    protected hasGroup = signal(false);

    protected icon = this.isOwner() ? "supervisor_account" : "person";

    ngOnInit(): void {
        console.log(this.userService.user());
    }

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
                            //this.router.navigateByUrl("test");
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
                        this.router.navigateByUrl("login");
                        this.logging = null;
                    },
                })
            )
            .subscribe({
                next: resp => {
                    console.log(resp);
                },
                error: err => console.error("LOGOUT", err),
            });
    };

    private briefError = (err: string) => (err.split(":").pop() ?? "").trim();
}
