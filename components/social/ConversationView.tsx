/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Send, Paperclip, Smile, Image as ImageIcon, CheckCheck, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  platform: string;
  senderName: string;
  avatar: string;
  preview: string;
  time: string;
  sentiment: string;
  category: string;
}

export function ConversationView({ message }: { message: Message | null }) {
  if (!message) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl h-[600px] flex items-center justify-center">
        <p className="text-slate-400">Select a conversation</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl h-[600px] flex flex-col">
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80">
        <div className="flex items-center gap-3">
          <img src={message.avatar} alt={message.senderName} className="w-10 h-10 rounded-full" />
          <div>
            <h2 className="font-semibold text-white">{message.senderName}</h2>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="capitalize">{message.platform}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-slate-900 border-slate-700">{message.category}</Badge>
          <button className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-slate-900/20 flex flex-col gap-4">
        <div className="flex justify-center">
          <span className="text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">Hari ini</span>
        </div>
        
        <div className="flex gap-3 max-w-[85%]">
          <img src={message.avatar} alt={message.senderName} className="w-8 h-8 rounded-full mt-auto" />
          <div className="bg-slate-700/50 rounded-2xl rounded-bl-sm p-3 border border-slate-600/50">
            <p className="text-sm text-slate-200">{message.preview}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">{message.time}</span>
          </div>
        </div>
        
        {/* Placeholder for AI Draft or Agent Reply */}
        <div className="flex gap-3 max-w-[85%] self-end">
          <div className="bg-blue-600/20 rounded-2xl rounded-br-sm p-3 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 px-1.5 py-0">AI Draft</Badge>
            </div>
            <p className="text-sm text-slate-300 italic">
              {message.category === 'PBG' && `Halo ${message.senderName}, untuk mengurus Persetujuan Bangunan Gedung (PBG), Anda dapat mendaftar secara online melalui portal SIMBG (simbg.pu.go.id) atau mengunjungi loket pelayanan kami di Mall Pelayanan Publik (MPP) Kabupaten Garut.`}
              {message.category === 'Jalan' && `Halo ${message.senderName}, terima kasih atas laporannya. Terkait kondisi infrastruktur jalan tersebut, segera kami teruskan ke Bidang Bina Marga Dinas PUPR Kabupaten Garut agar dapat dilakukan pengecekan dan penanganan lebih lanjut.`}
              {message.category === 'SLF' && `Halo ${message.senderName}, terima kasih atas apresiasinya. Kami senantiasa berkomitmen untuk memberikan pelayanan publik yang optimal, termasuk dalam proses penerbitan Sertifikat Laik Fungsi (SLF).`}
              {message.category === 'KRK' && `Halo ${message.senderName}, formulir dan persyaratan Keterangan Rencana Kabupaten (KRK) dapat diakses melalui portal resmi Bidang Tata Ruang PUPR Garut atau Bapak/Ibu dapat datang langsung ke kantor kami.`}
              {message.category === 'Irigasi' && `Terima kasih ${message.senderName}! Kami berharap pembangunan infrastruktur irigasi ini dapat memberikan manfaat yang besar bagi peningkatan produktivitas pertanian di Kabupaten Garut.`}
              {message.category === 'Drainase' && `Halo ${message.senderName}, terima kasih infonya. Kami memohon maaf atas gangguan lalu lintas yang terjadi selama proses perbaikan drainase. Pekerjaan ini kami upayakan selesai sesuai target waktu.`}
              {!['PBG', 'Jalan', 'SLF', 'KRK', 'Irigasi', 'Drainase'].includes(message.category) && `Halo ${message.senderName}, terima kasih telah menghubungi Dinas PUPR Kabupaten Garut. Pesan Anda telah kami terima.`}
            </p>
            <div className="flex justify-end mt-1">
               <span className="text-[10px] text-slate-400 flex items-center gap-1">Waiting for approval</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-700/50 bg-slate-800/80">
        <div className="flex items-end gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-700 focus-within:border-blue-500/50 transition-colors">
          <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-700/50">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-700/50">
            <ImageIcon className="w-5 h-5" />
          </button>
          <textarea 
            placeholder="Ketik balasan atau gunakan AI Copilot..." 
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 resize-none max-h-32 min-h-[40px] focus:outline-none py-2"
            rows={1}
          />
          <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-700/50">
            <Smile className="w-5 h-5" />
          </button>
          <button className="p-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
           <span className="text-xs text-slate-500 flex items-center gap-1">Press <kbd className="bg-slate-700 px-1 rounded text-slate-300">Enter</kbd> to send</span>
           <div className="flex gap-2">
             <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Use Template</button>
             <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">✨ Ask AI</button>
           </div>
        </div>
      </div>
    </div>
  );
}
