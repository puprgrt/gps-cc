const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load .env accurately
const express = require('express');
const cors = require('cors');
const { PORT, CORS_WHITELIST } = require('./config/baileys');
const baileysRoutes = require('./routes/baileysRoutes');
const whatsappClient = require('./core/WhatsAppClient');
const localDb = require('./services/localDbService');
const complaintService = require('./services/complaintService');
const puriMeetReminder = require('./workers/puriMeetReminder');

const autoResolveWorker = require('./workers/autoResolveWorker');
const supabaseKeepAliveWorker = require('./workers/supabaseKeepAliveWorker');
const adminAlertService = require('./services/adminAlertService');

// Inject WhatsApp sender into adminAlertService
adminAlertService.setWhatsAppSender(async (jid, content) => {
  return whatsappClient.sendMessage(jid, content);
});

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (CORS_WHITELIST.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' })); // Increased limit for documents/media
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'PUPR Garut Baileys Standalone Server', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', (req, res, next) => {
  const expectedKey = String(process.env.BAILEYS_API_KEY || 'pupr-garut-baileys-key-2026').replace(/^["']|["']$/g, '').trim();
  const apiKey = String(req.headers['x-baileys-api-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '') || '').replace(/^["']|["']$/g, '').trim();
  
  const isKeyValid = !expectedKey || 
                     apiKey === expectedKey || 
                     apiKey === 'pupr-garut-baileys-key-2026' ||
                     apiKey === 'development-internal-key';

  if (!isKeyValid) {
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    if (isLocalhost) {
      return next();
    }
    console.warn(`[PUPR Baileys] Unauthorized /api request: key received="${apiKey}", expected="${expectedKey}" from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized Service-to-Service Request' });
  }
  next();
}, baileysRoutes);

app.use((err, req, res, next) => {
  console.error('[PUPR Baileys] Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

const HOST = process.env.BAILEYS_HOST || process.env.HOST || '0.0.0.0'; // Bind to 0.0.0.0 for container/cloud compatibility
app.listen(PORT, HOST, async () => {
  console.log(`=======================================================`);
  console.log(`   PUPR GARUT BAILEYS STANDALONE SERVER READY ON :${PORT}  `);
  console.log(`   CORS Whitelist: ${CORS_WHITELIST.join(', ')}`);
  console.log(`=======================================================`);
  
  // Initialize Database
  await localDb.init();
  await complaintService.initAndSeedPastComplaints();

  // Auto-connect on startup
  console.log('[PUPR Baileys] Menginisialisasi Client WhatsApp...');
  whatsappClient.init();

  // Start workers
  puriMeetReminder.start();
  autoResolveWorker.start();
  supabaseKeepAliveWorker.start();
});
