import { HttpResponse, type HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { CollectionService, UserService } from '@domain';
import { Resp } from '@infrastructure';
import { Observable, catchError, tap } from 'rxjs';
import { getTokenPayload } from '@utils';

export const ownerSignupInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

    const userService = inject(UserService);
    const collectionService = inject(CollectionService);

    if (req.url.endsWith("/accounts/ownerSignup")) {
        return next(req).pipe(
            tap(event => {
                try {
                    if (
                        event instanceof HttpResponse &&
                        event.status == 200
                    ) {

                        const ownerToken = event.headers.get("X-ownctx"); // (body.data ?? [])[0];

                        // If the token is not returned, a validation is already in progress
                        if (typeof ownerToken != "string") return;

                        const payload = getTokenPayload(ownerToken);

                        userService.setOwnerToken(ownerToken);
                        userService.setValidationExp(payload.exp);
                        userService.setValidationIat(payload.iat);

                        // throw "IERROR"
                    }
                } catch (err) {
                    const error = (err as object).toString();
                    throw {
                        status: 601,
                        message: `Interceptor error: ${error.toString()}`,
                        data: [],
                    };
                }
            }),
            catchError(err => {
                // tap error or HttpErrorResponse
                console.log("Interceptor catchError:", err);
                throw err;
            })
        );
    }

    if (req.url.endsWith("/accounts/ownerValidation")) {
        const ownerToken = userService.ownerToken();
        const code = userService.validationCode();
        const authReq = req.clone({
            headers: req.headers
                .set("Authorization", ownerToken)
                .set("X-Code", code),
        });
        return next(authReq).pipe(
            tap(event => {
                try {
                    if (event instanceof HttpResponse && event.status == 200) {
                        const body = event.body as Resp<string[]>;
                        const userStr = (body.data ?? [])[0];
                        const collectionStr = (body.data ?? [])[1];

                        if (typeof userStr != "string" || userStr == "")
                            throw "Invalid user.";

                        if (
                            typeof collectionStr != "string" ||
                            collectionStr == ""
                        )
                            throw "Invalid collection.";

                        const refreshToken = event.headers.get("X-refctx"); // (body.data ?? [])[0];
                        const accessToken = event.headers.get("X-ctectx"); // (body.data ?? [])[1];

                        if (
                            typeof refreshToken != "string" ||
                            refreshToken == ""
                        )
                            throw "Invalid refresh token.";

                        if (typeof accessToken != "string" || accessToken == "")
                            throw "Invalid access token.";

                        const user = JSON.parse(userStr);
                        const collection = JSON.parse(collectionStr);

                        userService.setUser(user, true, true); // Clears all data but user and isOwner
                        userService.setRefreshToken(refreshToken);
                        userService.setAccessToken(accessToken);
                        collectionService.setCollection(collection);

                        // throw "IERROR"
                    }
                } catch (err) {
                    const error = (err as object).toString();
                    throw {
                        status: 601,
                        message: `Interceptor error: ${error.toString()}`,
                        data: [],
                    };
                }
            }),
            catchError(err => {
                // tap error or HttpErrorResponse
                console.log("Interceptor catchError:", err);
                throw err;
            })
        );
    }

    return next(req);
};
