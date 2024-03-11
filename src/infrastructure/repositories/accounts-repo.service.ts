import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter } from "@infrastructure";
import { environment } from "@environments";
import { IUser, ICollection } from "@domain";

const url = `${environment.apiUrl}/accounts`;

type T = {
    user?: IUser;
    collection?: ICollection;
    stayLoggedIn?: boolean;
};

type V = string;

@Injectable({
    providedIn: "root",
})
export class AccountRepoService {
    private dataSource: IHttpAdapter<T, V> = inject(
        HttpAdapter<T, V>
    );

    ownerSignup = (body: T) => this.dataSource.post({url, body, action: "ownerSignup"});
    ownerValidation = () => this.dataSource.post({url, action: "ownerValidation"});
    login = (body: T) => this.dataSource.post({url, body, action: "login"});
    // cleanDB = () => this.dataSource.post(URL, {}, "cleanDB")
}
