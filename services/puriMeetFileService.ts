import { supabase } from '@/lib/supabase';
import type { MeetingFile, UploadFileInput } from '@/domain/puriMeetFiles';

export class PuriMeetFileService {
  /**
   * Upload a new file to Supabase Storage and create a record in DB
   */
  static async uploadFile(input: UploadFileInput): Promise<MeetingFile> {
    const { meetingId, file, uploadedBy } = input;
    
    // 1. Upload to storage bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storagePath = `${meetingId}/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from('meeting-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      throw new Error(`Gagal mengupload file: ${storageError.message}`);
    }

    // 2. Insert record into database
    const { data, error: dbError } = await supabase
      .from('meeting_files')
      .insert({
        meeting_id: meetingId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      throw new Error(`Gagal menyimpan data file: ${dbError.message}`);
    }

    return {
      id: data.id,
      meetingId: data.meeting_id,
      fileName: data.file_name,
      fileSize: data.file_size,
      fileType: data.file_type,
      storagePath: data.storage_path,
      uploadedBy: data.uploaded_by,
      createdAt: data.created_at,
    };
  }

  /**
   * Fetch all files shared in a specific meeting
   */
  static async fetchFiles(meetingId: string): Promise<MeetingFile[]> {
    const { data, error } = await supabase
      .from('meeting_files')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch files error:', error);
      throw new Error(error.message);
    }

    return (data || []).map((row) => ({
      id: row.id,
      meetingId: row.meeting_id,
      fileName: row.file_name,
      fileSize: row.file_size,
      fileType: row.file_type,
      storagePath: row.storage_path,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get a temporary signed download URL for a file
   */
  static async getDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('meeting-files')
      .createSignedUrl(storagePath, 60 * 60); // 1 hour valid

    if (error || !data) {
      console.error('Get signed url error:', error);
      throw new Error('Gagal mendapatkan link download');
    }

    return data.signedUrl;
  }

  /**
   * Delete a file from storage and database
   */
  static async deleteFile(fileId: string, storagePath: string): Promise<void> {
    // 1. Delete from database
    const { error: dbError } = await supabase
      .from('meeting_files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw new Error(dbError.message);

    // 2. Delete from storage
    const { error: storageError } = await supabase.storage
      .from('meeting-files')
      .remove([storagePath]);

    if (storageError) {
      console.error('Storage remove error (ignoring):', storageError);
    }
  }
}
