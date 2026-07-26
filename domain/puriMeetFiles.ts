/**
 * PURI Meet File Sharing Domain Types
 * Smart Video Conference & Collaboration for GPS-CC
 */

export interface MeetingFile {
  id: string;
  meetingId: string;
  fileName: string;
  fileSize: number; // bytes
  fileType: string; // MIME type
  storagePath: string;
  uploadedBy: string; // Name of uploader
  createdAt: string; // ISO 8601
  url?: string; // Signed download URL
}

export interface UploadFileInput {
  meetingId: string;
  file: File;
  uploadedBy: string;
}
