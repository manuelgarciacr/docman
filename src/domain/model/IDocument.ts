export interface IDocument {
    _id?: string;
    name: string;
    description: string;
    owner: string;
    users: string[]; // owner is included
    documents: IDocument[];
    createdAt: string;
    updatedAt: string;
    __v: string;
}
