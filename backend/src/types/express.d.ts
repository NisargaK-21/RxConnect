declare namespace Express {
  interface Request {
    user: {
      id: number;
      role: string;
      branch_id?: number | null;
    };

    file?: Express.Multer.File;
  }
}