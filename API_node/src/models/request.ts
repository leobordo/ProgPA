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

// Extends Express Request interface to include user's informations
declare module 'express-serve-static-core' {
    interface Request {
      user?: {
        userEmail: string;
        userRole: Role;
      };
    }
  }

export {Role, UserPayload};