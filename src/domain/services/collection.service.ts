import { Injectable, signal } from "@angular/core";
import { ICollection } from "@domain";

@Injectable({
    providedIn: 'root',
})
export class CollectionService {
    private _collection = signal<ICollection | null>(null);

    readonly collection = this._collection.asReadonly();

    setCollection = (collection: ICollection | null) => {

        if (collection) {
            const { _id, name, description, users, roles, documents, enabled } = collection;
            collection = {
                _id,
                name,
                description,
                users,
                roles,
                documents,
                enabled
            };
        }

        this._collection.set(collection);
        // const users = newCollection?.users;
        // const roles = newCollection?.roles;
        console.log("SETCOL", this.collection())
    }
}
