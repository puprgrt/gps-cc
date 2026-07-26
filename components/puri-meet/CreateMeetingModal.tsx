'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X as XIcon, Calendar, Clock, Users, FileText, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateMeetingInput } from '@/domain/puriMeet';
import { MEETING_TYPE_LABELS, BIDANG_LABELS } from '@/domain/puriMeet';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMeetingInput) => Promise<void>;
}

export function CreateMeetingModal({ isOpen, onClose, onSubmit }: CreateMeetingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateMeetingInput>>({
    title: '',
    type: 'KONSULTASI_PBG',
    priority: 'NORMAL',
    bidang: 'LINTAS_BIDANG',
    durationMinutes: 60,
    maxParticipants: 20,
    description: '',
    scheduledAt: '',
    agenda: [],
    participants: [],
  });

  const [agendaInput, setAgendaInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduledAt) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData as CreateMeetingInput);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAgenda = () => {
    if (!agendaInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      agenda: [...(prev.agenda || []), agendaInput.trim()],
    }));
    setAgendaInput('');
  };

  const removeAgenda = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      agenda: prev.agenda?.filter((_, i) => i !== idx),
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative modal-container glass-card border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
            <div>
              <h2 className="text-lg font-bold text-white">Jadwalkan Meeting Baru</h2>
              <p className="text-xs text-slate-400 mt-1">PURI Meet Video Conference</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <form id="create-meeting-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Title & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    Judul Meeting <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="Misal: Konsultasi PBG Gedung A"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    Tipe Meeting
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CreateMeetingInput['type'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    {Object.entries(MEETING_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val} className="bg-slate-900">{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Date & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Waktu Mulai <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      Durasi (Menit)
                    </label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 60 })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      Maks Peserta
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 20 })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Bidang & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Bidang Terkait</label>
                  <select
                    value={formData.bidang}
                    onChange={(e) => setFormData({ ...formData, bidang: e.target.value as CreateMeetingInput['bidang'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    {Object.entries(BIDANG_LABELS).map(([val, label]) => (
                      <option key={val} value={val} className="bg-slate-900">{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Prioritas
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as CreateMeetingInput['priority'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="NORMAL" className="bg-slate-900">Normal</option>
                    <option value="PENTING" className="bg-slate-900">Penting</option>
                    <option value="MENDESAK" className="bg-slate-900">Mendesak</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Agenda */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Agenda / Topik Pembahasan</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agendaInput}
                    onChange={(e) => setAgendaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAgenda();
                      }
                    }}
                    placeholder="Ketik topik agenda lalu tekan Enter atau klik Tambah"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={addAgenda}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
                  >
                    Tambah
                  </button>
                </div>
                {/* Agenda List */}
                {formData.agenda && formData.agenda.length > 0 && (
                  <ul className="mt-3 space-y-2 bg-black/20 rounded-lg border border-white/5 p-3">
                    {formData.agenda.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between group">
                        <span className="text-sm text-slate-300 flex items-center gap-2">
                          <span className="text-blue-400 font-bold">{idx + 1}.</span> {item}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAgenda(idx)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Row 5: Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tambahkan catatan khusus untuk peserta..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all custom-scrollbar placeholder:text-slate-600 resize-none"
                />
              </div>

            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-white/10 bg-black/40 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              form="create-meeting-form"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Jadwalkan Meeting'
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
