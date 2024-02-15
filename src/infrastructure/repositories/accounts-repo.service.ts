import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter } from "@infrastructure";
import { environment } from "@environments";
import { IUser, ICollection } from "@domain";

const URL = `${environment.apiUrl}/accounts`;

type T = {
    user?: IUser;
    collection?: ICollection;
};

@Injectable({
    providedIn: "root",
})
export class AccountRepoService {
    private dataSource: IHttpAdapter<T> = inject(HttpAdapter<T>);

    signup = (data: T) => this.dataSource.post(URL, data, "signup")

}
