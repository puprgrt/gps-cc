const express = require('express');
const router = express.Router();
const baileysController = require('../controllers/baileysController');

router.get('/status', baileysController.getStatus);
router.post('/connect', baileysController.connectSocket);
router.post('/reconnect', baileysController.reconnectSocket);
router.post('/disconnect', baileysController.disconnectSocket);
router.post('/send-message', baileysController.handleSendMessage);
router.post('/send-media', baileysController.handleSendMedia);
router.post('/send-presence', baileysController.handleSendPresence);
router.post('/mark-read', baileysController.handleMarkRead);
router.get('/conversations', baileysController.handleGetConversations);
router.post('/add-note', baileysController.handleAddNote);
router.post('/add-tag', baileysController.handleAddTag);
router.get('/profile-picture', baileysController.handleGetProfilePicture);
router.get('/group-metadata', baileysController.handleGetGroupMetadata);
router.get('/inbound-messages', baileysController.handleGetInboundMessages);
router.get('/contacts', baileysController.handleGetContacts);

module.exports = router;

