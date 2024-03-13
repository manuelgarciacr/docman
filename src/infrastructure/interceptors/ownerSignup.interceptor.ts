import { HttpResponse, type HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { CollectionService, UserService } from '@domain';
import { Resp } from '@infrastructure';
import { Observable, finalize, map } from 'rxjs';
import { getTokenPayload } from '@utils';

export const ownerSignupInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

    const userService = inject(UserService);
    const collectionService = inject(CollectionService);
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
                    const body = event.body as Resp<string[]>;
                    const ownerToken = (body.data ?? [])[0];
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
                    const body = event.body as Resp<string[]>;
                    const refreshToken = (body.data ?? [])[0];
                    const accessToken = (body.data ?? [])[1];
                    const userStr = (body.data ?? [])[2];
                    const collectionStr = (body.data ?? [])[3];
                    const user = JSON.parse(userStr);
                    const collection = JSON.parse(collectionStr);

                    console.log("INTER", user, collection)

                    if (typeof refreshToken != "string" || refreshToken == "")
                        throw "Invalid refresh token."

                    if (typeof accessToken != "string" || accessToken == "")
                        throw "Invalid access token.";

                    userService.setRefreshToken(refreshToken);
                    userService.setAccessToken(accessToken);
                    userService.removeOwnerToken();
                    userService.setUser(user);
                    collectionService.setCollection(collection);

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
