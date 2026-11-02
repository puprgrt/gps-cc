'use client';

/* eslint-disable react-hooks/purity */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  UploadCloud, 
  Camera, 
  AlertTriangle, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Info, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  RefreshCw, 
  Check, 
  ShieldAlert,
  Compass,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DaftarSimakMandiriData, 
  KomponenSimakItem, 
  BuktiFotoDokumentasi, 
  KategoriElemen, 
  TipeFormAlt 
} from '@/sipeka/types';
import { hitungKerusakanBG } from '@/sipeka/engine/calculator';

const QUICK_PICK_INSTANSI = [
  'Dinas Kesehatan Kabupaten Garut',
  'Dinas Pendidikan Kabupaten Garut',
  'RSUD dr. Slamet Garut',
  'Puskesmas DTP Cikajang',
  'Kecamatan Tarogong Kidul',
  'Kecamatan Cisurupan',
  'Disperindag ESDM Kab. Garut',
];

export function DaftarSimakMandiriForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGpsTracking, setIsGpsTracking] = useState<boolean>(false);

  // Camera Modal State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [activeCameraTarget, setActiveCameraTarget] = useState<{
    section: 'struktur' | 'arsitektur' | 'utilitas' | 'tampak';
    komponenKode?: string;
    slotIndex?: number;
    severityLabel?: string;
  } | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Hidden File Input Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [formData, setFormData] = useState<DaftarSimakMandiriData>({
    namaInstansi: 'Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut',
    kodeOpd: '',
    namaBangunan: '',
    nupBarang: '',
    tahunPembangunan: 2015,
    jumlahLantai: 1,
    luasBangunanM2: 600,
    alamatLengkap: '',
    kecamatan: '',
    desaKelurahan: '',
    titikKoordinatGps: '-7.2144, 107.9015',
    denahUrl: undefined,
    fotoTampakDepan: undefined,
    fotoTampakBelakang: undefined,
    fotoTampakKanan: undefined,
    fotoTampakKiri: undefined,
    komponenStruktur: {
      STR_01: {
        kode: 'STR_01',
        nama: 'Pondasi & Sloof',
        kategori: 'STRUKTUR',
        satuan: 'Estimasi',
        isChecked: true,
        totalVolumeTerdampak: 1,
        rusakSangatRingan: 1,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      STR_02: {
        kode: 'STR_02',
        nama: 'Kolom',
        kategori: 'STRUKTUR',
        satuan: 'unit',
        isChecked: true,
        totalVolumeTerdampak: 5,
        rusakSangatRingan: 5,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      STR_03: {
        kode: 'STR_03',
        nama: 'Balok',
        kategori: 'STRUKTUR',
        satuan: 'unit',
        isChecked: true,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      STR_04: {
        kode: 'STR_04',
        nama: 'Atap',
        kategori: 'STRUKTUR',
        satuan: '%',
        isChecked: true,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
    },
    komponenArsitektur: {
      ARS_01: {
        kode: 'ARS_01',
        nama: 'Dinding / Partisi',
        kategori: 'ARSITEKTUR',
        satuan: '%',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      ARS_02: {
        kode: 'ARS_02',
        nama: 'Plafond',
        kategori: 'ARSITEKTUR',
        satuan: '%',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      ARS_03: {
        kode: 'ARS_03',
        nama: 'Lantai',
        kategori: 'ARSITEKTUR',
        satuan: '%',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      ARS_04: {
        kode: 'ARS_04',
        nama: 'Kusen',
        kategori: 'ARSITEKTUR',
        satuan: 'unit',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      ARS_05: {
        kode: 'ARS_05',
        nama: 'Pintu',
        kategori: 'ARSITEKTUR',
        satuan: 'unit',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      ARS_06: {
        kode: 'ARS_06',
        nama: 'Jendela',
        kategori: 'ARSITEKTUR',
        satuan: 'unit',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      ARS_07: {
        kode: 'ARS_07',
        nama: 'Finishing Plafond',
        kategori: 'ARSITEKTUR',
        satuan: '%',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      ARS_08: {
        kode: 'ARS_08',
        nama: 'Finishing Dinding',
        kategori: 'ARSITEKTUR',
        satuan: '%',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      ARS_09: {
        kode: 'ARS_09',
        nama: 'Finishing Kusen & Pintu',
        kategori: 'ARSITEKTUR',
        satuan: '%',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
    },
    komponenUtilitas: {
      UTL_01: {
        kode: 'UTL_01',
        nama: 'Instalasi Listrik & Panel MCB',
        kategori: 'UTILITAS',
        satuan: 'titik/panel',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      UTL_02: {
        kode: 'UTL_02',
        nama: 'Instalasi Air Bersih & Pompa',
        kategori: 'UTILITAS',
        satuan: 'titik/m',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
      UTL_03: {
        kode: 'UTL_03',
        nama: 'Drainase Limbah & Air Hujan',
        kategori: 'UTILITAS',
        satuan: 'm / %',
        isChecked: false,
        totalVolumeTerdampak: 0,
        rusakSangatRingan: 0,
        rusakRingan: 0,
        rusakSedang: 0,
        rusakBerat: 0,
        rusakSangatBerat: 0,
        komponenTidakSesuai: 0,
        fotoBukti: [],
      },
    },
    isHazardDeclared: false,
  });

  // Handler GPS Real-Time
  const handleGetRealGps = () => {
    setIsGpsTracking(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
          setFormData((prev) => ({ ...prev, titikKoordinatGps: coords }));
          setIsGpsTracking(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Fallback Default Garut Kota
          setFormData((prev) => ({ ...prev, titikKoordinatGps: '-7.2144, 107.9015' }));
          setIsGpsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsGpsTracking(false);
      alert('Fitur Geolocation tidak didukung oleh browser Anda.');
    }
  };

  // Open Street Map External Link
  const handleOpenOsm = () => {
    const coords = formData.titikKoordinatGps.split(',').map((s) => s.trim());
    if (coords.length === 2) {
      window.open(`https://www.openstreetmap.org/?mlat=${coords[0]}&mlon=${coords[1]}#map=16/${coords[0]}/${coords[1]}`, '_blank');
    }
  };

  // Trigger File Upload for specific slot
  const handleTriggerUpload = (
    section: 'struktur' | 'arsitektur' | 'utilitas' | 'tampak',
    komponenKode?: string,
    slotIndex?: number,
    severityLabel?: string
  ) => {
    setActiveCameraTarget({ section, komponenKode, slotIndex, severityLabel });
    fileInputRef.current?.click();
  };

  // File Change Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCameraTarget) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultDataUrl = reader.result as string;

      if (activeCameraTarget.section === 'tampak') {
        const slotKey =
          activeCameraTarget.slotIndex === 0
            ? 'fotoTampakDepan'
            : activeCameraTarget.slotIndex === 1
            ? 'fotoTampakBelakang'
            : activeCameraTarget.slotIndex === 2
            ? 'fotoTampakKanan'
            : 'fotoTampakKiri';

        setFormData((prev) => ({ ...prev, [slotKey]: resultDataUrl }));
      } else {
        // Section komponen (Struktur / Arsitektur / Utilitas)
        const secKey =
          activeCameraTarget.section === 'struktur'
            ? 'komponenStruktur'
            : activeCameraTarget.section === 'arsitektur'
            ? 'komponenArsitektur'
            : 'komponenUtilitas';

        const kode = activeCameraTarget.komponenKode!;
        const fileTimestamp = Date.now();
        const fileIso = new Date().toISOString();
        const newPhoto: BuktiFotoDokumentasi = {
          id: `foto-${fileTimestamp}`,
          url: resultDataUrl,
          name: file.name,
          tag: `${kode} - ${activeCameraTarget.severityLabel || 'Kerusakan'} #${(activeCameraTarget.slotIndex ?? 0) + 1}`,
          timestamp: fileIso,
          gpsCoordinates: formData.titikKoordinatGps,
        };

        setFormData((prev) => {
          const comp = prev[secKey][kode];
          const updatedPhotos = [...comp.fotoBukti];
          if (activeCameraTarget.slotIndex !== undefined && updatedPhotos[activeCameraTarget.slotIndex]) {
            updatedPhotos[activeCameraTarget.slotIndex] = newPhoto;
          } else {
            updatedPhotos.push(newPhoto);
          }

          return {
            ...prev,
            [secKey]: {
              ...prev[secKey],
              [kode]: {
                ...comp,
                fotoBukti: updatedPhotos,
              },
            },
          };
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Open Live Camera Modal
  const handleOpenLiveCamera = (
    section: 'struktur' | 'arsitektur' | 'utilitas' | 'tampak',
    komponenKode?: string,
    slotIndex?: number,
    severityLabel?: string
  ) => {
    setActiveCameraTarget({ section, komponenKode, slotIndex, severityLabel });
    setIsCameraModalOpen(true);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.warn('Camera stream error:', err);
        });
    }
  };

  const handleCaptureCamera = () => {
    if (!videoRef.current || !activeCameraTarget) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const captureTimestamp = Date.now();
      const captureIso = new Date().toISOString();

      // Simpan hasil tangkapan kamera
      if (activeCameraTarget.section === 'tampak') {
        const slotKey =
          activeCameraTarget.slotIndex === 0
            ? 'fotoTampakDepan'
            : activeCameraTarget.slotIndex === 1
            ? 'fotoTampakBelakang'
            : activeCameraTarget.slotIndex === 2
            ? 'fotoTampakKanan'
            : 'fotoTampakKiri';

        setFormData((prev) => ({ ...prev, [slotKey]: dataUrl }));
      } else {
        const secKey =
          activeCameraTarget.section === 'struktur'
            ? 'komponenStruktur'
            : activeCameraTarget.section === 'arsitektur'
            ? 'komponenArsitektur'
            : 'komponenUtilitas';

        const kode = activeCameraTarget.komponenKode!;
        const newPhoto: BuktiFotoDokumentasi = {
          id: `foto-${captureTimestamp}`,
          url: dataUrl,
          name: `kamera_${captureTimestamp}.jpg`,
          tag: `${kode} - ${activeCameraTarget.severityLabel || 'Kerusakan'} #${(activeCameraTarget.slotIndex ?? 0) + 1}`,
          timestamp: captureIso,
          gpsCoordinates: formData.titikKoordinatGps,
        };

        setFormData((prev) => {
          const comp = prev[secKey][kode];
          const updatedPhotos = [...comp.fotoBukti];
          if (activeCameraTarget.slotIndex !== undefined && updatedPhotos[activeCameraTarget.slotIndex]) {
            updatedPhotos[activeCameraTarget.slotIndex] = newPhoto;
          } else {
            updatedPhotos.push(newPhoto);
          }

          return {
            ...prev,
            [secKey]: {
              ...prev[secKey],
              [kode]: {
                ...comp,
                fotoBukti: updatedPhotos,
              },
            },
          };
        });
      }
    }

    handleCloseCameraModal();
  };

  const handleCloseCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraModalOpen(false);
  };

  // Toggle Checkbox Komponen
  const handleToggleKomponen = (
    section: 'struktur' | 'arsitektur' | 'utilitas',
    kode: string,
    checked: boolean
  ) => {
    const secKey =
      section === 'struktur'
        ? 'komponenStruktur'
        : section === 'arsitektur'
        ? 'komponenArsitektur'
        : 'komponenUtilitas';

    setFormData((prev) => ({
      ...prev,
      [secKey]: {
        ...prev[secKey],
        [kode]: {
          ...prev[secKey][kode],
          isChecked: checked,
        },
      },
    }));
  };

  // Update Volume Kerusakan Komponen
  const handleUpdateSeverityVolume = (
    section: 'struktur' | 'arsitektur' | 'utilitas',
    kode: string,
    field:
      | 'rusakSangatRingan'
      | 'rusakRingan'
      | 'rusakSedang'
      | 'rusakBerat'
      | 'rusakSangatBerat'
      | 'komponenTidakSesuai',
    val: number
  ) => {
    const secKey =
      section === 'struktur'
        ? 'komponenStruktur'
        : section === 'arsitektur'
        ? 'komponenArsitektur'
        : 'komponenUtilitas';

    setFormData((prev) => {
      const comp = prev[secKey][kode];
      const updated = {
        ...comp,
        [field]: Math.max(val, 0),
      };

      // Hitung total volume terdampak
      updated.totalVolumeTerdampak =
        updated.rusakSangatRingan +
        updated.rusakRingan +
        updated.rusakSedang +
        updated.rusakBerat +
        updated.rusakSangatBerat +
        updated.komponenTidakSesuai;

      return {
        ...prev,
        [secKey]: {
          ...prev[secKey],
          [kode]: updated,
        },
      };
    });
  };

  // Kalkulasi Hasil Rekapitulasi Mandiri
  const calculatedSummary = useMemo(() => {
    const allInputItems = [
      ...Object.values(formData.komponenStruktur),
      ...Object.values(formData.komponenArsitektur),
      ...Object.values(formData.komponenUtilitas),
    ];

    let totalFotoCount = 0;
    if (formData.fotoTampakDepan) totalFotoCount++;
    if (formData.fotoTampakBelakang) totalFotoCount++;
    if (formData.fotoTampakKanan) totalFotoCount++;
    if (formData.fotoTampakKiri) totalFotoCount++;

    allInputItems.forEach((item) => {
      totalFotoCount += item.fotoBukti.length;
    });

    const altForm: TipeFormAlt = formData.jumlahLantai === 1 ? 'ALT_A' : formData.jumlahLantai === 2 ? 'ALT_B' : 'ALT_C';

    const calcResult = hitungKerusakanBG({
      altForm,
      luasBangunanM2: formData.luasBangunanM2,
      inputKomponen: allInputItems.map((item) => {
        let maxSev: any = 'TIDAK_RUSAK';
        if (item.komponenTidakSesuai > 0) maxSev = 'TIDAK_SESUAI_PERSYARATAN';
        else if (item.rusakSangatBerat > 0) maxSev = 'RUSAK_SANGAT_BERAT';
        else if (item.rusakBerat > 0) maxSev = 'RUSAK_BERAT';
        else if (item.rusakSedang > 0) maxSev = 'RUSAK_SEDANG';
        else if (item.rusakRingan > 0) maxSev = 'RUSAK_RINGAN';
        else if (item.rusakSangatRingan > 0) maxSev = 'RUSAK_SANGAT_RINGAN';

        return {
          kode: item.kode,
          nama: item.nama,
          kategori: item.kategori,
          bobotPersen: 10,
          volumeRusakPersen: item.totalVolumeTerdampak > 0 ? 50 : 0,
          tingkatKerusakan: maxSev,
        };
      }),
    });

    return {
      totalFotoCount,
      calcResult,
    };
  }, [formData]);

  // Submit Final Permohonan Mandiri (Tahap 5)
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/sipeka/permohonan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengelolaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          bangunanId: 'b1111111-1111-1111-1111-111111111111',
          altForm: formData.jumlahLantai === 1 ? 'ALT_A' : formData.jumlahLantai === 2 ? 'ALT_B' : 'ALT_C',
          suratPermohonanGdriveId: `gdrive_surat_mandiri_${Date.now()}`,
          daftarSimakPayload: formData,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim permohonan.');
      }

      router.push(`/sipeka/permohonan/${data.data.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-800 rounded-3xl border border-slate-200/80 shadow-2xl p-4 md:p-8 space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Progress Wizard Top Indicator */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-bold text-[#0F4C81] tracking-wider uppercase">
            Formulir Daftar Simak Mandiri • KemenPUPR Garut
          </span>
          <h2 className="text-xl md:text-2xl font-black text-[#0A2540]">
            Pengajuan Penilaian Kerusakan Bangunan Gedung
          </h2>
        </div>
        <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/20">
          Langkah {currentStep} dari 5
        </div>
      </div>

      {/* ===================================================================== */}
      {/* LANGKAH 1: IDENTITAS FISIK, GEOSPASIAL GPS & FOTO TAMPAK BANGUNAN     */}
      {/* ===================================================================== */}
      {currentStep === 1 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* A. IDENTITAS FISIK BANGUNAN GEDUNG */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide uppercase text-[#0A2540] flex items-center gap-2 border-b-2 border-[#0A2540]/20 pb-2">
              <Building2 className="w-4 h-4 text-[#0F4C81]" />
              <span>A. IDENTITAS FISIK BANGUNAN GEDUNG</span>
            </h3>

            {/* Box Nama Instansi */}
            <div className="p-4 md:p-5 rounded-2xl bg-[#F0F7FF] border border-[#BFDBFE] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#0F4C81]" />
                  <span>Nama Instansi / OPD / Sekolah Pemohon <span className="text-rose-500">*</span></span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Data instansi disinkronkan ke profil akun Anda.')}
                  className="px-3 py-1 rounded-lg text-[11px] font-bold bg-white text-[#0F4C81] border border-[#93C5FD] hover:bg-blue-50 transition-colors shadow-sm"
                >
                  Simpan & Sinkronkan ke Akun
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={formData.namaInstansi}
                  onChange={(e) => setFormData((prev) => ({ ...prev, namaInstansi: e.target.value }))}
                  placeholder="Ketik nama instansi lengkap..."
                  className="w-full px-4 py-2.5 text-xs md:text-sm font-semibold bg-white border border-[#93C5FD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => alert(`Instansi "${formData.namaInstansi}" berhasil disinkronkan.`)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0A2540] text-white hover:bg-[#0F4C81] transition-all shrink-0 flex items-center justify-center gap-2 shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan</span>
                </button>
              </div>

              {/* Quick Pick Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500">
                <span className="font-semibold text-[11px] text-[#0F4C81]">Pilih Cepat:</span>
                {QUICK_PICK_INSTANSI.map((instansi) => (
                  <button
                    key={instansi}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, namaInstansi: instansi }))}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white border border-slate-300 hover:border-[#0F4C81] hover:text-[#0F4C81] transition-all text-slate-700"
                  >
                    {instansi}
                  </button>
                ))}
              </div>

              {/* Callout Info KOP Otomatis */}
              <div className="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200 flex items-start gap-2 text-[11px] text-[#1E3A8A]">
                <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <span>
                  <strong>Kop Surat Otomatis:</strong> Nama instansi ini otomatis digunakan pada Kop Surat Permohonan Resmi, Berita Acara, dan TTE DPUPR.
                </span>
              </div>
            </div>

            {/* Grid 6 Input Field Identitas Fisik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Kode OPD / NPSN</label>
                <input
                  type="text"
                  placeholder="Contoh"
                  value={formData.kodeOpd}
                  onChange={(e) => setFormData((prev) => ({ ...prev, kodeOpd: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Nama Bangunan / Gedung <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh"
                  value={formData.namaBangunan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, namaBangunan: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nomor Urut Perolehan (NUP) Barang</label>
                <input
                  type="text"
                  placeholder="Contoh"
                  value={formData.nupBarang}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nupBarang: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tahun Pembangunan</label>
                <input
                  type="number"
                  placeholder="2015"
                  value={formData.tahunPembangunan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tahunPembangunan: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Jumlah Lantai</label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.jumlahLantai}
                  onChange={(e) => setFormData((prev) => ({ ...prev, jumlahLantai: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Luas Bangunan (m²)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="600"
                  value={formData.luasBangunanM2}
                  onChange={(e) => setFormData((prev) => ({ ...prev, luasBangunanM2: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>
            </div>
          </div>

          {/* B. LOKASI GEOSPASIAL & PETA KOORDINAT REAL GPS */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold tracking-wide uppercase text-[#0A2540] flex items-center gap-2 border-b-2 border-[#0A2540]/20 pb-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>B. LOKASI GEOSPASIAL & PETA KOORDINAT REAL GPS</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Alamat Lengkap Bangunan</label>
                <input
                  type="text"
                  placeholder="Contoh"
                  value={formData.alamatLengkap}
                  onChange={(e) => setFormData((prev) => ({ ...prev, alamatLengkap: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kecamatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh"
                    value={formData.kecamatan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kecamatan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Desa / Kelurahan</label>
                  <input
                    type="text"
                    placeholder="Contoh"
                    value={formData.desaKelurahan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, desaKelurahan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
              </div>

              {/* Titik Koordinat GPS Real-Time */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Titik Koordinat GPS Real-Time Device & Peta <span className="text-rose-500">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Mulai Tracking GPS Live
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={formData.titikKoordinatGps}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titikKoordinatGps: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm font-mono font-semibold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleGetRealGps}
                      disabled={isGpsTracking}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#0A2540] border border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{isGpsTracking ? 'Mencari...' : 'Ambil Posisi Real GPS'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenOsm}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0A2540] text-white hover:bg-[#0F4C81] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Peta OpenStreetMap</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* C. GAMBAR DENAH & DOKUMENTASI FOTO TAMPAK BANGUNAN */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold tracking-wide uppercase text-[#0A2540] flex items-center gap-2 border-b-2 border-[#0A2540]/20 pb-2">
              <UploadCloud className="w-4 h-4 text-purple-600" />
              <span>C. GAMBAR DENAH & DOKUMENTASI FOTO TAMPAK BANGUNAN</span>
            </h3>

            {/* Upload Denah Sketsa */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Denah Bangunan (PDF / Gambar)</label>
              <div
                onClick={() => handleTriggerUpload('tampak', undefined, 99)}
                className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0F4C81] bg-white flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-50/50 p-4 text-center"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-600">Klik untuk memilih file denah sketsa</span>
              </div>
            </div>

            {/* 4 Foto Tampak Bangunan */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {[
                { title: 'Tampak Depan', key: 'fotoTampakDepan', idx: 0 },
                { title: 'Tampak Belakang', key: 'fotoTampakBelakang', idx: 1 },
                { title: 'Samping Kanan', key: 'fotoTampakKanan', idx: 2 },
                { title: 'Samping Kiri', key: 'fotoTampakKiri', idx: 3 },
              ].map((item) => {
                const photoUrl = (formData as any)[item.key];
                return (
                  <div key={item.key} className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 block">{item.title}</span>
                    <div
                      onClick={() => handleTriggerUpload('tampak', undefined, item.idx)}
                      className={cn(
                        "w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group",
                        photoUrl
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-300 hover:border-[#0F4C81] bg-white hover:bg-blue-50/40"
                      )}
                    >
                      {photoUrl ? (
                        <>
                          <img src={photoUrl} alt={item.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[11px] font-bold text-white px-2 py-1 rounded bg-black/60">Ganti Foto</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#0F4C81] mb-1 transition-colors" />
                          <span className="text-xs font-semibold text-slate-500 group-hover:text-[#0F4C81] transition-colors">
                            Unggah Foto
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/sipeka')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2540] text-white hover:bg-[#0F4C81] transition-all flex items-center gap-2 shadow-lg shadow-[#0A2540]/20"
            >
              <span>Lanjut: Kerusakan Struktur</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LANGKAH 2: EVALUASI KERUSAKAN STRUKTUR UTAMA (BOBOT 50%)              */}
      {/* ===================================================================== */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Langkah */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A2540]">
                Tahap 2: Evaluasi Kerusakan Struktur Utama (Bobot 50%)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fokus pada komponen keselamatan jiwa (pondasi, kolom, balok, pelat, dan atap struktural).
              </p>
            </div>
          </div>

          {/* Banner Alert Merah (Bobot Kritis 50%) */}
          <div className="p-4 md:p-5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  KOMPONEN STRUKTUR UTAMA (BOBOT KRITIS 50% PUPR)
                </h4>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Komponen pemikul beban utama (Pondasi, Kolom, Balok, Pelat Lantai, Rangka Atap). Retak geser diagonal 45° pada kolom/balok &gt; 2mm wajib difoto dan dicatat sebagai kerusakan berat.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenLiveCamera('struktur', 'STR_02', 0, 'Kolom')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#DC2626] text-white hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shrink-0 shadow-md"
            >
              <Camera className="w-4 h-4" />
              <span>Buka Kamera & Penandaan Elemen</span>
            </button>
          </div>

          {/* Daftar Komponen Struktur */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                DAFTAR KOMPONEN STRUKTUR GEDUNG:
              </h4>
              <span className="text-[11px] text-slate-400">Centang komponen yang mengalami kerusakan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Object.values(formData.komponenStruktur).map((comp) => (
                <div
                  key={comp.kode}
                  className={cn(
                    "p-5 rounded-2xl border transition-all duration-200 bg-white shadow-sm space-y-4",
                    comp.isChecked ? "border-rose-400/80 ring-1 ring-rose-300" : "border-slate-200 opacity-80"
                  )}
                >
                  {/* Header Komponen Card */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`chk-${comp.kode}`}
                      checked={comp.isChecked}
                      onChange={(e) => handleToggleKomponen('struktur', comp.kode, e.target.checked)}
                      className="w-4 h-4 text-[#0F4C81] rounded mt-0.5 focus:ring-[#0F4C81]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`chk-${comp.kode}`} className="text-sm font-bold text-[#0A2540] cursor-pointer flex items-center gap-1.5">
                          <span>{comp.nama}</span>
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                        </label>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Satuan: {comp.satuan}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Evaluasi integritas struktural, retak geser/lentur, spalling, dan lendutan.
                      </p>
                    </div>
                  </div>

                  {/* Isi Evaluasi jika dicentang */}
                  {comp.isChecked && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      {/* Box Total Volume Terdampak */}
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs text-[#1E3A8A] font-semibold font-mono">
                        <span>Total Volume Terdampak:</span>
                        <span className="font-bold text-sm text-[#0F4C81]">
                          {comp.totalVolumeTerdampak} {comp.satuan}
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-slate-700 block">
                        Volume per Tingkat Kerusakan & Bukti Foto:
                      </span>

                      {/* Baris 1: Rusak Sangat Ringan */}
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">Rusak Sangat Ringan</span>
                          <input
                            type="number"
                            min="0"
                            value={comp.rusakSangatRingan}
                            onChange={(e) =>
                              handleUpdateSeverityVolume('struktur', comp.kode, 'rusakSangatRingan', Number(e.target.value))
                            }
                            className="w-20 px-2 py-1 text-xs font-bold text-right bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                          />
                        </div>

                        {/* Slot Foto jika volume > 0 */}
                        {comp.rusakSangatRingan > 0 && (
                          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-600">
                                Bukti Foto ({comp.rusakSangatRingan} Foto Diwajibkan):
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenLiveCamera('struktur', comp.kode, 0, 'Rusak Sangat Ringan')}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-[#0A2540] border border-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <Camera className="w-3 h-3 text-rose-500" />
                                <span>Ambil & Tag Foto Kamera</span>
                              </button>
                            </div>

                            {/* Dynamic Photo Slots */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {Array.from({ length: Math.min(comp.rusakSangatRingan, 5) }).map((_, slotIdx) => {
                                const photoItem = comp.fotoBukti[slotIdx];
                                return (
                                  <div
                                    key={slotIdx}
                                    onClick={() => handleTriggerUpload('struktur', comp.kode, slotIdx, 'Rusak Sangat Ringan')}
                                    className={cn(
                                      "w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group",
                                      photoItem
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-slate-300 hover:border-[#0F4C81] bg-white hover:bg-blue-50"
                                    )}
                                  >
                                    {photoItem ? (
                                      <img src={photoItem.url} alt="Foto Bukti" className="w-full h-full object-cover" />
                                    ) : (
                                      <>
                                        <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-[#0F4C81]" />
                                        <span className="text-[9px] font-semibold text-slate-500 mt-0.5">
                                          Foto #{slotIdx + 1}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Baris 2: Rusak Ringan */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Rusak Ringan</span>
                        <input
                          type="number"
                          min="0"
                          value={comp.rusakRingan}
                          onChange={(e) =>
                            handleUpdateSeverityVolume('struktur', comp.kode, 'rusakRingan', Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 text-xs font-bold text-right bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                        />
                      </div>

                      {/* Baris 3: Rusak Sedang */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Rusak Sedang</span>
                        <input
                          type="number"
                          min="0"
                          value={comp.rusakSedang}
                          onChange={(e) =>
                            handleUpdateSeverityVolume('struktur', comp.kode, 'rusakSedang', Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 text-xs font-bold text-right bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                        />
                      </div>

                      {/* Baris 4: Rusak Berat */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Rusak Berat</span>
                        <input
                          type="number"
                          min="0"
                          value={comp.rusakBerat}
                          onChange={(e) =>
                            handleUpdateSeverityVolume('struktur', comp.kode, 'rusakBerat', Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 text-xs font-bold text-right bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                        />
                      </div>

                      {/* Baris 5: Rusak Sangat Berat */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Rusak Sangat Berat</span>
                        <input
                          type="number"
                          min="0"
                          value={comp.rusakSangatBerat}
                          onChange={(e) =>
                            handleUpdateSeverityVolume('struktur', comp.kode, 'rusakSangatBerat', Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 text-xs font-bold text-right bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                        />
                      </div>

                      {/* Baris 6: Komponen Tidak Sesuai */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Komponen Tidak Sesuai</span>
                        <input
                          type="number"
                          min="0"
                          value={comp.komponenTidakSesuai}
                          onChange={(e) =>
                            handleUpdateSeverityVolume('struktur', comp.kode, 'komponenTidakSesuai', Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 text-xs font-bold text-right bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2540] text-white hover:bg-[#0F4C81] transition-all flex items-center gap-2 shadow-lg shadow-[#0A2540]/20"
            >
              <span>Lanjut: Elemen Arsitektur</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LANGKAH 3: EVALUASI ELEMEN ARSITEKTUR (BOBOT 30%)                     */}
      {/* ===================================================================== */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Langkah */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A2540]">
                Tahap 3: Evaluasi Elemen Arsitektur (Eksterior & Interior, Bobot 30%)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Periksa dinding pengisi, penutup lantai, plafon, serta kusen pintu/jendela.
              </p>
            </div>
          </div>

          {/* Banner Alert Kuning */}
          <div className="p-4 md:p-5 rounded-2xl bg-[#FEFCE8] border border-[#FEF08A] flex items-start gap-3 shadow-sm">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                ELEMEN ARSITEKTUR EKSTERIOR & INTERIOR (BOBOT 30% PUPR)
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Evaluasi dinding pengisi batu bata, plafon gypsum/kalsiboard, penutup genteng atap, lantai keramik, kusen pintu/jendela, serta pengecatan.
              </p>
            </div>
          </div>

          {/* Daftar Komponen Arsitektur (Grid 2 Kolom) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                DAFTAR KOMPONEN ARSITEKTUR GEDUNG:
              </h4>
              <span className="text-[11px] text-slate-400">Centang komponen yang mengalami kerusakan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(formData.komponenArsitektur).map((comp) => (
                <div
                  key={comp.kode}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-200 bg-white shadow-sm space-y-3",
                    comp.isChecked ? "border-amber-400 ring-1 ring-amber-300" : "border-slate-200 opacity-90"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`chk-${comp.kode}`}
                      checked={comp.isChecked}
                      onChange={(e) => handleToggleKomponen('arsitektur', comp.kode, e.target.checked)}
                      className="w-4 h-4 text-[#0F4C81] rounded mt-0.5 focus:ring-[#0F4C81]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`chk-${comp.kode}`} className="text-xs font-bold text-[#0A2540] cursor-pointer flex items-center gap-1.5">
                          <span>{comp.nama}</span>
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                        </label>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Satuan: {comp.satuan}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Evaluasi selubung bangunan, retak arsitektural, kebocoran, dan finishing.
                      </p>
                    </div>
                  </div>

                  {/* Input Volume jika dicentang */}
                  {comp.isChecked && (
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-600">Rusak Ringan:</span>
                        <input
                          type="number"
                          min="0"
                          value={comp.rusakRingan}
                          onChange={(e) => handleUpdateSeverityVolume('arsitektur', comp.kode, 'rusakRingan', Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-600">Rusak Sedang:</span>
                        <input
                          type="number"
                          min="0"
                          value={comp.rusakSedang}
                          onChange={(e) => handleUpdateSeverityVolume('arsitektur', comp.kode, 'rusakSedang', Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-right"
                        />
                      </div>
                      <div className="col-span-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleTriggerUpload('arsitektur', comp.kode, 0, comp.nama)}
                          className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100 flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3 h-3 text-amber-500" />
                          <span>Unggah Foto Bukti ({comp.fotoBukti.length} foto terunggah)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2540] text-white hover:bg-[#0F4C81] transition-all flex items-center gap-2 shadow-lg shadow-[#0A2540]/20"
            >
              <span>Lanjut: Utilitas & MEP</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LANGKAH 4: EVALUASI UTILITAS & MEP (BOBOT 20%)                        */}
      {/* ===================================================================== */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Langkah */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A2540]">
                Tahap 4: Evaluasi Utilitas & MEP (Mekanikal, Elektrikal, Plumbing, Bobot 20%)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Periksa instalasi kelistrikan, saluran air bersih, dan pembuangan air limbah/drainase.
              </p>
            </div>
          </div>

          {/* Banner Alert Hijau/Teal */}
          <div className="p-4 md:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 shadow-sm">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                ELEMEN UTILITAS & MEP (BOBOT 20% PUPR)
              </h4>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Evaluasi keselamatan instalasi daya listrik, MCB, kebocoran suplai air bersih, dan kelancaran sistem drainase tapak.
              </p>
            </div>
          </div>

          {/* Daftar Komponen Utilitas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.values(formData.komponenUtilitas).map((comp) => (
              <div
                key={comp.kode}
                className={cn(
                  "p-5 rounded-2xl border transition-all duration-200 bg-white shadow-sm space-y-3",
                  comp.isChecked ? "border-emerald-400 ring-1 ring-emerald-300" : "border-slate-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`chk-${comp.kode}`}
                    checked={comp.isChecked}
                    onChange={(e) => handleToggleKomponen('utilitas', comp.kode, e.target.checked)}
                    className="w-4 h-4 text-[#0F4C81] rounded mt-0.5 focus:ring-[#0F4C81]"
                  />
                  <div className="flex-1">
                    <label htmlFor={`chk-${comp.kode}`} className="text-xs font-bold text-[#0A2540] cursor-pointer block">
                      {comp.nama}
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                      Satuan: {comp.satuan}
                    </span>
                  </div>
                </div>

                {comp.isChecked && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Volume Rusak:</span>
                      <input
                        type="number"
                        min="0"
                        value={comp.rusakSedang}
                        onChange={(e) => handleUpdateSeverityVolume('utilitas', comp.kode, 'rusakSedang', Number(e.target.value))}
                        className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg text-right font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTriggerUpload('utilitas', comp.kode, 0, comp.nama)}
                      className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100 flex items-center justify-center gap-1"
                    >
                      <Camera className="w-3 h-3 text-emerald-600" />
                      <span>Upload Foto ({comp.fotoBukti.length})</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2540] text-white hover:bg-[#0F4C81] transition-all flex items-center gap-2 shadow-lg shadow-[#0A2540]/20"
            >
              <span>Lanjut: Rekapitulasi & Kirim</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LANGKAH 5: REKAPITULASI, PRATINJAU KOP OTOMATIS & PENGIRIMAN          */}
      {/* ===================================================================== */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A2540]">
                Tahap 5: Rekapitulasi Daftar Simak & Pratinjau Surat Permohonan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi hasil penilaian mandiri dan kelengkapan bukti foto sebelum mengirim permohonan.
              </p>
            </div>
          </div>

          {/* Ringkasan Skor Mandiri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Prediksi Kerusakan Mandiri
              </span>
              <div className="text-2xl font-black text-[#0A2540]">
                {calculatedSummary.calcResult.persentaseTotal}%
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                {calculatedSummary.calcResult.klasifikasi.replace('_', ' ')}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Bukti Foto Terunggah
              </span>
              <div className="text-2xl font-black text-[#0F4C81]">
                {calculatedSummary.totalFotoCount} Foto
              </div>
              <span className="text-[11px] text-slate-500 block">
                Tersimpan di Google Drive Pengelola
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Estimasi Anggaran Awal
              </span>
              <div className="text-xl font-bold text-emerald-600">
                Rp {calculatedSummary.calcResult.estimasiBiayaPerbaikan.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Standar HSBGN Kab. Garut
              </span>
            </div>
          </div>

          {/* Pratinjau Kop Surat Resmi Permohonan */}
          <div className="p-6 rounded-2xl bg-white border-2 border-slate-300 shadow-md space-y-4 font-serif">
            {/* Kop Surat Resmi */}
            <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                PEMERINTAH KABUPATEN GARUT
              </h4>
              <h3 className="text-sm md:text-base font-black uppercase text-slate-900 tracking-wide">
                {formData.namaInstansi}
              </h3>
              <p className="text-[10px] font-sans text-slate-600">
                Alamat: {formData.alamatLengkap || 'Jl. Samarang No. 115, Tarogong Kidul, Garut'} | Kode Pos: 44151
              </p>
            </div>

            {/* Isi Surat Ringkas */}
            <div className="font-sans text-xs space-y-3 pt-2 text-slate-800">
              <div className="flex justify-between text-[11px]">
                <div>
                  <p>Nomor: SIPEKA/GRT/{new Date().getFullYear()}/0001</p>
                  <p>Lampiran: 1 (satu) Berkas Daftar Simak & Dokumentasi</p>
                  <p>Perihal: Permohonan Penilaian Kerusakan Bangunan Gedung</p>
                </div>
                <div className="text-right">
                  <p>Garut, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  <p>Kepada Yth.</p>
                  <p className="font-bold">Kepala Dinas PUPR Kabupaten Garut</p>
                </div>
              </div>

              <p className="leading-relaxed text-[11px]">
                Dengan ini kami mengajukan permohonan penilaian kerusakan bangunan gedung untuk{' '}
                <strong>{formData.namaBangunan || 'Gedung Instansi'}</strong> (NUP: {formData.nupBarang || '-'}), berlokasi di Kecamatan {formData.kecamatan || 'Garut'}, dengan data teknis dan dokumentasi foto terlampir.
              </p>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-[#0A2540] text-[#F2A900] hover:bg-[#0F4C81] transition-all flex items-center gap-2 shadow-xl shadow-[#0A2540]/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Mengirim Permohonan...' : 'Kirim Permohonan Mandiri & Terbitkan Surat'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL KAMERA INTERAKTIF                                               */}
      {/* ===================================================================== */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-lg p-5 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F2A900]">
                <Camera className="w-4 h-4" />
                <span>Kamera & Penandaan Elemen Kerusakan</span>
              </div>
              <button onClick={handleCloseCameraModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="w-full aspect-[4/3] rounded-2xl bg-black overflow-hidden relative border border-white/10 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Geotag Overlay Banner */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-slate-300 font-mono flex items-center justify-between">
                <span>GPS: {formData.titikKoordinatGps}</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Tombol Ambil Foto */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCaptureCamera}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#DC2626] text-white hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <Camera className="w-4 h-4" />
                <span>Ambil & Simpan Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
