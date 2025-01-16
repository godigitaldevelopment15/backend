const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
// create userdddd
const sessions = {};
const initializeClient = (userId) => {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
    });

    client.on('qr', (qr) => {
        sessions[userId] = { qr };
        console.log(`QR Code for ${userId}:`, qr);
    });

    client.on('ready', () => {
        console.log(`WhatsApp Client ready for user: ${userId}`);
        sessions[userId].isReady = true;
    });

    client.on('authenticated', () => {
        console.log(`WhatsApp authenticated for user: ${userId}`);
        delete sessions[userId].qr; // Remove QR after login
    });

    client.on('disconnected', () => {
        console.log(`WhatsApp disconnected for user: ${userId}`);
        delete sessions[userId];
    });

    client.initialize();
    sessions[userId] = { client, isReady: false };
};
router.post('/login', (req, res) => {
    const { userId } = req.body;
   
        initializeClient(userId);
 

    const { qr } = sessions[userId];
    if (qr) {
        QRCode.toDataURL(qr, (err, url) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to generate QR code.' });
            }
            res.json({ qrCode: url });
        });
    } else {
        res.status(200).json({ message: 'User already logged in.' });
    }
});

// Endpoint to send a message
router.post('/send', async (req, res) => {

     const { userId, phoneNumber, message } = req.body;
     if (!userId || !phoneNumber || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
     }

        const session = sessions[userId];
   
        if (!session || !session.isReady) {
            return res.status(400).json({ error: 'User not logged in or client not ready.' });
        }

        try {
            await session.client.sendMessage(`${phoneNumber}@c.us`, message);
            res.json({ message: 'Message sent successfully!' });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ error: 'Failed to send message.' });
        }
});
module.exports = router;