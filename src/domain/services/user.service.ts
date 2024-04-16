import { Injectable, computed, signal } from "@angular/core";
import { IUser } from "@domain";

const sto = signal(sessionStorage);

@Injectable({
    providedIn: "root",
})
export class UserService {
    private _user = signal<IUser | null>(null);
    private _isOwner = signal(true);
    private _ownerToken = signal("");
    private _accessToken = signal("");
    private _refreshToken = signal("");
    private _forgotPasswordToken = signal("");
    private _validationCode = signal("");
    private _validationPwd = signal("");
    private _validationExp = signal(0);
    private _validationIat = signal(0);

    readonly user = this._user.asReadonly();
    readonly isOwner = this._isOwner.asReadonly();
    readonly ownerToken = this._ownerToken.asReadonly();
    readonly accessToken = this._accessToken.asReadonly();
    readonly refreshToken = this._refreshToken.asReadonly();
    readonly forgotPasswordToken = this._forgotPasswordToken.asReadonly();
    readonly validationCode = this._validationCode.asReadonly();
    readonly validationPwd = this._validationPwd.asReadonly();
    readonly validationExp = this._validationExp.asReadonly();
    readonly validationIat = this._validationIat.asReadonly();

    readonly isAuthenticated = computed(
        () => this._user() != null && this._user()?.enabled
    );

    constructor() {
        const userStr = sto().getItem("user");
        const isOwnerStr = sto().getItem("isOwner");
        const user = userStr ? JSON.parse(userStr) : null;
        const isOwner = isOwnerStr ? JSON.parse(isOwnerStr) : true;

        this._user.set(user);
        this._isOwner.set(isOwner);
        this._ownerToken.set(sto().getItem("ownTkn") ?? "");
        this._accessToken.set(sto().getItem("accTkn") ?? "");
        this._refreshToken.set(sto().getItem("refTkn") ?? "");
        this._forgotPasswordToken.set(sto().getItem("forTkn") ?? "");
        this._validationCode.set(sto().getItem("valCod") ?? "");
        this._validationPwd.set(sto().getItem("valPwd") ?? "");
        this._validationExp.set(JSON.parse(sto().getItem("valExp") ?? "0"));
        this._validationIat.set(JSON.parse(sto().getItem("valIat") ?? "0"));
    }

    setUser = (user: IUser | null, isOwner = true, clear = false) => {
        if (user) {
            const { _id, firstName, lastName, email, password, enabled } = user;
            user = { _id, firstName, lastName, email, password, enabled };
            sto().setItem("user", JSON.stringify(user));
            sto().setItem("isOwner", JSON.stringify(isOwner));
        } else {
            sto().removeItem("user");
            sto().removeItem("isOwner");
        }

        this._user.set(user);
        this._isOwner.set(isOwner);

        if (!user || clear ) {
            this.setOwnerToken("")
            this.setAccessToken("");
            this.setRefreshToken("");
            this.setForgotPasswordToken("");
            this.setValidationCode("");
            this.setValidationPwd("");
            this.setValidationExp(0);
            this.setValidationIat(0);
        }
    };

    setOwnerToken = (val: string) => {
        this._ownerToken.set(val);

        if (val) sto().setItem("ownTkn", val);
        else sto().removeItem("ownTkn");
    };

    setAccessToken = (val: string) => {
        this._accessToken.set(val);

        if (val) sto().setItem("accTkn", val);
        else sto().removeItem("accTkn");
    };

    setRefreshToken = (val: string) => {
        this._refreshToken.set(val);

        if (val) sto().setItem("refTkn", val);
        else sto().removeItem("refTkn");
    };

    setForgotPasswordToken = (val: string) => {
        this._forgotPasswordToken.set(val);

        if (val) sto().setItem("forTkn", val);
        else sto().removeItem("forTkn");
    };

    setValidationCode = (val: string) => {
        this._validationCode.set(val);

        if (val) sto().setItem("valCod", val);
        else sto().removeItem("valCod");
    };

    setValidationPwd = (val: string) => {
        this._validationPwd.set(val);

        if (val) sto().setItem("valPwd", val);
        else sto().removeItem("valPwd");
    };

    setValidationExp = (val: number) => {
        this._validationExp.set(val);

        if (val) sto().setItem("valExp", JSON.stringify(val));
        else sto().removeItem("valExp")
    };

    setValidationIat = (val: number) => {
        this._validationIat.set(val);

        if (val) sto().setItem("valIat", JSON.stringify(val));
        else sto().removeItem("valIat");
    };
}
