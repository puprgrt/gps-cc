"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ShieldCheck, LogIn, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithSSO, loginBypass, isLoading } = useAuth();
  const [error, setError] = useState('');

  const handleSSOLogin = async () => {
    setError('');
    try {
      await loginWithSSO();
    } catch (err: any) {
      setError('Gagal terhubung ke layanan otentikasi PUPR-ID.');
    }
  };

  const handleBypass = async () => {
    setError('');
    try {
      await loginBypass();
    } catch (err: any) {
      setError('Bypass gagal.');
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-gray-50 bg-[url('/bg-garut.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-gradient-to-br from-garut-blue/90 to-garut-blue/40 z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 m-4 rounded-3xl glass-card border border-white/20 shadow-2xl relative z-10 bg-white/10 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-inner shadow-white/10">
            <ShieldCheck className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">GPS-CC Portal</h1>
          <p className="text-white/70 text-sm mt-2 text-center">
            Sistem Otentikasi Terpusat PUPR-ID
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-danger/20 border border-danger/50 text-white p-3 rounded-lg flex items-start gap-3 mb-6"
          >
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <div className="space-y-4">
          <Button 
            type="button" 
            onClick={handleSSOLogin}
            className="w-full bg-white text-garut-blue hover:bg-gray-100 font-semibold h-12 shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Login dengan PUPR-ID
              </>
            )}
          </Button>

          <Button 
            type="button" 
            variant="outline" 
            onClick={handleBypass}
            className="w-full h-12 bg-black/40 border-yellow-500/50 text-yellow-400 hover:bg-black/60 hover:text-yellow-300 font-semibold shadow-inner"
            disabled={isLoading}
          >
            <KeyRound className="w-4 h-4 mr-2" />
            Bypass ke Dashboard (Dev)
          </Button>
        </div>

        <p className="text-center text-white/50 text-xs mt-8">
          Single Sign-On (SSO) ini terintegrasi langsung dengan<br />
          Platform Identitas Digital Terpadu DPUPR Kab. Garut.
        </p>
      </motion.div>
    </div>
  );
}
