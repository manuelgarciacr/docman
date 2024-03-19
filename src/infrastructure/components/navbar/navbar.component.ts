import { AfterViewInit, Component, ElementRef, OnInit, computed, inject, signal } from '@angular/core';
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
        UserMenuComponent,
    ],
})
export class NavbarComponent implements OnInit, AfterViewInit {
    ngAfterViewInit(): void {
        const svgArray = this.elem.nativeElement.querySelectorAll(".cls-svg-little");
        for (const k of Array(5).keys()) {
            for (const svg of svgArray) {
                const cl = svg.cloneNode(true);
                cl.setAttribute("id", `id${k}`)
                svg.parentElement.appendChild(cl);
            }
        }
        setTimeout(() =>
            this.elem.nativeElement
                .querySelectorAll(".cls-svg-little")
                .forEach((v: HTMLElement, k: number) => {
                    const seg = 4 + k * 0.25;

                    (v as HTMLElement).style.setProperty(
                        "transition",
                        `all ${seg}s linear`
                    );
                    v.addEventListener(
                        "transitionend",
                        event => this.newPos(event.target as HTMLElement, event.propertyName),
                        false
                    );
                    this.newPos(v);
                }))
    }
    private readonly media = inject(MediaMatcher);
    private readonly router = inject(Router);
    private readonly userService = inject(UserService);
    private readonly elem = inject(ElementRef);

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
    protected isAuthenticated = computed(() =>
        this.userService.isAuthenticated()
    );

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
    }

    ngOnDestroy(): void {
        this.matcher.removeEventListener("change", this.matcherListener);
        this.routerSubscription.unsubscribe();
    }

    public onRouterOutletActivate(event: Component) {
        this.signupComponent = event as SignupComponent;
    }

    private newPos = (svg: HTMLElement, property: string = "transform") => {

        if (property != "transform")
            return;

        const _deg = svg.style.getPropertyValue("--deg");
        const _side = parseInt(svg.style.getPropertyValue("--side"));
        let top, left, side: number;

        const pos = Math.random() * 85; // 100% - 15%
        const deg = _deg == "0deg" ? "360deg" : "0deg";
        do {
            side = Math.floor(Math.random() * 4);
        } while(side == _side)

        switch (side) {
            case 0:
                top = 0;
                left = pos;
                break;
            case 1:
                top = pos;
                left = 85;
                break;
            case 2:
                top = 85;
                left = pos;
                break;
            default:
                top = pos;
                left = 0;
        }

        svg.style.setProperty("--deg", `${deg}`);
        svg.style.setProperty("--top", `${top}%`);
        svg.style.setProperty("--left", `${left}%`);
        svg.style.setProperty("--side", `${side}`);
    };

}
