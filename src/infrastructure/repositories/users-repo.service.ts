import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter, Params } from "@infrastructure";
import { environment } from "@environments";
import { IUser } from "@domain";

const URL = `${environment.apiUrl}/users`;

@Injectable({
    providedIn: "root",
})
export class UsersRepoService {
    private dataSource: IHttpAdapter<IUser> = inject(HttpAdapter<IUser>);
    // private _users: IUser[] = [];
    // get users(): IUser[] {
    //     return this._users;
    // }

    getUsers = (arg?: string | Params) => this.dataSource.get(URL, arg);
    putUser = (user: IUser) => this.dataSource.put(URL, user);
    addUser = (user: IUser) => this.dataSource.post(URL, user);
    deleteUser = (id: string) => this.dataSource.delete(URL, id);
}
