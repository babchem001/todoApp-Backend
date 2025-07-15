const express = require("express");
const router = express.Router();
//import prisma to our app
const { PrismaClient } = require("@prisma/client");

const prisma = require("../lib/prisma");
// const sendMail = require("./mail");

const authProtect = require("../middleware/auth");

router.post("/createtodo", authProtect, async (req, res, next) => {
  try {
    const { title, description, isComplete, status } = req.body;
    const { sub, isAdmin } = req.user;

    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        isComplete,
        status,
        userId: Number(sub),
        // categoryId: Number(categoryId),
      },
    });

    //send mail
    // sendMail.mailHandler(
    //   `New Book -${title} Created`,
    //   description,
    //   req.user.email,
    //   `New Book -${title} Created`
    // );

    return res.status(201).json({ message: "todo created successfully", todo });
  } catch (error) {
    next(error);
  }
});

router.put("/updatetodo/", authProtect, async (req, res, next) => {
  try {
    const { title, description, todoId } = req.body;
    const { sub, isAdmin } = req.user;

    const todo = await prisma.todo.update({
      where: {
        id: Number(todoId),
        userId: Number(sub),
      },
      data: {
        title,
        description,
      },
    });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    if (todo.userId !== Number(sub)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to access this todo" });
    }

    return res.status(203).json({ message: "todo updated successfully", todo });
  } catch (error) {
    next(error);
  }
});

// Get a todo status
router.get("/gettodostatus/:id", authProtect, async (req, res, next) => {
  const { id } = req.params;
  const { sub, isAdmin } = req.user;
  try {
    const todo = await prisma.todo.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        status: true,
        userId: true,
      },
    });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    if (todo.userId !== Number(sub)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to access this todo" });
    }
    res.json({ status: todo.status });
  } catch (error) {
    next(error);
  }
});

// Update the Todo status
router.put("/updatetodostatus/:id", authProtect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sub, isAdmin } = req.user;
    const { status } = req.body;

    const allowedStatuses = ["Pending", "In-progress", "Completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    const updatedTodoStatus = await prisma.todo.update({
      where: {
        id: Number(id),
        userId: Number(sub),
      },
      data: {
        status: status,
        isComplete: status === "Completed",
      },
    });

    return res.status(200).json({
      message: "todo status updated successfully",
      todo: updatedTodoStatus,
    });
  } catch (error) {
    next(error);
    return res.status(500).json({
      message: "Failed to update status",
      error: error.message,
    });
  }
});

router.get("/getalltodos", authProtect, async (req, res, next) => {
  try {
    //fetch all books from database
    const todos = await prisma.todo.findMany({
      where: {
        userId: Number(req.user.sub),
      },
    });

    return res.status(200).json(todos);
  } catch (error) {
    next(error);
  }
});

router.get("/singletodo/:id", authProtect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sub, isAdmin } = req.user;

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    const todo = await prisma.todo.findUnique({
      where: {
        id: Number(id),
        userId: Number(sub),
      },
      select: {
        title: true,
        description: true,
      },
    });

    return res.status(200).json({ message: "todo fetched successfully", todo });
  } catch (error) {
    next(error);
  }
});

router.delete("/deletetodo/:id", authProtect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sub, isAdmin } = req.user;

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    const todo = await prisma.todo.delete({
      where: {
        id: Number(id),
        userId: Number(sub),
      },
    });

    return res
      .status(200)
      .json({ message: `todo title - ${todo.title} deleted successfully` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
