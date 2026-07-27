import React from 'react';
import { SurveyPublicForm } from '@/components/spms/SurveyPublicForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Survei Kepuasan Masyarakat (SKM) | Dinas PUPR Garut',
  description: 'Form survei penilaian kepuasan masyarakat terhadap layanan Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut.',
};

export default function SPMSPublicSurveyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
      {/* Header Section */}


      {/* Form Component */}
      <SurveyPublicForm />
      
      {/* Footer */}
      <div className="mt-12 text-center text-xs text-slate-500 pb-8">
        &copy; {new Date().getFullYear()} GPS-CC Dinas PUPR Kab. Garut. All rights reserved.
      </div>
    </div>
  );
}
