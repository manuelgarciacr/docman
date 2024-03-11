import { Observable } from "rxjs";

export type resp<V> = {
    status: number,
    message: string | boolean,
    data: V[]
}

export type Resp<V> = {
    status: number,
    message: string | boolean,
    data?: V
}

export type Params = {
    [param: string]: string | number | boolean | readonly (string | number | boolean)[];
};

export interface IHttpAdapter<T, V> {
    get: (
        url: string,
        arg?: string | Params,
        action?: string
    ) => Observable<Resp<V>>; // Get all
    post: (data: {
        url: string;
        body?: T;
        arg?: string | Params;
        action?: string;
    }) => Observable<Resp<V>>;
    put: (url: string, data: T) => Observable<Resp<V>>;
    delete: (url: string, id: string) => Observable<Resp<V>>;
}

