const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load .env accurately
const express = require('express');
const cors = require('cors');
const { PORT, CORS_WHITELIST } = require('./config/baileys');
const baileysRoutes = require('./routes/baileysRoutes');
const whatsappClient = require('./core/WhatsAppClient');
const localDb = require('./services/localDbService');

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', baileysRoutes);

app.use((err, req, res, next) => {
  console.error('[PUPR Baileys] Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`   PUPR GARUT BAILEYS STANDALONE SERVER READY ON :${PORT}  `);
  console.log(`   CORS Whitelist: ${CORS_WHITELIST.join(', ')}`);
  console.log(`=======================================================`);
  
  // Initialize Database
  await localDb.init();

  // Auto-connect on startup
  console.log('[PUPR Baileys] Menginisialisasi Client WhatsApp...');
  whatsappClient.init();
});
