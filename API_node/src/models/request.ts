import { Request } from 'express';

enum Role {
    User = "user",
    Admin = "admin",
}

interface AuthPayload {
    email: string;
    role: string;
}

interface AuthenticatedRequest extends Request {
    auth?: {
        payload?: AuthPayload;
    };
}

export {Role, AuthenticatedRequest};