import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter } from "@infrastructure";
import { environment } from "@environments";
import { IUser, ICollection } from "@domain";

const URL = `${environment.apiUrl}/accounts`;

type T = {
    user?: IUser;
    collection?: ICollection;
    stayLoggedIn?: boolean;
};

@Injectable({
    providedIn: "root",
})
export class AccountRepoService {
    private dataSource: IHttpAdapter<T> = inject(HttpAdapter<T>);

    ownerSignup = (data: T) => this.dataSource.post(URL, data, "ownerSignup");
    login = (data: T) => this.dataSource.post(URL, data, "login");
    // cleanDB = () => this.dataSource.post(URL, {}, "cleanDB")
}
