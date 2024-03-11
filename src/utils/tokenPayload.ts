import { Buffer } from "buffer";

export const getTokenPayload = (token: string) => {
    console.log("TOKEN", token)
    const payload = token.split(".")[1];
    const stringPayload = Buffer.from(payload, "base64").toString();
    const jsonPayload = JSON.parse(stringPayload);

    return jsonPayload
};
