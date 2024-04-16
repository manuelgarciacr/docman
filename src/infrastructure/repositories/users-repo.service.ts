import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter, Params } from "@infrastructure";
import { environment } from "@environments";
import { IUser } from "@domain";

const url = `${environment.apiUrl}/users`;

type T = {
    user?: IUser;
};

type V = IUser[];

@Injectable({
    providedIn: "root",
})
export class UsersRepoService {
    private dataSource: IHttpAdapter<T, V> = inject(HttpAdapter<T, V>);

    getUser = (id: string) => this.dataSource.get(url, id);
    //getEnabledUser = (id: string) => this.dataSource.get(url, {id});
    getUserByEmail = (email: string) => this.dataSource.get(url, { email });
    getUsers = (arg?: string | Params, action?: string) =>
        this.dataSource.get(url, arg, action);
    // putUser = (user: IUser) => this.dataSource.put(URL, user);
    // addUser = (user: IUser, action?: string) => this.dataSource.post(URL, user, action);
    // deleteUser = (id: string) => this.dataSource.delete(URL, id);
}
