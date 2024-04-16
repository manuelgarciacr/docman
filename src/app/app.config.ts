import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHotToastConfig } from "@ngneat/hot-toast";
import { loginInterceptor, ownerSignupInterceptor, forgotPasswordInterceptor, defaultInterceptor } from 'infrastructure/interceptors';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideAnimations(),
        provideHttpClient(
            withInterceptors([
                ownerSignupInterceptor,
                loginInterceptor,
                forgotPasswordInterceptor,
                defaultInterceptor // Must be the last one
            ])
        ),
        provideHotToastConfig({ position: "bottom-right", autoClose: true, dismissible: false }), // @ngneat/hot-toast providers
    ],
};
