interface Role {
  value: string;
  viewValue: string;
}

export const ROLES: Role[] = [
    { value: "admin", viewValue: "Admin" },
    { value: "section", viewValue: "Section head" },
    { value: "default", viewValue: "Default" },
];

export interface IUser {
    _id?: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    __v: string
}
