const express = require('express');
const router = express.Router();
const baileysController = require('../controllers/baileysController');

router.get('/status', baileysController.getStatus);
router.post('/connect', baileysController.connectSocket);
router.post('/reconnect', baileysController.reconnectSocket);
router.post('/disconnect', baileysController.disconnectSocket);

// Pesan & Media
router.post('/send-message', baileysController.handleSendMessage);
router.post('/send-media', baileysController.handleSendMedia);

// Data
router.get('/conversations', baileysController.handleGetConversations);
router.get('/contacts', baileysController.handleGetContacts);
router.get('/logs', baileysController.handleGetLogs);

module.exports = router;
