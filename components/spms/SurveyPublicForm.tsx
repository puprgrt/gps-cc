'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Send,
  Building2,
  User,
  Phone,
  MessageSquare,
  Smile,
  Frown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { SurveyFormData, SurveySettings, SurveyQuestion, PersonalDataField } from '@/domain/spms';
import { SPMSSurveyService } from '@/services/spmsSurveyService';

export function SurveyPublicForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settings, setSettings] = useState<SurveySettings | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<SurveyQuestion[]>([]);
  const [activeLayanan, setActiveLayanan] = useState<{value: string; label: string}[]>([]);
  const [activePersonalFields, setActivePersonalFields] = useState<PersonalDataField[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<SurveyFormData>>({
    respondentName: '',
    respondentPhone: '',
    gender: '',
    education: '',
    occupation: '',
    layanan: '',
    dimensions: {},
    npsScore: 8,
    comment: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const data = await SPMSSurveyService.getSettings();
        setSettings(data);
        
        // Filter and sort questions
        const filteredQuestions = (data.questions || [])
          .filter((q: SurveyQuestion) => q.isActive)
          .sort((a: SurveyQuestion, b: SurveyQuestion) => a.order - b.order);
        setActiveQuestions(filteredQuestions);
        
        // Filter layanan
        const filteredLayanan = (data.layananOptions || [])
          .filter((l: any) => l.isActive);
        setActiveLayanan(filteredLayanan);

        // Filter personal data fields
        const filteredPersonal = (data.personalDataFields || [])
          .filter((f: PersonalDataField) => f.isActive);
        setActivePersonalFields(filteredPersonal);

        if (filteredLayanan.length > 0) {
          setFormData(prev => ({ ...prev, layanan: filteredLayanan[0].value }));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const updateField = (field: keyof SurveyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateDimension = (id: string, score: number) => {
    setFormData(prev => ({
      ...prev,
      dimensions: { ...(prev.dimensions || {}), [id]: score }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.layanan) {
      setError('Pilih jenis layanan terlebih dahulu');
      setIsSubmitting(false);
      return;
    }

    // Default missing dimensions to 3 (Cukup) if not filled
    const finalDimensions = { ...formData.dimensions };
    activeQuestions.forEach(dim => {
      if (!finalDimensions[dim.id]) {
        finalDimensions[dim.id] = 3;
      }
    });

    const payload: SurveyFormData = {
      respondentName: formData.respondentName,
      respondentPhone: formData.respondentPhone,
      gender: formData.gender,
      education: formData.education,
      occupation: formData.occupation,
      layanan: formData.layanan,
      dimensions: finalDimensions,
      npsScore: formData.npsScore,
      comment: formData.comment
    };

    const result = await SPMSSurveyService.submitSurvey(payload);
    
    setIsSubmitting(false);
    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || 'Terjadi kesalahan saat mengirim data.');
    }
  };

  // ---------------------------------------------------------
  // RENDER STEPS
  // ---------------------------------------------------------

  const renderPersonalField = (field: PersonalDataField) => {
    const icons: Record<string, React.ReactNode> = {
      respondentName: <User className="w-4 h-4 text-slate-400" />,
      respondentPhone: <Phone className="w-4 h-4 text-slate-400" />,
      gender: <User className="w-4 h-4 text-slate-400" />,
      education: <User className="w-4 h-4 text-slate-400" />,
      occupation: <User className="w-4 h-4 text-slate-400" />,
    };
    const baseInputClass = 'w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-garut-blue transition-colors';

    return (
      <div key={field.id}>
        <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
          {icons[field.id] || <User className="w-4 h-4 text-slate-400" />}
          {field.label}
          {field.isRequired ? <span className="text-rose-500">*</span> : <span className="text-slate-500">(Opsional)</span>}
        </label>
        {field.fieldType === 'select' && field.options ? (
          <select
            value={(formData as any)[field.id] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
            className={`${baseInputClass} appearance-none`}
            required={field.isRequired}
          >
            <option value="">-- Pilih {field.label} --</option>
            {field.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.fieldType}
            placeholder={`Masukkan ${field.label.toLowerCase()}`}
            value={(formData as any)[field.id] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
            className={baseInputClass}
            required={field.isRequired}
          />
        )}
      </div>
    );
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Informasi Responden</h3>
        <p className="text-sm text-slate-400 mb-6">Bantu kami mengetahui layanan apa yang Anda nilai.</p>
      </div>

      <div className="space-y-4">
        {/* Jenis Layanan — selalu tampil */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-garut-blue" />
            Jenis Layanan yang Dinilai <span className="text-rose-500">*</span>
          </label>
          <select 
            value={formData.layanan}
            onChange={(e) => updateField('layanan', e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-garut-blue focus:ring-1 focus:ring-garut-blue transition-colors appearance-none"
            required
          >
            {activeLayanan.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Bidang Data Pribadi — dinamis dari settings */}
        {activePersonalFields.map(field => renderPersonalField(field))}
      </div>

      <div className="pt-6 flex justify-end">
        <button 
          onClick={handleNext}
          className="bg-garut-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
        >
          Lanjut <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Penilaian Layanan</h3>
        <p className="text-sm text-slate-400 mb-4">Berikan penilaian Anda dari 1 (Sangat Buruk) hingga 5 (Sangat Baik).</p>
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
        {activeQuestions.map((dim) => (
          <div key={dim.id} className="bg-white/5 border border-white/5 rounded-xl p-4 transition-all hover:bg-white/10">
            <h4 className="text-sm font-semibold text-slate-200 mb-3">{dim.label}</h4>
            <div className="flex justify-between items-center max-w-xs mx-auto">
              {[1, 2, 3, 4, 5].map((score) => {
                const currentScore = formData.dimensions?.[dim.id] || 0;
                const isActive = score <= currentScore;
                return (
                  <button
                    key={score}
                    onClick={() => updateDimension(dim.id, score)}
                    className="group flex flex-col items-center gap-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      className={`w-8 h-8 transition-colors ${isActive ? 'text-garut-gold fill-garut-gold' : 'text-slate-600 group-hover:text-slate-400'}`} 
                    />
                    <span className={`text-[10px] font-bold ${isActive ? 'text-garut-gold' : 'text-slate-500'}`}>
                      {score === 1 ? 'Buruk' : score === 5 ? 'Sangat Baik' : score}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {activeQuestions.length === 0 && (
          <div className="text-center text-slate-400 py-10">
            Tidak ada pertanyaan survei yang aktif.
          </div>
        )}
      </div>

      <div className="pt-4 flex justify-between">
        <button 
          onClick={handlePrev}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Kembali
        </button>
        <button 
          onClick={handleNext}
          className="bg-garut-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
        >
          Lanjut <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Feedback Tambahan</h3>
        <p className="text-sm text-slate-400">Bagaimana pengalaman Anda secara keseluruhan?</p>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-slate-200 mb-4 text-center">
          Seberapa besar kemungkinan Anda merekomendasikan layanan ini? (NPS)
        </h4>
        <div className="flex justify-between gap-1 mb-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <button
              key={score}
              onClick={() => updateField('npsScore', score)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${formData.npsScore === score 
                  ? score >= 9 ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20' 
                    : score >= 7 ? 'bg-amber-500 text-white scale-110 shadow-lg shadow-amber-500/20'
                    : 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold px-1">
          <span className="flex items-center gap-1 text-rose-400"><Frown className="w-3 h-3"/> Sangat Tidak Mungkin</span>
          <span className="flex items-center gap-1 text-emerald-400">Sangat Mungkin <Smile className="w-3 h-3"/></span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          Kritik & Saran (Opsional)
        </label>
        <textarea 
          rows={4}
          placeholder="Tuliskan pengalaman Anda menggunakan layanan kami..."
          value={formData.comment}
          onChange={(e) => updateField('comment', e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-garut-blue transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="pt-4 flex justify-between">
        <button 
          type="button"
          onClick={handlePrev}
          disabled={isSubmitting}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Kembali
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-600/20"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </div>
          ) : (
            <>Kirim Survei <Send className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center py-10"
    >
      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Terima Kasih!</h2>
      <p className="text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        Penilaian Anda telah berhasil disimpan. Masukan Anda sangat berharga bagi kami 
        untuk terus meningkatkan kualitas pelayanan publik.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="text-garut-blue hover:text-blue-400 font-bold underline transition-colors"
      >
        Isi Survei Baru
      </button>
    </motion.div>
  );

  if (isLoadingSettings) {
    return (
      <div className="w-full mx-auto flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-garut-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Header Info (Dynamic from DB) */}
      <div className="text-center mb-8 px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">{settings?.title || 'Survei Warga'}</h1>
        <p className="text-slate-300">
          {settings?.description || 'Terima kasih atas partisipasi Anda.'}
        </p>
      </div>

      {/* Progress Bar (Hidden on Success) */}
      {!isSuccess && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map(i => (
              <span key={i} className={`text-xs font-bold ${step >= i ? 'text-garut-blue' : 'text-slate-600'}`}>
                Langkah {i}
              </span>
            ))}
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-garut-blue transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="glass-card p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Abstract background blobs for premium feel */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-garut-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <React.Fragment key="success">{renderSuccess()}</React.Fragment>
            ) : (
              <React.Fragment key={`step-${step}`}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
              </React.Fragment>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
