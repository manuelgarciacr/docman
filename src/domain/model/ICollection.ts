import { IDocument } from "@domain";

export interface ICollection {
    // _id?: string;
    name: string;
    description: string;
    users: string[]; // owner is included
    roles: string[]; // owner, default, etc
    documents: IDocument[];
    // createdAt: string;
    // updatedAt: string;
    // __v: string
}
