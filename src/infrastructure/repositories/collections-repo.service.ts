import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter, Params } from "@infrastructure";
import { environment } from "@environments";
import { ICollection } from "@domain";

const URL = `${environment.apiUrl}/collections`;

@Injectable({
    providedIn: "root",
})
export class CollectionsRepoService {
    private dataSource: IHttpAdapter<ICollection> = inject(HttpAdapter<ICollection>);

    getCollections = (arg?: string | Params, action?: string) =>
        this.dataSource.get(URL, arg, action);
    // putCollection = (collection: ICollection) => this.dataSource.put(URL, collection);
    // addCollection = (collection: ICollection, action?: string) => this.dataSource.post(URL, collection, action);
    // deleteCollection = (id: string) => this.dataSource.delete(URL, id);
}
