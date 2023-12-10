import { Routes } from '@angular/router';

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
        data: { trn: "Login" },
    },
    // {
    //     path: "register",
    //     loadComponent: () => import("@app").then(c => c.RegisterComponent),
    //     data: { label: "Register" },
    // },

    // otherwise redirect to home or error page
    { path: "", redirectTo: "/login", pathMatch: "full" },
    {
        path: "**",
        loadComponent: () => import("@app").then(c => {console.log("PEPE"); return c.E404Component}),
    },
];

