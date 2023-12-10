import {
    Injectable,
} from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class ConfigurationService {
    private _config: { theme: "dark" | "light" | "system" } = {theme: "light"};

    constructor() {
        const config = localStorage.getItem("config") ?? "";
        const syspref = getComputedStyle(
            document.documentElement
        ).getPropertyValue("--system-preference");

        if (config == "" && syspref != "undefined")
            this._config = { theme: "system" };
        else if (config == "") this._config = { theme: "light" };
        else this._config = JSON.parse(config);

        if (this._config.theme == "system" as const && syspref == "undefined")
            this._config.theme = "light";

        this._updateTheme(syspref);
    }

    setTheme(theme: "light" | "dark" | "system") {
        const syspref = getComputedStyle(
            document.documentElement
        ).getPropertyValue("--system-preference");

        if (theme == "system" as const && syspref == "undefined") theme = "light";

        this._config.theme = theme;
        this._updateTheme(syspref);

        return theme
    }

    getSyspref() {
        return getComputedStyle(
            document.documentElement
        ).getPropertyValue("--system-preference");
    }

    getConfig() {
        return this._config
    }

    private _updateTheme(syspref: string) {
        const theme = this._config.theme;
        const isDark =
            theme == "dark" as const || (theme == "system" as const && syspref == "dark");
console.log("PEPE", theme)
        localStorage.setItem("config", JSON.stringify(this._config));

        if (isDark) document.body.classList.add("dark-theme");
        else document.body.classList.remove("dark-theme");
    }
}
