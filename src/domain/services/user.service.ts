import { Injectable, signal } from "@angular/core";
import { IUser } from "@domain";

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private _user = signal<IUser | null>(null);

    readonly user = this._user.asReadonly();

    setUser = (user: IUser | null) => this._user.set(user);
}
