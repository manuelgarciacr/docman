import { Observable, catchError, of, retry, timer } from "rxjs";
import { IHttpAdapter, Params, resp } from "./IHttpAdapter";
import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
    HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from "@angular/core";

const httpOptions = {
    headers: new HttpHeaders({
        "Content-Type": "application/json",
        //Authorization: 'my-auth-token',
    }),
    observe: "body" as const, // 'body' | 'events' | 'response',
    params: {},
    reportProgress: false,
    responseType: "json" as const,
    withCredentials: false,
};

@Injectable({
    providedIn: "root",
})
export class HttpAdapter<T> implements IHttpAdapter<T> {
    private http = inject(HttpClient); // HTTP service

    /**
     * Obtains the url and a parameter of type string or Params and from these formats the
     *   'url' and 'parms' parameters requested by the _get function.
     * If arg is of type string, it is added to the URL (Endpoint of type '/endpoint/:id')
     * If arg is of type Params (a typescript dictionary), the parameters are placed inside
     *   an object of type HttpParams. This object, within an HttpClient request, among other
     *   things, encodes the parameters to be added to the URL as query string parameters
     *   (Endpoint of type '/endpoint/?key1=value1&key2=value2&...')
     *
     * @param url string with the URL of the endpoint
     * @param action string with the name of an action to add to the URL
     * @param arg string or Params, a typescript dictionary with the params to be send
     * @returns The Observable of type resp<T> returned by the _get function
     */
    get = (
        url: string,
        arg?: string | Params,
        action?: string
    ): Observable<resp<T>> => {
        let params = new HttpParams(); // Query params

        if (typeof action != "undefined") url += `/${action}`;

        if (typeof arg == "string") url += `/${arg}`;
        else if (typeof arg == "object") params = params.appendAll(arg);
        else if (typeof arg != "undefined")
            throw new Error("Get param is invalid");

        return this._get(url, params);
    };

    /**
     * Get HTTP request
     *
     * @param url String with destination endpoint
     * @param params Type HttpParams. Query string parameters to send with the
     *   application/x-www-form-urlencode MIME type.
     * @returns An Observable of type <resp<T>> with the response from the server
     *   or an error description
     */
    private _get = (url: string, params: HttpParams) =>
        this.http
            .get<resp<T>>(url, { ...httpOptions, params })
            .pipe(
                retry({ count: 2, delay: this.shouldRetry }),
                catchError(this.handleError<T>("http get"))
            );

    put = (url: string, data: T) => {
        return this.http
            .put<resp<T>>(url, data, httpOptions)
            .pipe(
                retry({ count: 2, delay: this.shouldRetry }),
                catchError(this.handleError<T>("http put"))
            );
    };

    post = (url: string, data: T, action?: string) => {

        if (typeof action != "undefined") url += `/${action}`;

        return this.http
            .post<resp<T>>(url, data, httpOptions)
            .pipe(
                retry({ count: 2, delay: this.shouldRetry }),
                catchError(this.handleError<T>("http post"))
            );
    };

    delete = (url: string, id: string) => {
        return this.http
            .delete<resp<T>>(`${url}/${id}`, httpOptions)
            .pipe(
                retry({ count: 2, delay: this.shouldRetry }),
                catchError(this.handleError<T>("http delete"))
            );
    };

    /**
     * This function returns a function that takes an HttpErrorResponse and
     *   returns an Observable of type resp<T> with the error status, the error
     *   description, and empty data.
     * The IHttpAdapter uses this type of response.
     *
     * @param operation String with the name or description of the process that
     *   returned the error
     * @returns Function of type (HttpErrorResponse) => Observable<resp<T>>
     */
    private handleError<T>(operation: string) {
        return (error: HttpErrorResponse): Observable<resp<T>> => {
            const status = error.status;
            const message =
                error instanceof HttpErrorResponse
                    ? error.message
                    : (error as Error).message;
            const data = [] as Array<T>; // error.error;

            console.log(`${operation} failed: ${message}`, error);

            // Let the app keep running by returning a safe result.
            return of({ status, message, data });
        };
    }

    // A custom method to check should retry a request or not
    // Retry when the status code is not 404
    private shouldRetry(error: HttpErrorResponse) {
        if (error.status != 404) {
            return timer(1000); // Adding a timer from RxJS to return observable<0> to delay param.
        }

        throw error;
    }
}
