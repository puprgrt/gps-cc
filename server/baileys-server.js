/**
 * ==============================================================================
 * STANDALONE BAILEYS WHATSAPP BACKEND SERVER - DINAS PUPR KABUPATEN GARUT
 * ==============================================================================
 *
 * Struktur Modular:
 * - /server/config/baileys.js         (Pengaturan Port & Path Sesi)
 * - /server/services/waSocket.js      (Siklus Hidup Engine Baileys WASocket)
 * - /server/controllers/baileysController.js (Penanganan Logika API)
 * - /server/routes/baileysRoutes.js   (Definisi Endpoint REST API)
 */

const express = require('express');
const cors = require('cors');
const { PORT, CORS_WHITELIST } = require('./config/baileys');
const baileysRoutes = require('./routes/baileysRoutes');

const app = express();

// CORS: hanya izinkan origin yang terdaftar
app.use(cors({
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (CORS_WHITELIST.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Registrasi Route API Backend
app.use('/api', baileysRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[PUPR Baileys] Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`   PUPR GARUT BAILEYS STANDALONE SERVER READY ON :${PORT}  `);
  console.log(`   CORS Whitelist: ${CORS_WHITELIST.join(', ')}`);
  console.log(`=======================================================`);
});
