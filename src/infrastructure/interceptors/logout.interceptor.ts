import { type HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserService } from '@domain';
import { Observable } from 'rxjs';

export const logoutInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

    const userService = inject(UserService);
    let authReq = req;

    if (
        req.url.endsWith("/accounts/logout")
    ) {
        const refreshToken = userService.refreshToken();

        authReq = req.clone({
            headers: req.headers.set("Authorization", refreshToken)
        })
    }
    return next(authReq)
};
