const express = require("express");
const router = express.Router();
const { Decimal } = require("@prisma/client/runtime/library");

const prisma = require("../lib/prisma");

// protect the routes
const authProtect = require("../middleware/auth");

const authAdmin = require("../middleware/authIsAdmin");
// import Joi
const userSchema = require("../prisma/joischema/prismajoi");

const argon2 = require("argon2");
const { Prisma } = require("@prisma/client");

router.post("/register", async (req, res) => {
  try {
    // console.log(req.body)
    // user validation of inputs using Joi

    const valResult = userSchema.userVal.validate(req.body, {
      abortEarly: false,
    });

    if (valResult.error) {
      return res.status(400).send(valResult.error.details);
    }

    const pwdResult = userSchema.pwdVal.validate(req.body.password);

    if (pwdResult.error) {
      return res.status(400).send(pwdResult.error.details);
    }

    const { email, password, name } = req.body;

    // check if user exists
    const userExists = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // check if username exists on Profile
    const userNameExists = await prisma.profile.findFirst({
      where: {
        name: name,
      },
    });

    if (userNameExists) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }
    // hatch password
    const hashedPassword = await argon2.hash(password);
    // create a new user

    const aUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        wallet: {
          create: {
            balance: new Decimal("0.00"),
          },
        }
      },
    });
    if (!aUser) {
      return res.status(400).json({
        message: "failed to create user",
      });
    }

    //create profile

    const aProfile = await prisma.profile.create({
      data: {
        userId: aUser.id,
        name: name,
      },
    });

    if (!aProfile) {
      return res.status(400).json({
        message: `failed to create profile for ${aUser.email}`,
      });
    }

    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.log(error);
  }
});

// getting all users
router.get("/allusers", [authProtect, authAdmin], async (req, res, next) => {
  try {
    // i need to get info from all users
    const users = await prisma.user.findMany();

    // res.json(users);
    return res.status(200).json({
      message: "Fetched all users successfully",
      users,
    });
  } catch (error) {
    next(error);
  }
});

// get a specific user i.e. one user

router.get("/:id", authProtect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (user) {
      return res.status(200).json(user);
    } else {
      return res.status(404).json({
        message: "User not found",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.put("/update/:id", authProtect, async (req, res) => {
  try {
    const { id } = req.params;
    // i want a user to be able to update only their password
    const { password } = req.body;

    // update the user password but you first need to get the user
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        password: password,
      },
    });
    return res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
});

router.delete("/delete/:id", authProtect, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const deletedUser = await prisma.user.delete({
      where: {
        email: user.email,
      },
    });
    return res.status(200).json(deletedUser);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
