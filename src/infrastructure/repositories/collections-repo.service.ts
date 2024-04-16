import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter, Params } from "@infrastructure";
import { environment } from "@environments";
import { ICollection } from "@domain";

const url = `${environment.apiUrl}/collections`;

type UsersActualization = {email: string, name: string, action: string}[];

type T = {
    collection?: ICollection;
    usersActualization?: UsersActualization
};

type V = ICollection[];

@Injectable({
    providedIn: "root",
})
export class CollectionsRepoService {
    private dataSource: IHttpAdapter<T, V> = inject(HttpAdapter<T, V>);

    getCollections = (arg?: string | Params, action?: string) =>
        this.dataSource.get(url, arg, action);

    actualizeUsers = (usersActualization: UsersActualization) =>
        this.dataSource.post({url, body: {usersActualization}, action: "actualizeUsers"});

    // putCollection = (collection: ICollection) => this.dataSource.put(URL, collection);
    // addCollection = (collection: ICollection, action?: string) => this.dataSource.post(URL, collection, action);
    // deleteCollection = (id: string) => this.dataSource.delete(URL, id);
}
