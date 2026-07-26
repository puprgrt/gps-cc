'use client';

import React, { useEffect, useState, useRef } from 'react';
import { UploadCloud, File, Download, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { PuriMeetFileService } from '@/services/puriMeetFileService';
import type { MeetingFile } from '@/domain/puriMeetFiles';
import { cn } from '@/lib/utils';
import type { ParticipantRole } from '@/domain/puriMeet';

interface MeetingFileShareProps {
  meetingId: string;
  userName: string;
  userRole: ParticipantRole;
  className?: string;
}

export function MeetingFileShare({ meetingId, userName, userRole, className }: MeetingFileShareProps) {
  const [files, setFiles] = useState<MeetingFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = React.useCallback(async () => {
    try {
      const data = await PuriMeetFileService.fetchFiles(meetingId);
      setFiles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat file.');
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchFiles();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchFiles]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check size limit (e.g., max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      await PuriMeetFileService.uploadFile({
        meetingId,
        file: selectedFile,
        uploadedBy: userName,
      });
      await fetchFiles(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Gagal mengupload file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (file: MeetingFile) => {
    try {
      const url = await PuriMeetFileService.getDownloadUrl(file.storagePath);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Gagal download file.');
    }
  };

  const handleDelete = async (file: MeetingFile) => {
    if (!confirm(`Hapus file ${file.fileName}?`)) return;
    
    try {
      await PuriMeetFileService.deleteFile(file.id, file.storagePath);
      await fetchFiles();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus file.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-slate-900/50 rounded-xl overflow-hidden border border-white/10", className)}>
      
      {/* Upload Area */}
      <div className="p-4 border-b border-white/10 bg-slate-950">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg bg-slate-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
              {isUploading ? 'Mengupload...' : 'Klik untuk Upload File'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Maks 10MB (PDF, Image, Doc)</p>
          </div>
        </button>

        {error && (
          <div className="mt-3 flex items-start gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {files.length === 0 ? (
          <div className="text-center text-sm text-slate-500 mt-10">
            Belum ada file dibagikan.
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-white/5 hover:bg-slate-800/80 transition-colors">
              <div className="p-2 rounded-md bg-slate-700 text-blue-400 shrink-0">
                <File className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate" title={file.fileName}>
                  {file.fileName}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span>•</span>
                  <span>{file.uploadedBy}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                {(userRole === 'HOST' || file.uploadedBy === userName) && (
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
