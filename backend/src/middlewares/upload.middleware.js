const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Ensure directory exists
const uploadDir = path.join(__dirname, "../../uploads/drivers");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate safe unique filename: USERID-TIMESTAMP-RANDOM.EXT
    const uniqueSuffix = crypto.randomBytes(4).toString("hex");
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${req.user ? req.user.id : "anon"}-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Only accept basic images
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = allowed.test(ext) || allowed.test(file.mimetype);

  if (isImage) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem são permitidos (jpg, png, webp)!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per photo
  },
  fileFilter: fileFilter,
});

// Configuration for Driver Bundle (tambem usada para veiculos e cliente)
const uploadDriverBundle = upload.fields([
  { name: "cnhFront", maxCount: 1 },
  { name: "cnhBack", maxCount: 1 },
  { name: "crlvFront", maxCount: 1 },
  { name: "crlvBack", maxCount: 1 },
  { name: "vehiclePhoto", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
  { name: "rgFront", maxCount: 1 },
  { name: "rgBack", maxCount: 1 },
]);

module.exports = {
  upload,
  uploadDriverBundle,
};
