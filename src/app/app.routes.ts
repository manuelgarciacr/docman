import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { UserService } from '@domain';

const canActivateUser: CanActivateFn = () =>
    inject(UserService).isAuthenticated()
        ? true
        : inject(Router).createUrlTree(['/login']);
const canActivateNotUser: CanActivateFn = () =>
    inject(UserService).isAuthenticated()
        ? inject(Router).createUrlTree(["/test"])
        : true;

export const routes: Routes = [
    // {
    //     path: "home",
    //     loadComponent: () =>
    //         // Lazy load component
    //         import("@app").then(c => c.HomeComponent),
    //     data: { label: "Home" },
    //     canActivate: [authGuard],
    // },
    // {
    //     path: "users",
    //     loadChildren: () => import("@app").then(c => c.usersRoutes),
    //     data: { label: "Users" },
    //     canActivate: [authGuard],
    // },
    {
        path: "login",
        loadComponent: () => import("@app").then(c => c.LoginComponent),
        data: { accounting: true },
        canActivate: [canActivateNotUser],
    },
    {
        path: "signup",
        loadComponent: () => import("@app").then(c => c.SignupComponent),
        data: { accounting: true },
        canActivate: [canActivateNotUser],
    },
    {
        path: "validation",
        loadComponent: () => import("@app").then(c => c.ValidationComponent),
        data: { accounting: true },
        canActivate: [canActivateNotUser],
    },
    {
        path: "test",
        loadComponent: () => import("@app").then(c => c.TestComponent),
        data: { trn: "Test" },
        canActivate: [canActivateUser],
    },
    // otherwise redirect to login or error page
    { path: "", redirectTo: "/login", pathMatch: "full" },
    {
        path: "**",
        loadComponent: () =>
            import("@app").then(c => {
                return c.E404Component;
            }),
    },
];

