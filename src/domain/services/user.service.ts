import { Injectable, signal } from "@angular/core";
import { IUser } from "@domain";

@Injectable({
    providedIn: "root",
})
export class UserService {
    private _user = signal<IUser | null>(null);
    private _ownerToken = signal("");
    private _accessToken = signal("");
    private _refreshToken = signal("");
    private _validationCode = signal("");
    private _validationExpiration = signal(0);

    readonly user = this._user.asReadonly();
    readonly ownerToken = this._ownerToken.asReadonly();
    readonly accessToken = this._accessToken.asReadonly();
    readonly refreshToken = this._refreshToken.asReadonly();
    readonly validationCode = this._validationCode.asReadonly();
    readonly validationExpiration = this._validationExpiration.asReadonly();

    setUser = (user: IUser | null) => this._user.set(user);
    setOwnerToken = (ownerToken: string) => this._ownerToken.set(ownerToken);
    setAccessToken = (accessToken: string) => this._accessToken.set(accessToken);
    setRefreshToken = (refreshToken: string) => this._refreshToken.set(refreshToken);
    setValidationCode = (validationCode: string) =>
        this._validationCode.set(validationCode);
    setValidationExpiration = (validationExpiration: number) =>
        this._validationExpiration.set(validationExpiration);

    removeOwnerToken = () => this._ownerToken.set("");
}
