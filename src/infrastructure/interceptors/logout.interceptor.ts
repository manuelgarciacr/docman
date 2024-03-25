import { type HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserService } from '@domain';
import { Observable } from 'rxjs';

export const logoutInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

    if (!req.url.endsWith("/accounts/logout")) return next(req);

    const userService = inject(UserService);
    const refreshToken = userService.refreshToken();
    const authReq = req.clone({
        headers: req.headers.set("Authorization", refreshToken)
    })

    return next(authReq)
};
