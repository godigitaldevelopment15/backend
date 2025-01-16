const express = require("express");
const router = express.Router();
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");
const path = require('path');

let whatsappClient = null; // Store the single WhatsApp client
let qrCode = null; // Store the QR code
let isReady = false; // Track if the client is ready

// Initialize WhatsApp client
const initializeClient = async () => {
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join('/tmp', '.wwebjs_auth')
    })
  });

  // Use Promises to handle initialization
  await new Promise((resolve, reject) => {
    whatsappClient.on("qr", (qr) => {
      qrCode = qr;
      console.log("QR Code:", qr);
    });

    whatsappClient.on("ready", () => {
      console.log("WhatsApp Client is ready.");
      isReady = true;
      qrCode = null; // Clear QR code after login
      resolve(); // Resolve once ready
    });

    whatsappClient.on("authenticated", () => {
      console.log("WhatsApp authenticated.");
      qrCode = null; // Clear QR code after login
    });

    whatsappClient.on("disconnected", () => {
      console.log("WhatsApp Client disconnected.");
      isReady = false;
      qrCode = null;
      whatsappClient = null;
      reject(); // Reject on disconnect
    });

    whatsappClient.initialize(); // Initialize the client
  });
};

// Endpoint to get the QR code for login
router.post("/login", async (req, res) => {
  if (!whatsappClient) {
    await initializeClient();  // Use await here to ensure the client initializes
  }

  if (qrCode) {
    try {
      const url = await QRCode.toDataURL(qrCode);  // Await QR code generation
      res.json({ qrCode: url });
    } catch (err) {
      return res.status(500).json({ error: "Failed to generate QR code." });
    }
  } else if (isReady) {
    res.status(200).json({ message: "Already logged in." });
  } else {
    res.status(202).json({ message: "Client is initializing. Please wait." });
  }
});

// Endpoint to send a message
router.post("/send", async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "Phone number and message are required." });
  }

  if (!isReady || !whatsappClient) {
    return res.status(400).json({ error: "WhatsApp client is not ready." });
  }

  try {
    await whatsappClient.sendMessage(`${phoneNumber}@c.us`, message);  // Await message sending
    res.json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// Optional: Endpoint to check client status
router.post("/status", (req, res) => {
  if (isReady) {
    res.status(200).json({ message: "WhatsApp client is ready." });
  } else if (whatsappClient) {
    res.status(202).json({ message: "Client is initializing. Please wait." });
  } else {
    res.status(400).json({ error: "WhatsApp client is not initialized." });
  }
});

module.exports = router;
