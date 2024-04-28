import {
    HttpResponse,
    type HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { UserService } from "@domain";
import { Observable, catchError, filter, tap } from "rxjs";

export const defaultInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const userService = inject(UserService);

    if (!req.url.includes("/accounts/")) {
        const accessToken = userService.accessToken();
        const authReq = req.clone({
            headers: req.headers.set("Authorization", `Bearer ${accessToken}`),
        });
        return next(authReq).pipe(
            catchError(err => {
                // tap error or HttpErrorResponse
                const msg = typeof err.error == "string"
                    ? err.error
                    : err.error.message;

                if (msg == "jwt expired") {
                    const refreshToken = userService.refreshToken();
                    const authReq = req.clone({
                        headers: req.headers.set(
                            "Authorization",
                            `Bearer ${refreshToken}`
                        ),
                    });
                    return next(authReq).pipe(
                        filter(
                            event =>
                                event instanceof HttpResponse &&
                                event.status == 200
                        ),
                        tap(event => {
                            console.log("TAP INTERCEPTOR", event)
                            if (!(event instanceof HttpResponse)) return;

                            const refreshToken = event.headers.get("X-refctx"); // (body.data ?? [])[0];
                            const accessToken = event.headers.get("X-ctectx"); // (body.data ?? [])[1];

                            if (typeof refreshToken != "string" || refreshToken == "")
                                throw {error: "Invalid new refresh token:Token error"};

                            if (typeof accessToken != "string" || accessToken == "")
                                throw {error: "Invalid new access token:Token error"};

                            userService.setRefreshToken(refreshToken);
                            userService.setAccessToken(accessToken);

                        }),
                        catchError(err => {
                            // tap error (string) or HttpErrorResponse
                            console.log("Interceptor refresh catchError:", JSON.stringify(err));
                            const message =
                                typeof err.error == "string"
                                    ? err.error
                                    : err.error.message;
                            const error = {
                                status: 601,
                                message,
                                data: []
                            }
                            if (message == "jwt expired") {
                                error.message = "refresh jwt expired"

                            }
                            throw error;
                        })
                    );
                }
                console.log("Interceptor access catchError:", err);
                throw err;
            })
        );
    }

    return next(req);
};
