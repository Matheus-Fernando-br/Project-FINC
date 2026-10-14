import "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        email: string;
        nome: string;
        papel: "usuario" | "admin";
      };
    }
  }
}

export {};
