/**
 * ============================================================================
 * SELF-HEALING BUILD VALIDATOR FOR RAILWAY & CLOUD DEPLOYMENTS
 * PUPR Garut - PURI Multi-Modal AI Orchestrator 2026
 * ============================================================================
 *
 * Ensures that `.next/BUILD_ID` exists before `next start` runs.
 * If Railway skipped the build phase or build artifacts are missing, this script
 * automatically executes `npm run build` so `next start` never crashes with:
 * "Could not find a production build in the '.next' directory".
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildIdCwd = path.resolve(process.cwd(), '.next/BUILD_ID');
const buildIdRel = path.join(__dirname, '../.next/BUILD_ID');

if (!fs.existsSync(buildIdCwd) && !fs.existsSync(buildIdRel)) {
  console.log('===================================================================');
  console.log('[ensure-build] WARNING: .next/BUILD_ID tidak ditemukan!');
  console.log('[ensure-build] Menjalankan "npm run build" secara otomatis...');
  console.log('===================================================================');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    console.log('[ensure-build] Build produksi berhasil. Memulai server...');
  } catch (err) {
    console.error('[ensure-build] ERROR: Gagal menjalankan build otomatis:', err.message);
    process.exit(1);
  }
} else {
  console.log('[ensure-build] Build produksi (.next/BUILD_ID) valid terdeteksi. Memulai server...');
}
