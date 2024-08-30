enum Role {
    User = 1,
    Admin = 0,
}

interface UserPayload {
    email: string;
    role: number;
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