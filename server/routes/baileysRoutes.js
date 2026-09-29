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

// Data & Settings
router.get('/conversations', baileysController.handleGetConversations);
router.get('/contacts', baileysController.handleGetContacts);
router.get('/logs', baileysController.handleGetLogs);
router.get('/bot-settings', baileysController.handleGetBotSettings);
router.post('/bot-settings', baileysController.handleUpdateBotSettings);

// Tiket Pengaduan Warga & Monitoring
router.get('/complaints', baileysController.handleGetComplaints);
router.get('/complaints/:id', baileysController.handleGetComplaintDetail);
router.patch('/complaints/:id', baileysController.handleUpdateComplaintStatus);
router.post('/complaints/:id/resolve', baileysController.handleRecordComplaintResolution);

// Pengaturan Nomor WA Bidang & Forwarding Disposisi
router.get('/bidang-contacts', baileysController.handleGetBidangContacts);
router.post('/bidang-contacts', baileysController.handleUpdateBidangContacts);
router.post('/forward-bidang', baileysController.handleForwardBidang);

module.exports = router;

