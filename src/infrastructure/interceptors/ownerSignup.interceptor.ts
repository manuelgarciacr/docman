import { HttpResponse, type HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserService } from '@domain';
import { resp } from 'infrastructure/adapters/IHttpAdapter';
import { Observable, finalize, map } from 'rxjs';
import { getTokenPayload } from '@utils';

export const ownerSignupInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

    const userService = inject(UserService);
    let authReq = req;

    if (
        req.url.endsWith("/accounts/ownerValidation")
    ) {
        const ownerToken = userService.ownerToken();
        const code = userService.validationCode();
        authReq = req.clone({
            headers: req.headers.set("Authorization", ownerToken)
                .set("code", code),
        });
    }
    return next(authReq).pipe(
        map(event => {

            if (
                event instanceof HttpResponse &&
                event.url?.endsWith("/accounts/ownerSignup") &&
                event.status == 200
            ) {
                try {
                    const ownerToken = (event.body as resp<string>).data[0];
                    const payload = getTokenPayload(ownerToken);
                    const expiration = payload.exp - payload.iat;

                    userService.setOwnerToken(ownerToken);
                    userService.setValidationExpiration(expiration);

                } catch (error) {
                    const newEvent = event.clone({
                        status: 601,
                        statusText: "Interceptor error",
                        body: {
                            status: 601,
                            message: "Interceptor error",
                            data: [],
                        },
                    });
                    console.log("Interceptor error:", error);
                    return newEvent;
                }
            }
            if (
                event instanceof HttpResponse &&
                event.url?.endsWith("/accounts/ownerValidation") &&
                event.status == 200
            ) {
                try {
                    const refreshToken = (event.body as resp<string>).data[0];
                    const accessToken = (event.body as resp<string>).data[1];

                    if (typeof refreshToken != "string" || refreshToken == "")
                        throw "Invalid refresh token."

                    if (typeof accessToken != "string" || accessToken == "")
                        throw "Invalid access token.";

                    userService.setRefreshToken(refreshToken);
                    userService.setAccessToken(accessToken);
                    userService.removeOwnerToken();

                } catch (error) {
                    let errorMsg = "";

                    if (typeof error == "string")
                        errorMsg = error;

                    const newEvent = event.clone({
                        status: 601,
                        statusText: `Interceptor error. ${errorMsg}`,
                        body: {
                            status: 601,
                            message: `Interceptor error. ${errorMsg}`,
                            data: [],
                        },
                    });
                    console.error("Interceptor error:", error);
                    return newEvent;
                }
            }
            return event;
        }),
        /* tap({
            next: event => {
                return next(req);
            },
            complete: () => {},
            // Operation failed; error is an HttpErrorResponse
            error: _error => console.log("ownerSignupInterceptor error:", _error),
        }), */
        finalize(() => {})
    );
};
