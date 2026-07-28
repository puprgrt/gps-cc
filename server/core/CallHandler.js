const localDb = require('../services/localDbService');

class CallHandler {
  constructor(client) {
    this.client = client;
  }

  async handleIncoming(calls) {
    for (const call of calls) {
      if (call.status === 'offer') {
        const callerJid = call.from;
        const callType = call.isVideo ? 'Video' : 'Suara';
        
        this.client.addLog('CALL_INCOMING', `Panggilan ${callType} masuk dari ${callerJid}`);
        console.log(`[PUPR Baileys] Menerima Panggilan ${callType} dari ${callerJid}, menolak otomatis...`);

        try {
          // Reject the call
          await this.client.waSocket.rejectCall(call.id, callerJid);
          this.client.addLog('CALL_REJECTED', `Panggilan ${callType} dari ${callerJid} ditolak secara otomatis`);

          // Send an automatic polite reply
          const replyText = `_🏛️ Sistem Otomatis PURI_\n\nMohon maaf, layanan WhatsApp Center PUPR Garut saat ini tidak dapat menerima Panggilan ${callType}. \n\nSilakan sampaikan pertanyaan atau keluhan Anda melalui pesan teks/media (gambar/dokumen). Admin atau Asisten Virtual kami akan segera merespons Anda. Terima kasih.`;
          
          await this.client.sendMessageReliable(callerJid, { text: replyText });
          
          // Save the rejection message as a bot message in DB
          const botMsgObj = {
            id: `call-reject-${Date.now()}`,
            sender: 'bot',
            senderName: 'Sistem',
            text: replyText,
            timestamp: new Date().toISOString(),
            status: 'sent',
            type: 'text'
          };
          
          const cleanPhone = '+' + callerJid.split('@')[0];
          await localDb.saveMessage(`conv-${callerJid}`, botMsgObj, { name: cleanPhone, phoneNumber: cleanPhone });
          
        } catch (error) {
          console.error('[PUPR Baileys] Error saat menolak panggilan:', error);
          this.client.addLog('CALL_ERROR', `Error saat menolak panggilan: ${error.message}`, 'error');
        }
      }
    }
  }
}

module.exports = CallHandler;
