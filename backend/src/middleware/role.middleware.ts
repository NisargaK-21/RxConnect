import { Request, Response, NextFunction, RequestHandler } from "express";

const authorize = (...allowedRoles: string[]): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const userRole = req.user.role.toLowerCase();

    const roles = allowedRoles.map((role) =>
      role.toLowerCase()
    );

    if (!roles.includes(userRole)) {
      res.status(403).json({
        message:
          "Forbidden: You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
};

export default authorize;