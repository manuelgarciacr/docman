import { Observable } from "rxjs";

export type resp<T> = {
    message: string | boolean,
    data: T[]
}

export type Params = {
    [param: string]: string | number | boolean | readonly (string | number | boolean)[];
};

export interface IHttpAdapter<T> {

    get: (url: string, arg?: string | Params, action?: string) => Observable<resp<T>>; // Get all
    put: (url: string, data: T) => Observable<resp<T>>;
    post: (url: string, data: T, action?: string) => Observable<resp<T>>;
    delete: (url: string, id: string) => Observable<resp<T>>;
}

