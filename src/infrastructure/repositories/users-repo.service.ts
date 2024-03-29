import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter, Params } from "@infrastructure";
import { environment } from "@environments";
import { IUser } from "@domain";

const URL = `${environment.apiUrl}/users`;

@Injectable({
    providedIn: "root",
})
export class UsersRepoService {
    private dataSource: IHttpAdapter<IUser, IUser[]> = inject(
        HttpAdapter<IUser, IUser[]>
    );
    // private _users: IUser[] = [];
    // get users(): IUser[] {
    //     return this._users;
    // }

    getUser = (id: string) =>
        this.dataSource.get(URL, id);
    // getUserByEmail = (email: string) =>
    //     this.dataSource.get(URL, {"email": email});
    getUsers = (arg?: string | Params, action?: string) => this.dataSource.get(URL, arg, action);
    // putUser = (user: IUser) => this.dataSource.put(URL, user);
    // addUser = (user: IUser, action?: string) => this.dataSource.post(URL, user, action);
    // deleteUser = (id: string) => this.dataSource.delete(URL, id);
}
