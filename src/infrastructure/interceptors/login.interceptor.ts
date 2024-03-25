import {
    HttpResponse,
    type HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { CollectionService, UserService } from "@domain";
import { Resp } from "@infrastructure";
import { Observable, finalize, map } from "rxjs";

export const loginInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const userService = inject(UserService);
    const collectionService = inject(CollectionService);

    if (!req.url.endsWith("/accounts/login"))
        return next(req);

    return next(req).pipe(

        map(event => {
            if (!(event instanceof HttpResponse) ||
                !event.url?.endsWith("/accounts/login")
            ) {
                console.log("NOT RESPONSE OR NOT LOGIN",
                    (event instanceof HttpResponse),
                    event.type,
                    event)
            }

            if (
                event instanceof HttpResponse &&
                event.url?.endsWith("/accounts/login") &&
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

                    if (typeof refreshToken != "string" || refreshToken == "")
                        throw "Invalid refresh token.";

                    if (typeof accessToken != "string" || accessToken == "")
                        throw "Invalid access token.";

                    userService.setRefreshToken(refreshToken);
                    userService.setAccessToken(accessToken);
                    userService.setValidationCode("");
                    userService.removeOwnerToken();
                    userService.setUser(user);
                    collectionService.setCollection(collection);
                } catch (error) {
                    let errorMsg = "";

                    if (typeof error == "string") errorMsg = error;

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
        finalize(() => {})
    );

};
