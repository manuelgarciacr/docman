import { IDocument } from "@domain";

interface Role {
    value: string;
    viewValue: string;
}

export const ROLES: Role[] = [
    { value: "admin", viewValue: "Admin" },
    { value: "owner", viewValue: "Owner" },
    { value: "default", viewValue: "Default" },
];

export interface ICollection {
    _id?: string;
    name: string;
    description: string;
    stayLoggedIn: boolean;
    users: string[]; // owner is included
    roles: string[]; // owner, default, etc
    documents: IDocument[];
    enabled: boolean;
    // createdAt: string;
    // updatedAt: string;
    // __v: string
}
