import { Component, OnInit, inject, signal } from '@angular/core';
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
import { BtnComponent, ToggleThemeComponent } from '@infrastructure';
import { RouterOutlet } from "@angular/router";
import { Subscription, filter } from 'rxjs';
import { SignupComponent } from '@app';

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
    ],
})
export class NavbarComponent implements OnInit {
    protected accounting = signal(false);
    private media = inject(MediaMatcher);
    private matcher = this.media.matchMedia("(max-width: 600px)");
    protected isMobile = signal(this.matcher.matches);
    private matcherListener = (e: MediaQueryListEvent) =>
        this.isMobile.set(e.matches ? true : false);
    private router = inject(Router);
    private routerSubscription: Subscription = new Subscription();
    protected isMenuCollapsed = true;
    // protected themeState = {
    //     svg: ["moon-stars-fill", "sun-fill"],
    //     alt: ["Moon icon", "Sun icon"],
    //     title: ["Set the dark theme", "Set the light theme"],
    //     state: 0, // 0: Light theme set, the icon shows the moon.
    // };
    // protected langState = {
    //     svg: ["es", "en"],
    //     alt: ["Spanish flag", "British flag"],
    //     title: ["Set the english language", "Set the spanish language"],
    //     state: 0, // 0: English language set, the icon shows the spanish flag.
    // };
    //protected paths: Route[] = [];
    // protected links = routes
    //     .map(route => route.path)
    //     .filter(r => r != "" && r != "**"); //["Home", "Map", "Full Calendar", "Graphics"];
    protected links: Route[] = [];
    protected activeLink = signal("");
    protected hasBackBtn = () =>
        this.isMobile() && this.activeLink() == "/signup";
    //@ViewChild("routeroutlettag", { static: true }) routeroutlet!: RouterOutlet;
    protected signupComponent!: SignupComponent;
    // constructor(
    //     //private conf: ConfigurationService,
    //     protected translate: TranslateService,
    //     private router: Router
    // ) {
    //     //this.setThemeState(conf.theme);
    //     //this.setLangState(conf.locale);
    //     this.paths = routes.filter(v => v.data?.["trn"] != undefined);
    //     this.links = routes.filter(v => v.data?.["trn"] != undefined);
    //     this.activeLink = this.links[0];
    // }
    constructor() {
        // private host: ElementRef // media: MediaMatcher, // changeDetectorRef: ChangeDetectorRef, // protected translate: TranslateService, // private _mobileQueryListener: () => void;
        //this._mobileQueryListener = () => changeDetectorRef.detectChanges();
        //this.mobileQuery.addListener(this._mobileQueryListener);
    }

    ngOnInit(): void {
        // noDragging(this.host);
        this.matcher.addEventListener("change", this.matcherListener);
        this.routerSubscription = this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe(e => {
                this.activeLink.set(e.url);
                const route = routes.find(v => e.url.endsWith(v.path!));
                this.accounting.set(route?.data?.["accounting"] ?? false);
                console.log("LNK", e, route, this.accounting())
            });
        //this.paths = routes.filter(v => v.data?.["trn"] != undefined);
        this.links = routes.filter(v => v.data?.["trn"] != undefined);
        //this.activeLink = this.links[0].path;
    }

    // ngAfterContentInit(): void {
    //     console.log("AC", this.routeroutlet);
    // }

    ngOnDestroy(): void {
        this.matcher.removeEventListener("change", this.matcherListener);
        this.routerSubscription.unsubscribe();
    }

    // protected callSetData = () => {
    //     console.log("RO", this.routeroutlet);
    //     console.log("ROC", this.routeroutlet.component);
    //     //alert("WWWW");
    //     const childcomp = this.routeroutlet.component as SignupComponent;
    //     childcomp.setData();
    // };

    public onRouterOutletActivate(event: Component) {
        this.signupComponent = event as SignupComponent;
    }
    // protected toggleTheme() {
    //     this.setThemeState(this.conf.toggleTheme());
    // }

    // private setThemeState(theme: string) {
    //     if (theme == "light") this.themeState.state = 0;
    //     else this.themeState.state = 1;
    // }

    // protected toggleLang() {
    //     this.setLangState(this.conf.toggleLocale());
    // }

    // private setLangState(lang: string) {
    //     console.group("SLS", lang);
    //     if (lang == "en") this.langState.state = 0;
    //     else this.langState.state = 1;
    // }
}
