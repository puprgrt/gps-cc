import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

export interface ApiSecurityOptions {
  /** Membutuhkan signature valid (HMAC SHA256) jika true. Default: false */
  requireSignature?: boolean;
  /** Batas ukuran payload dalam Bytes. Default: 5MB */
  payloadLimitBytes?: number;
  /** Maksimal request per menit per IP. Default: 60 */
  rateLimitMaxRequests?: number;
  /** Ekstensi file yang diizinkan untuk attachment URL. Default: gambar, pdf, dokumen biasa */
  allowedExtensions?: string[];
}

const DEFAULT_OPTIONS: ApiSecurityOptions = {
  requireSignature: false, // Default false agar tidak break current integration, ubah ke true jika secret siap
  payloadLimitBytes: 5 * 1024 * 1024, // 5 MB
  rateLimitMaxRequests: 60,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'],
};

/**
 * Validasi request API untuk keamanan (Rate Limit, Payload Size, Signature, File Validation).
 * Mengembalikan objek `errorResponse` jika terjadi pelanggaran, atau `payload` (JSON) jika lolos.
 */
export async function validateApiRequest(
  req: NextRequest,
  options: ApiSecurityOptions = {}
): Promise<{ errorResponse?: NextResponse; payload?: any; rawText?: string }> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // 1. Rate Limiting
  const ip = req.headers.get('x-forwarded-for') || (req as any).ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  if (mergedOptions.rateLimitMaxRequests && mergedOptions.rateLimitMaxRequests > 0) {
    let rateInfo = rateLimitMap.get(ip);
    if (!rateInfo || now > rateInfo.resetTime) {
      rateInfo = { count: 1, resetTime: now + windowMs };
    } else {
      rateInfo.count++;
    }
    rateLimitMap.set(ip, rateInfo);

    if (rateInfo.count > mergedOptions.rateLimitMaxRequests) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: 'Too Many Requests' },
          { status: 429 }
        ),
      };
    }
  }

  // 2. Payload Limit Check (Header)
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (mergedOptions.payloadLimitBytes && contentLength > mergedOptions.payloadLimitBytes) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Payload Too Large (Content-Length exceeds limit)' },
        { status: 413 }
      ),
    };
  }

  // Read Body (Clone request to prevent consuming the stream if needed, though we will parse it here)
  let rawText = '';
  try {
    rawText = await req.text();
  } catch (error) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Failed to read request body' },
        { status: 400 }
      ),
    };
  }

  // 3. Payload Limit Check (Actual Size)
  const payloadSize = new TextEncoder().encode(rawText).length;
  if (mergedOptions.payloadLimitBytes && payloadSize > mergedOptions.payloadLimitBytes) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Payload Too Large' },
        { status: 413 }
      ),
    };
  }

  // 4. Signature Validation
  if (mergedOptions.requireSignature) {
    const signature = req.headers.get('x-hub-signature') || req.headers.get('x-webhook-signature');
    const secret = process.env.WEBHOOK_SECRET;

    if (!secret) {
      console.warn('WEBHOOK_SECRET tidak dikonfigurasi di environment variables.');
    }

    if (!signature) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: 'Missing webhook signature' },
          { status: 401 }
        ),
      };
    }

    if (secret) {
      // Misal signature berupa "sha256=123456" atau langsung hash
      let signatureValue = signature;
      if (signature.startsWith('sha256=')) {
        signatureValue = signature.slice(7);
      }

      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(rawText).digest('hex');
      
      try {
        const sigBuffer = Buffer.from(signatureValue, 'hex');
        const digestBuffer = Buffer.from(digest, 'hex');
        
        if (sigBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(sigBuffer, digestBuffer)) {
          throw new Error('Signature mismatch');
        }
      } catch (err) {
        return {
          errorResponse: NextResponse.json(
            { success: false, error: 'Invalid webhook signature' },
            { status: 401 }
          ),
        };
      }
    }
  }

  // Parse JSON
  let payload: any = null;
  if (rawText.trim().length > 0) {
    try {
      payload = JSON.parse(rawText);
    } catch (e) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: 'Invalid JSON payload' },
          { status: 400 }
        ),
      };
    }
  }

  // 5. File Extension Validation (Jika ada field attachmentUrl)
  if (payload && payload.attachmentUrl && typeof payload.attachmentUrl === 'string') {
    const url = payload.attachmentUrl.toLowerCase();
    // Ekstrak path tanpa query params
    const pathname = url.split('?')[0];
    
    // Cek apakah ada ekstensi file (jika ada)
    const hasExtension = pathname.lastIndexOf('.') > pathname.lastIndexOf('/');
    if (hasExtension) {
      const ext = pathname.substring(pathname.lastIndexOf('.'));
      if (
        mergedOptions.allowedExtensions && 
        !mergedOptions.allowedExtensions.includes(ext)
      ) {
        return {
          errorResponse: NextResponse.json(
            { success: false, error: `Tipe file tidak diizinkan: ${ext}` },
            { status: 400 }
          ),
        };
      }
    }
  }

  return { payload, rawText };
}
