"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { LogIn, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithSSO, loginWithCredentials, isLoading } = useAuth();
  const [error, setError] = useState('');

  const handleSSOLogin = async () => {
    setError('');
    try {
      await loginWithSSO();
    } catch (err: any) {
      setError('Gagal terhubung ke layanan otentikasi PUPR-ID.');
    }
  };

  const handleAdminLogin = async () => {
    setError('');
    try {
      if (loginWithCredentials) {
        await loginWithCredentials("admin@garutkab.go.id", "PUPRAdmin2024!");
      } else {
        setError('Layanan login kredensial tidak tersedia.');
      }
    } catch (err: any) {
      setError('Gagal login ke akun Admin PUPR.');
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-gray-50 bg-[url('/bg-garut.jpg')] bg-cover bg-center p-4 overflow-x-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-garut-blue/90 to-garut-blue/40 z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="modal-container-auth w-[92vw] sm:w-[480px] min-w-[360px] sm:min-w-[440px] max-w-[500px] shrink-0 p-8 sm:p-10 my-8 rounded-3xl glass-card border border-white/20 shadow-2xl relative z-10 bg-white/10 backdrop-blur-xl flex flex-col items-center"
      >
        {/* Header dengan Logo Garut dan PURI */}
        <div className="flex flex-col items-center mb-8 w-full">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-16 w-16 bg-white/90 p-2 rounded-2xl flex items-center justify-center shadow-lg border border-white/40">
              <img src="/favicon.ico" alt="Logo Kabupaten Garut" className="h-12 w-12 object-contain" />
            </div>
            <div className="h-16 w-16 bg-white/90 p-2 rounded-2xl flex items-center justify-center shadow-lg border border-white/40">
              <img src="/puri.png" alt="Logo PURI PUPR Garut" className="h-12 w-12 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white text-center tracking-tight">
            GPS-CC Portal
          </h1>
          <p className="text-white/80 text-sm sm:text-base mt-2 text-center font-medium">
            Sistem Otentikasi Terpusat PUPR-ID & PURI
          </p>
          <div className="mt-3 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold flex items-center gap-1.5">
            <span>🏛️</span>
            <span>Dinas PUPR Kabupaten Garut</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full bg-danger/20 border border-danger/50 text-white p-3.5 rounded-xl flex items-start gap-3 mb-6"
          >
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{error}</p>
          </motion.div>
        )}

        <div className="space-y-3.5 w-full">
          <Button 
            type="button" 
            onClick={handleAdminLogin}
            className="w-full bg-garut-gold hover:bg-yellow-500 text-garut-blue font-extrabold h-12 sm:h-13 py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-base"
            disabled={isLoading}
          >
            {isLoading ? 'Memproses Login...' : (
              <>
                <KeyRound className="w-5 h-5 mr-2.5 shrink-0" />
                <span>Login Akun Admin PUPR (Aktif)</span>
              </>
            )}
          </Button>

          <Button 
            type="button" 
            variant="outline"
            onClick={handleSSOLogin}
            className="w-full bg-white/15 border-white/30 text-white hover:bg-white/25 font-semibold h-11 py-2.5 px-6 rounded-xl transition-all flex items-center justify-center text-sm"
            disabled={isLoading}
          >
            <LogIn className="w-4 h-4 mr-2 shrink-0" />
            <span>Login dengan PUPR-ID (SSO Keycloak)</span>
          </Button>
        </div>

        {/* Info Akun Aktif */}
        <div className="w-full mt-6 p-4 rounded-2xl bg-white/10 border border-white/20 text-white/90 text-xs sm:text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-yellow-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Kredensial Akun Aktif (Demo & Operasional)</span>
          </div>
          <div className="bg-black/30 p-3 rounded-xl space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Super Admin:</span>
              <span className="text-white font-semibold">admin@garutkab.go.id</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Password:</span>
              <span className="text-yellow-300 font-bold">PUPRAdmin2024!</span>
            </div>
            <div className="border-t border-white/10 my-1 pt-1 flex justify-between items-center">
              <span className="text-white/70">Operator TIK:</span>
              <span className="text-white">operator@pupr.garutkab.go.id</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Password:</span>
              <span className="text-yellow-300 font-bold">Operator2026!</span>
            </div>
          </div>
        </div>

        <p className="text-center text-white/70 text-xs sm:text-sm mt-6 leading-relaxed w-full">
          Single Sign-On (SSO) ini terintegrasi langsung dengan <br className="hidden sm:inline" />
          <span className="font-semibold text-white">Platform Identitas Digital Terpadu DPUPR Kab. Garut</span>.
        </p>
      </motion.div>
    </div>
  );
}
