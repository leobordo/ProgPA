enum Role {
    User = "user",
    Admin = "admin",
}

interface UserPayload {
    email: string;
    role: string;
    iat: number;
    exp:number;
    aud: string;
}

export {Role, UserPayload};