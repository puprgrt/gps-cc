/**
 * ============================================================================
 * SUPABASE KEEP-ALIVE WORKER (ANTI-PAUSE & ULTRA-LOW EGRESS STRATEGY)
 * PUPR Garut - PURI Multi-Modal AI Orchestrator 2026
 * ============================================================================
 * 
 * Strategi:
 * 1. Supabase Free Tier menjeda (pause) database jika tidak ada query selama 7 hari.
 * 2. Worker ini mengirimkan query ping setiap 48 jam (2 hari sekali).
 * 3. Menggunakan query ultra-ringan (HEAD request atau limit 1 kolom id) sehingga
 *    konsumsi egress < 100 bytes per ping (~1.5 KB per bulan dari kuota 2 GB).
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Interval: 48 Jam (2 Hari) dalam milidetik
const TWO_DAYS_MS = 48 * 60 * 60 * 1000;
let intervalId = null;

async function pingSupabase() {
  if (!supabaseUrl || supabaseUrl.includes('placeholder.supabase.co') || !supabaseKey || supabaseKey === 'placeholder') {
    console.log('[SupabaseKeepAlive] URL / Key Supabase belum dikonfigurasi. Ping dilewati.');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const startTime = Date.now();

    // Query ultra-low egress: menggunakan count/head tanpa mendownload payload row data
    const { data, error, count } = await supabase
      .from('wa_conversations')
      .select('id', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // Jika tabel belum ada, fallback ke query sistem ringan
      const fallbackRes = await supabase.from('wa_messages').select('id', { count: 'exact', head: true });
      if (fallbackRes.error && fallbackRes.error.code !== '42P01') {
        console.warn(`[SupabaseKeepAlive] Ping warning (${latencyMs}ms):`, fallbackRes.error.message);
        return;
      }
    }

    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    console.log(`[SupabaseKeepAlive] ✅ Ping Sukses (${timestamp} WIB) - Latency: ${latencyMs}ms | Egress: <100 bytes (Anti-Pause Active)`);
  } catch (err) {
    console.error('[SupabaseKeepAlive] ❌ Gagal ping Supabase:', err.message);
  }
}

function start() {
  if (intervalId) return;

  console.log('[SupabaseKeepAlive] Service diaktifkan. Jadwal ping: setiap 48 jam (2 hari sekali).');
  
  // Jalankan ping pertama 15 detik setelah server menyala
  setTimeout(() => {
    pingSupabase();
  }, 15000);

  // Jadwalkan setiap 48 jam
  intervalId = setInterval(pingSupabase, TWO_DAYS_MS);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[SupabaseKeepAlive] Service dihentikan.');
  }
}

module.exports = {
  start,
  stop,
  pingSupabase
};
