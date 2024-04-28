import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter, Params } from "@infrastructure";
import { environment } from "@environments";
import { ICollection } from "@domain";

const url = `${environment.apiUrl}/collections`;

type UsersActualization = { email: string; name: string; action: string }[];
type Actualization = {
    stayLoggedIn?: boolean,
    twoFactor?: boolean,
    users: UsersActualization
};

type T = {
    collection?: ICollection;
    actualization?: Actualization
};

type V = ICollection[] | Actualization;

@Injectable({
    providedIn: "root",
})
export class CollectionsRepoService {
    logout() {
        throw new Error('Method not implemented.');
    }
    private dataSource: IHttpAdapter<T, V> = inject(HttpAdapter<T, V>);

    getCollections = (arg?: string | Params, action?: string) =>
        this.dataSource.get(url, arg, action);

    actualization = (collectionId: string, actualization: Actualization) =>
        this.dataSource.post({url, body: {actualization},
            action: "actualization", arg: collectionId});

    getUsers = (collectionId: string) =>
        this.dataSource.get(url, collectionId, "getUsers");

    // putCollection = (collection: ICollection) => this.dataSource.put(URL, collection);
    // addCollection = (collection: ICollection, action?: string) => this.dataSource.post(URL, collection, action);
    // deleteCollection = (id: string) => this.dataSource.delete(URL, id);
}
