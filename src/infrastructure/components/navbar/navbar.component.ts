import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
// import { TranslateModule, TranslateService } from '@ngx-translate/core';
// import { noDragging } from 'utils/noDragging';
import { NavigationEnd, Route, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { routes } from 'app/app.routes';
// import { ToggleThemeComponent } from "../toggle-theme/toggle-theme.component";
// import { ToggleLangComponent } from "../toggle-lang/toggle-lang.component";
// import { LoginControlComponent } from "../login-control/login-control.component";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTabsModule } from "@angular/material/tabs";
import { MediaMatcher } from "@angular/cdk/layout";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { BtnComponent, ToggleThemeComponent, UserMenuComponent } from '@infrastructure';
import { RouterOutlet } from "@angular/router";
import { Subscription, filter } from 'rxjs';
import { SignupComponent } from '@app';
import { UserService } from '@domain';

@Component({
    selector: "navbar",
    standalone: true,
    templateUrl: "./navbar.component.html",
    styleUrls: ["./navbar.component.scss"],
    imports: [
        // CommonModule,
        // NgbDropdownModule,
        // NgbCollapse,
        NgFor,
        NgIf,
        // TranslateModule,
        RouterLink,
        RouterLinkActive,
        // ToggleThemeComponent,
        // ToggleLangComponent,
        // LoginControlComponent,
        MatTabsModule,
        MatToolbarModule,
        MatIconModule,
        MatTabsModule,
        MatSidenavModule,
        MatListModule,
        ToggleThemeComponent,
        RouterOutlet,
        BtnComponent,
        SignupComponent,
        UserMenuComponent
    ]
})
export class NavbarComponent implements OnInit {
    private readonly media = inject(MediaMatcher);
    private readonly router = inject(Router);
    private readonly userService = inject(UserService);

    private matcher = this.media.matchMedia("(max-width: 600px)");
    private routerSubscription: Subscription = new Subscription();

    protected accounting = signal(false);
    protected isMobile = signal(this.matcher.matches);
    private matcherListener = (e: MediaQueryListEvent) =>
        this.isMobile.set(e.matches ? true : false);
    protected isMenuCollapsed = true;
    protected links: Route[] = [];
    protected activeLink = signal("");
    protected hasBackBtn = () =>
        this.isMobile() && this.activeLink() == "/signup";
    protected signupComponent!: SignupComponent;
    protected isAuthenticated = computed(() => this.userService.isAuthenticated());

    ngOnInit(): void {
        // noDragging(this.host);
        this.matcher.addEventListener("change", this.matcherListener);
        this.routerSubscription = this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe(e => {
                this.activeLink.set(e.url);
                const route = routes.find(v => e.url.endsWith(v.path!));
                this.accounting.set(route?.data?.["accounting"] ?? false);
            });
        this.links = routes.filter(v => v.data?.["trn"] != undefined);
        console.log("ISATH", this.userService.user(), this.isAuthenticated())
    }

    ngOnDestroy(): void {
        this.matcher.removeEventListener("change", this.matcherListener);
        this.routerSubscription.unsubscribe();
    }

    public onRouterOutletActivate(event: Component) {
        this.signupComponent = event as SignupComponent;
    }
}
