const { supabase } = require('../server/services/supabaseService');

async function autoFixAll() {
  console.log('=== MEMULAI PEMBERSIHAN & NORMALISASI OTOMATIS DATA WHATSAPP ===');

  // 1. Ambil semua kontak
  const { data: contacts, error: cErr } = await supabase.from('wa_contacts').select('*');
  if (cErr) {
    console.error('Gagal mengambil kontak:', cErr);
    return;
  }

  console.log(`Total Kontak Ditemukan: ${contacts.length}`);

  let updatedContactsCount = 0;
  let deletedContactsCount = 0;

  for (const c of contacts) {
    // Hapus kontak sampah / status broadcast
    if (c.phone_number.includes('status') || c.phone_number.includes('broadcast') || c.name === 'Risma' && c.phone_number === '+status') {
      console.log(`🗑️ Menghapus kontak broadcast: ${c.name} (${c.phone_number})`);
      await supabase.from('wa_conversations').delete().eq('contact_id', c.id);
      await supabase.from('wa_contacts').delete().eq('id', c.id);
      deletedContactsCount++;
      continue;
    }

    let raw = c.phone_number.replace(/\D/g, '');
    if (!raw) continue;

    let canonical = raw;
    if (raw.startsWith('0')) {
      canonical = '62' + raw.substring(1);
    } else if (raw.startsWith('8')) {
      canonical = '62' + raw;
    }

    // Jika nomor berubah setelah normalisasi
    if (canonical !== c.phone_number) {
      // Cek apakah nomor canonical sudah dipakai oleh kontak lain
      const { data: duplicate } = await supabase
        .from('wa_contacts')
        .select('id')
        .eq('phone_number', canonical);

      if (duplicate && duplicate.length > 0 && duplicate[0].id !== c.id) {
        // Gabungkan ke record yang sudah ada
        const targetId = duplicate[0].id;
        console.log(`🔀 Menggabungkan duplikat: ${c.phone_number} -> ${canonical} (ID: ${targetId})`);
        await supabase.from('wa_conversations').update({ contact_id: targetId }).eq('contact_id', c.id);
        await supabase.from('wa_contacts').delete().eq('id', c.id);
        deletedContactsCount++;
      } else {
        const { error: uErr } = await supabase
          .from('wa_contacts')
          .update({ phone_number: canonical })
          .eq('id', c.id);

        if (!uErr) {
          console.log(`✅ Dinormalisasi: ${c.name} (${c.phone_number} -> ${canonical})`);
          updatedContactsCount++;
        }
      }
    }
  }

  // 2. Bersihkan percakapan conv-status@broadcast jika ada
  await supabase.from('wa_conversations').delete().eq('id', 'conv-status@broadcast');

  console.log('===============================================================');
  console.log(`Hasil Pembersihan:`);
  console.log(`- Kontak dinormalisasi ke kode 62 : ${updatedContactsCount}`);
  console.log(`- Kontak invalid / duplikat dihapus: ${deletedContactsCount}`);
  console.log('=== SEMUA NOMOR SUDAH BERHASIL DINORMALISASI DENGAN RAPI ===');
}

autoFixAll();
