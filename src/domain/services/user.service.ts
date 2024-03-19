import { Injectable, computed, signal } from "@angular/core";
import { IUser } from "@domain";

const sto = signal(sessionStorage);

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
    private _isOwner = signal(true);

    readonly user = this._user.asReadonly();
    readonly ownerToken = this._ownerToken.asReadonly();
    readonly accessToken = this._accessToken.asReadonly();
    readonly refreshToken = this._refreshToken.asReadonly();
    readonly validationCode = this._validationCode.asReadonly();
    readonly validationExpiration = this._validationExpiration.asReadonly();
    readonly isOwner = this._isOwner.asReadonly();
    readonly isAuthenticated = computed(() =>
        this._user() != null
        && this._user()?.enabled);

    constructor() {
        this._ownerToken.set(sto().getItem("ownTkn") ?? "");
        this._accessToken.set(sto().getItem("accTkn") ?? "");
        this._refreshToken.set(sto().getItem("refTkn") ?? "");
        this._validationCode.set(sto().getItem("valCod") ?? "");
        this._validationExpiration.set(JSON.parse(sto().getItem("valExp") ?? "0"));
        const userStr = sto().getItem("user");
        const isOwnerStr = sto().getItem("isOwner");
        const user = userStr ? JSON.parse(userStr) : null;
        const isOwner = isOwnerStr ? JSON.parse(isOwnerStr) : true;
        this._user.set(user);
        this._isOwner.set(isOwner)
    }

    setUser = (user: IUser | null, isOwner: boolean = true) => {
        if (user) {
            const { _id, firstName, lastName, email, password, enabled } = user;
            user = { _id, firstName, lastName, email, password, enabled };
            sto().setItem("user", JSON.stringify(user))
        } else {
            this.setAccessToken("");
            this.setOwnerToken("");
            this.setRefreshToken("");
            this.setValidationCode("");
            this.setValidationExpiration(0);
            sto().removeItem("user")
        }

        this._user.set(user);
        this._isOwner.set(isOwner);
        sto().setItem("isOwner", JSON.stringify(isOwner));
    };

    setOwnerToken = (ownerToken: string) => {
        this._ownerToken.set(ownerToken);
        sto().setItem("ownTkn", ownerToken)
    }

    setAccessToken = (accessToken: string) => {
        this._accessToken.set(accessToken);
        sto().setItem("accTkn", accessToken)
    }

    setRefreshToken = (refreshToken: string) => {
        this._refreshToken.set(refreshToken);
        sto().setItem("refTkn", refreshToken);
    }

    setValidationCode = (validationCode: string) => {
        this._validationCode.set(validationCode);
        sto().setItem("valCod", validationCode)
    }

    setValidationExpiration = (validationExpiration: number) => {
        this._validationExpiration.set(validationExpiration);
        sto().setItem("valExp", JSON.stringify(validationExpiration))
    }

    removeOwnerToken = () => {
        this._ownerToken.set("");
        sto().removeItem("ownTkn")
    }
}
