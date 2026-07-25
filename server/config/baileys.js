const PORT = process.env.PORT || process.env.BAILEYS_PORT || 3001;
const SESSION_PATH = process.env.BAILEYS_SESSION_PATH || './baileys_auth_garut';

// CORS whitelist - hanya izinkan domain frontend
const CORS_WHITELIST = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL, // e.g., https://gps-cc.garut.go.id
].filter(Boolean);

module.exports = {
  PORT,
  SESSION_PATH,
  CORS_WHITELIST,
};
