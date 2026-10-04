import fs from "fs";
import multer from "multer";
import path from "path";

const UPLOAD_DIR =
  path.join(
    __dirname,
    "../../uploads"
  );

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(
    UPLOAD_DIR,
    {
      recursive: true,
    }
  );
}

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        UPLOAD_DIR
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const uniqueName =
        Date.now() +
        "-" +
        Math.round(
          Math.random() * 1e9
        );

      cb(
        null,
        uniqueName +
          path.extname(
            file.originalname
          )
      );
    },
  });

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG and PDF files are allowed."
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:
      5 * 1024 * 1024,
  },
});

module.exports = upload;