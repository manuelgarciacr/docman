import { Injectable } from "@angular/core";
import { IUser } from "@domain";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private _user = new BehaviorSubject<IUser | null>(null);
    readonly user$: Observable<IUser | null> = this._user.asObservable();

    setUser = (user: IUser) => this._user.next(user);
    getUser = () => this._user.getValue();
}
