const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { Decimal } = require("@prisma/client/runtime/library");
const authProtect = require("../middleware/auth");

// GET /wallet - Get wallet and transactions
router.get("/", authProtect, async (req, res) => {
  try {
    // console.log("Token:", token);

    const userId = Number(req.user.sub);

    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactionsSent: true,
        transactionsReceived: true,
      },
    });

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: new Decimal("0.00"),
        },
        include: {
          transactionsSent: true,
          transactionsReceived: true,
        },
      });
    }

    return res.status(200).json(wallet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching wallet" });
  }
});

// PUT /wallet/fundwallet - Fund wallet
router.put("/fundwallet", authProtect, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = Number(req.user.sub);
    console.log("User:", req.user);


    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: new Decimal(amount),
        },
        transactionsReceived: {
          create: {
            amount: new Decimal(amount),
            type: "fund",
          },
        },
      },
    });

    res
      .status(200)
      .json({ message: "Wallet funded successfully", wallet: updatedWallet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error funding wallet" });
  }
});

// POST /wallet/sendmoney - Send money to another user
router.post("/sendmoney", authProtect, async (req, res) => {
  try {
    const { amount, recipientEmail } = req.body;
    const senderId = Number(req.user.sub);

    if (!recipientEmail || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const senderWallet = await prisma.wallet.findUnique({
      where: { userId: senderId },
    });

    if (!senderWallet) {
      return res.status(404).json({ error: "Sender wallet not found" });
    }

    if (Number(senderWallet.balance) < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const recipientUser = await prisma.user.findUnique({
      where: { email: recipientEmail },
      include: { wallet: true },
    });

    if (!recipientUser || !recipientUser.wallet) {
      return res.status(404).json({ error: "Recipient wallet not found" });
    }

    const decimalAmount = new Decimal(amount);

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: senderId },
        data: {
          balance: { decrement: decimalAmount },
          transactionsSent: {
            create: {
              type: "send",
              amount: decimalAmount,
              toId: recipientUser.wallet.id,
            },
          },
        },
      }),
      prisma.wallet.update({
        where: { userId: recipientUser.id },
        data: {
          balance: { increment: decimalAmount },
          transactionsReceived: {
            create: {
              type: "receive",
              amount: decimalAmount,
              fromId: senderWallet.id,
            },
          },
        },
      }),
    ]);

    res.status(200).json({ message: "Transfer successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error processing transaction" });
  }
});

module.exports = router;
