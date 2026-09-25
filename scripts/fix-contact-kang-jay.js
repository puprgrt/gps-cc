const { supabase } = require('../server/services/supabaseService');

async function fixKangJay() {
  console.log('--- Memulai Perbaikan Nomor Kontak Kang Jay ---');

  const oldJid = '95288547082364@s.whatsapp.net';
  const oldLidJid = '95288547082364@lid';
  const newJid = '6285195999944@s.whatsapp.net';
  const newPhone = '6285195999944';
  const contactName = 'Kang Jay';

  // 1. Cek apakah ada kontak duplikat lama dengan nomor baru (58b71dad-f2b3-4110-a172-90ce3a4daed4)
  const { data: existingNewContact } = await supabase
    .from('wa_contacts')
    .select('id')
    .eq('phone_number', newPhone);

  if (existingNewContact && existingNewContact.length > 0) {
    for (const ec of existingNewContact) {
      if (ec.id !== '03490d7f-5337-41be-b80f-a8d257c394ce') {
        console.log(`Menghapus record kontak duplikat kosong ID: ${ec.id}`);
        await supabase.from('wa_conversations').delete().eq('contact_id', ec.id);
        await supabase.from('wa_contacts').delete().eq('id', ec.id);
      }
    }
  }

  // 2. Update contact 03490d7f-5337-41be-b80f-a8d257c394ce
  const { data: updatedContact, error: cErr } = await supabase
    .from('wa_contacts')
    .update({
      name: contactName,
      phone_number: newPhone,
      last_active_at: new Date().toISOString()
    })
    .or('id.eq.03490d7f-5337-41be-b80f-a8d257c394ce,phone_number.eq.+95288547082364,phone_number.eq.95288547082364')
    .select();

  if (cErr) {
    console.error('Error update contact:', cErr);
  } else {
    console.log('✅ Kontak berhasil diupdate:', updatedContact);
  }

  // 3. Buat / Pastikan conversation conv-6285195999944@s.whatsapp.net ada
  const { data: existingTargetConv } = await supabase
    .from('wa_conversations')
    .select('*')
    .eq('id', `conv-${newJid}`)
    .single();

  if (!existingTargetConv) {
    // Ambil metadata dari conv lama
    const { data: oldConv } = await supabase
      .from('wa_conversations')
      .select('*')
      .or(`id.eq.conv-${oldJid},id.eq.conv-${oldLidJid}`)
      .limit(1)
      .single();

    const convPayload = {
      id: `conv-${newJid}`,
      contact_id: '03490d7f-5337-41be-b80f-a8d257c394ce',
      last_message: oldConv?.last_message || 'Percakapan Kang Jay',
      status: 'active',
      unread_count: 0,
      bidang: oldConv?.bidang || 'SEKRETARIAT',
      prioritas: oldConv?.prioritas || 'NORMAL',
      layanan: oldConv?.layanan || 'Persetujuan Bangunan Gedung (PBG)',
      updated_at: new Date().toISOString()
    };

    const { error: insErr } = await supabase.from('wa_conversations').insert(convPayload);
    if (insErr) {
      console.warn('Insert conv error:', insErr.message);
    } else {
      console.log(`✅ Percakapan baru conv-${newJid} berhasil dibuat.`);
    }
  }

  // 4. Update semua pesan wa_messages yang tadinya mengarah ke conv lama
  const { data: updMsgs, error: mErr } = await supabase
    .from('wa_messages')
    .update({ conversation_id: `conv-${newJid}` })
    .or(`conversation_id.eq.conv-${oldJid},conversation_id.eq.conv-${oldLidJid}`)
    .select('id');

  if (mErr) {
    console.error('Error update messages:', mErr);
  } else {
    console.log(`✅ ${updMsgs?.length || 0} pesan berhasil dipindahkan ke conv-${newJid}.`);
  }

  // 5. Bersihkan percakapan lama yang sudah dipindah
  await supabase.from('wa_conversations').delete().or(`id.eq.conv-${oldJid},id.eq.conv-${oldLidJid}`);
  console.log('✅ Percakapan lama dengan ID 95288547082364 berhasil dibersihkan.');

  console.log('--- Selesai Memperbarui Kontak Kang Jay ---');
}

fixKangJay();
