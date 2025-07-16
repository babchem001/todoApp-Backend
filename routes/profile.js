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
  destination: function (req, file, cb) {
    cb(null, "public/avatar"); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, file.fieldname + "-" + uniqueSuffix + ext); // Append extension;
  },
});
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only JPEG and PNG images are allowed"));
    }
  },
});

// Endpoint for handling file uploads
router.post(
  "/upload",
  [authProtect],
  upload.single("image"),
  async (req, res, next) => {
    console.log(req.file);
    try {
      const { destination, filename } = req.file;
      const profile = await prisma.profile.update({
        where: {
          userId: Number(req.user.sub),
        },
        data: {
          avatar: `${destination}/${filename}`,
        },
      });
      return res.json({
        message: "File uploaded successfully",
        image: filename,
      });
    } catch (error) {
      console.error("Upload error", error);
      next(error);
    }
  }
);

// Route to Update file
const fs = require("fs");

router.put(
  "/updateavatar",
  authProtect,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { file } = req;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = Number(req.user.sub);
      const currentProfile = await prisma.profile.findUnique({
        where: { userId },
      });

      if (currentProfile.avatar) {
        const oldAvatarPath = path.join(__dirname, "..", currentProfile.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      const updated = await prisma.profile.update({
        where: { userId },
        data: {
          avatar: `public/avatar/${file.filename}`,
        },
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

//get user profile
router.get("/", authProtect, async (req, res, next) => {
  try {
    const { sub } = req.user;

    const profile = await prisma.profile.findFirst({
      where: {
        userId: Number(sub),
      },
      select: {
        bio: true,
        name: true,
        avatar: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(400).json({
        message: "profile not found",
      });
    }

    const profileImage = `${req.protocol}://${req.get("host")}/${
      profile.avatar
    }`;

    return res.status(200).json({
      message: "profile fetched successfully",
      profile: {
        name: profile.name,
        bio: profile.bio,
        avatar: profileImage,
        user: {
          email: profile.user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

//update user profile
router.put("/update", authProtect, async (req, res, next) => {
  try {
    const { bio } = req.body;

    const profile = await prisma.profile.findUnique({
      where: {
        userId: Number(req.user.sub),
      },
    });

    if (!profile) {
      return res.status(400).json({
        message: "profile not found",
      });
    }

    const updatedProfile = await prisma.profile.update({
      where: {
        id: Number(profile.id),
        userId: Number(req.user.sub),
      },
      data: {
        bio: bio,
      },
    });

    if (!updatedProfile) {
      return res.status(400).json({
        message: "profile not updated",
      });
    }

    return res.status(200).json({
      message: "profile updated successfully",
      updatedProfile,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
