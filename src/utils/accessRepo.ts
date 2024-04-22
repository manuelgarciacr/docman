import { WritableSignal } from "@angular/core";
import { Resp } from "@infrastructure";
import { HotToastService } from "@ngneat/hot-toast";
import { Observable, catchError, finalize, lastValueFrom, map } from "rxjs";

const DISMISS = {
    autoClose: false,
    dismissible: true,
};
const briefError = (err: string) => (err.split(":").pop() ?? "").trim();

export const accessRepo = async (
    msg: string,
    obs$: Observable<Resp<unknown>>,
    working: WritableSignal<ReturnType<typeof setTimeout> | null>,
    toast: HotToastService
) => {
    const timeout = setTimeout(() => {
        if (!working()) return;

        toast.loading(msg, {
            autoClose: false,
            dismissible: true,
            id: "workingToast",
        });
    }, 500);

    working.set(timeout);

    return await lastValueFrom(
        obs$.pipe(
            map((resp: Resp<unknown>) => {
                console.log("RESP", resp);
                if (resp.status != 200)
                    throw briefError(resp.message.toString());
                return resp.data!;
            }),
            catchError(error => {
                console.log("ERR", error);
                const err = briefError(error.toString());
                //const err = this.briefError(error);

                if (err == "refresh jwt expired")
                    toast.error("EXPIRED SESSION", DISMISS);
                else
                    toast.error(err, DISMISS);

                throw err;
            }),
            finalize(() => {
                clearTimeout(working() ?? undefined);
                toast.close("workingToast");
                working.set(null);
            })
        )
    );
};

