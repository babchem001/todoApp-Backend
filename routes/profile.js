//profile with uploading with multer

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path"); //used to extract the path of the uploaded file;

//import prisma
const prisma = require("../lib/prisma");

//get auth middleware
const authProtect = require("../middleware/auth");

//Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/avatar");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) cb(null, true);
    else cb(new Error("Only JPEG and PNG files are allowed"));
  },
});

// Upload new avatar
router.post(
  "/upload",
  authProtect,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { filename } = req.file;
      const userId = Number(req.user.sub);

      const profile = await prisma.profile.update({
        where: { userId },
        data: { avatar: `avatar/${filename}` },
      });

      return res.json({
        message: "File uploaded successfully",
        avatar: `avatar/${filename}`,
      });
    } catch (error) {
      console.error("Upload error", error);
      next(error);
    }
  }
);

// Update avatar (replace old one)
router.put(
  "/updateavatar",
  authProtect,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { file } = req;
      const userId = Number(req.user.sub);

      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const currentProfile = await prisma.profile.findUnique({
        where: { userId },
      });

      if (currentProfile?.avatar) {
        const oldPath = path.join(
          __dirname,
          "..",
          "public",
          currentProfile.avatar
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const updated = await prisma.profile.update({
        where: { userId },
        data: { avatar: `avatar/${file.filename}` },
      });

      return res.status(200).json({
        message: "Avatar updated successfully",
        avatar: `avatar/${file.filename}`,
        updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get profile (with full avatar URL)
router.get("/", authProtect, async (req, res, next) => {
  try {
    const userId = Number(req.user.sub);

    const profile = await prisma.profile.findFirst({
      where: { userId },
      select: {
        bio: true,
        name: true,
        avatar: true,
        user: { select: { email: true } },
      },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const fullAvatarUrl = profile.avatar
      ? `${req.protocol}://${req.get("host")}/${profile.avatar}`
      : "";

    return res.status(200).json({
      message: "Profile fetched successfully",
      profile: {
        name: profile.name,
        bio: profile.bio,
        avatar: fullAvatarUrl,
        user: { email: profile.user.email },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update bio
router.put("/update", authProtect, async (req, res, next) => {
  try {
    const { bio } = req.body;
    const userId = Number(req.user.sub);

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });
    if (!existingProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: { bio },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      updatedProfile,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
