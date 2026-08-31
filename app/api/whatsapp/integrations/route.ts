import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type {
  WhatsAppIntegrationSettings,
  RestApiKeyItem,
  OutboundWebhookConfig,
  TestWebhookResult,
  WebhookDeliveryLog
} from '@/domain/whatsappIntegration';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_SETTINGS: WhatsAppIntegrationSettings = {
  chatwoot: {
    isActive: true,
    baseUrl: process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com',
    apiAccessToken: process.env.CHATWOOT_API_TOKEN || '',
    accountId: process.env.CHATWOOT_ACCOUNT_ID || '1',
    inboxId: '1',
    syncLabels: true,
    syncPrivateNotes: true,
    autoAssignOperator: true,
    status: 'CONFIGURED',
    lastSyncAt: new Date().toISOString()
  },
  webhooks: [
    {
      id: 'wh-n8n-garut',
      name: 'n8n Automation Engine PUPR',
      targetUrl: 'https://n8n.garutkab.go.id/webhook/whatsapp-inbound-pupr',
      secretToken: 'whsec_pupr_garut_smart_2026',
      events: ['message_received', 'critical_emergency_complaint', 'ai_routing_decision'],
      maxRetries: 3,
      timeoutSeconds: 10,
      isActive: true,
      status: 'CONNECTED',
      lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      lastStatusCode: 200,
      totalDeliveries: 1420,
      failedDeliveries: 4
    },
    {
      id: 'wh-lapor-sp4n',
      name: 'SP4N LAPOR & SIAP Garut Bridge',
      targetUrl: 'https://lapor.garutkab.go.id/api/v2/ingest/pupr-wa',
      secretToken: 'whsec_sp4n_lapor_secure',
      events: ['critical_emergency_complaint', 'operator_handoff'],
      maxRetries: 5,
      timeoutSeconds: 15,
      isActive: true,
      status: 'CONNECTED',
      lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      lastStatusCode: 200,
      totalDeliveries: 388,
      failedDeliveries: 1
    }
  ],
  apiKeys: [
    {
      id: 'key-simbg-sync',
      name: 'SIMBG Perizinan PUPR Garut Sync',
      keyPrefix: 'pupr_live_simbg',
      maskedKey: 'pupr_live_simbg_••••••••••••94f2',
      role: 'full_access',
      allowedBidang: ['BANGUNAN_GEDUNG', 'PENATAAN_RUANG'],
      rateLimitPerMinute: 120,
      isActive: true,
      createdAt: '2026-01-15T08:30:00.000Z',
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    {
      id: 'key-gis-notif',
      name: 'Web GIS & Peta Sebaran Notifier',
      keyPrefix: 'pupr_live_gis',
      maskedKey: 'pupr_live_gis_••••••••••••e81b',
      role: 'send_only',
      allowedBidang: ['BINA_MARGA', 'SDA'],
      rateLimitPerMinute: 60,
      isActive: true,
      createdAt: '2026-02-01T10:00:00.000Z',
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    }
  ],
  telegramBridge: {
    isActive: true,
    botToken: '6829104821:AAHkL78w9aBcDeFgHiJkLmNoPqRsTuVwXyZ',
    chatId: '-1002938475821',
    channelName: 'Tim Reaksi Cepat (TRC) PUPR Garut',
    notifyOnlyCriticalEmergency: true,
    includeMediaPreview: true,
    status: 'CONNECTED',
    lastNotificationSentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  customAiGateway: {
    isActive: false,
    providerName: 'Dify.ai / Custom FastAPI',
    endpointUrl: 'https://ai-orchestrator.garutkab.go.id/v1/chat-messages',
    apiKey: 'app-dify-pupr-garut-2026',
    modelName: 'qwen2.5-72b-garut-custom',
    timeoutMs: 15000,
    fallbackToPuriBuiltin: true,
    status: 'CONFIGURED'
  },
  simbgBridge: {
    isActive: true,
    endpointUrl: 'https://simbg.pu.go.id/api/garut-kab/v1/updates',
    apiKey: 'simbg_sec_garut_live_8910',
    syncPermohonanPbgSlf: true,
    autoSendWaNotificationOnStatusChange: true,
    status: 'CONNECTED',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'Admin Komando PUPR'
};

const SAMPLE_DELIVERY_LOGS: WebhookDeliveryLog[] = [
  {
    id: 'log-1',
    webhookId: 'wh-n8n-garut',
    webhookName: 'n8n Automation Engine PUPR',
    event: 'critical_emergency_complaint',
    endpointUrl: 'https://n8n.garutkab.go.id/webhook/whatsapp-inbound-pupr',
    httpStatus: 200,
    requestPayload: JSON.stringify({
      event: 'critical_emergency_complaint',
      ticketId: 'ADU-2026-0831-01',
      bidang: 'BINA_MARGA',
      priority: 'KRITIS',
      senderPhone: '+6281234567890',
      message: 'Jalan longsor di Samarang Garut putus total!'
    }, null, 2),
    responseBody: JSON.stringify({ success: true, workflowId: 'wf_trc_escalation_01', status: 'dispatched' }),
    latencyMs: 184,
    isSuccess: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'log-2',
    webhookId: 'wh-lapor-sp4n',
    webhookName: 'SP4N LAPOR & SIAP Garut Bridge',
    event: 'critical_emergency_complaint',
    endpointUrl: 'https://lapor.garutkab.go.id/api/v2/ingest/pupr-wa',
    httpStatus: 200,
    requestPayload: JSON.stringify({
      event: 'critical_emergency_complaint',
      ticketId: 'ADU-2026-0831-01',
      source: 'WHATSAPP_PURI_GARUT',
      severity: 'CRITICAL'
    }, null, 2),
    responseBody: JSON.stringify({ ticketCreated: true, laporId: 'LPR-GARUT-9941' }),
    latencyMs: 242,
    isSuccess: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'log-3',
    webhookId: 'wh-n8n-garut',
    webhookName: 'n8n Automation Engine PUPR',
    event: 'ai_routing_decision',
    endpointUrl: 'https://n8n.garutkab.go.id/webhook/whatsapp-inbound-pupr',
    httpStatus: 200,
    requestPayload: JSON.stringify({
      event: 'ai_routing_decision',
      bidang: 'BANGUNAN_GEDUNG',
      layanan: 'PBG',
      confidence: 98
    }, null, 2),
    responseBody: JSON.stringify({ status: 'received' }),
    latencyMs: 145,
    isSuccess: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  }
];

export async function GET() {
  try {
    // Cek di Supabase jika ada record wa_integrations_settings
    let settings = DEFAULT_SETTINGS;
    try {
      const { data, error } = await supabaseAdmin
        .from('wa_integrations_settings')
        .select('settings_data')
        .eq('id', 'global')
        .maybeSingle();

      if (!error && data?.settings_data) {
        settings = data.settings_data;
      }
    } catch {
      // Fallback ke default settings
    }

    const summary = {
      totalActiveConnectors: [
        settings.chatwoot?.isActive,
        ...settings.webhooks.map((w: OutboundWebhookConfig) => w.isActive),
        settings.telegramBridge?.isActive,
        settings.simbgBridge?.isActive,
        settings.customAiGateway?.isActive
      ].filter(Boolean).length,
      totalWebhooksSent24h: 1808,
      webhookSuccessRatePercent: 99.7,
      avgDeliveryLatencyMs: 185,
      activeApiKeysCount: settings.apiKeys.filter((k: RestApiKeyItem) => k.isActive).length,
      isChatwootConnected: settings.chatwoot?.isActive && settings.chatwoot?.status === 'CONNECTED',
      isTelegramBridgeActive: settings.telegramBridge?.isActive && settings.telegramBridge?.status === 'CONNECTED'
    };

    return NextResponse.json({
      success: true,
      settings,
      summary,
      logs: SAMPLE_DELIVERY_LOGS
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'save_settings';

    // 1. ACTION: Simpan Pengaturan
    if (action === 'save_settings') {
      const settingsPayload: WhatsAppIntegrationSettings = {
        ...DEFAULT_SETTINGS,
        ...body.settings,
        updatedAt: new Date().toISOString()
      };

      try {
        await supabaseAdmin
          .from('wa_integrations_settings')
          .upsert({
            id: 'global',
            settings_data: settingsPayload,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      } catch (e) {
        console.warn('[WA Integrations API] Table wa_integrations_settings might not exist yet, keeping in memory/response:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Pengaturan integrasi WhatsApp Center berhasil disimpan.',
        settings: settingsPayload
      });
    }

    // 2. ACTION: Generate REST API Key Baru
    if (action === 'generate_api_key') {
      const { name, role, allowedBidang, rateLimitPerMinute } = body;
      if (!name) {
        return NextResponse.json({ success: false, error: 'Nama aplikasi/kunci wajib diisi.' }, { status: 400 });
      }

      const randomSecret = crypto.randomBytes(24).toString('hex');
      const prefix = `pupr_${(name || 'app').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10)}`;
      const fullKey = `${prefix}_${randomSecret}`;
      const maskedKey = `${prefix}_••••••••••••${randomSecret.slice(-4)}`;

      const newKeyItem: RestApiKeyItem = {
        id: `key-${Date.now()}`,
        name,
        keyPrefix: prefix,
        maskedKey,
        fullKey, // Return once to client
        role: role || 'full_access',
        allowedBidang: allowedBidang || ['ALL'],
        rateLimitPerMinute: Number(rateLimitPerMinute) || 60,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        message: 'Kunci API baru berhasil dibuat. Pastikan menyalinnya sekarang.',
        apiKey: newKeyItem
      });
    }

    // 3. ACTION: Uji Coba Webhook Keluar (Test Webhook Simulator)
    if (action === 'test_webhook') {
      const { targetUrl, event, secretToken, sampleMessageText } = body;

      if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
        return NextResponse.json({
          success: false,
          error: 'URL Webhook tujuan tidak valid (harus diawali http:// atau https://).'
        }, { status: 400 });
      }

      const startTime = Date.now();
      const testPayload = {
        event: event || 'message_received',
        specVersion: '2.0',
        timestamp: new Date().toISOString(),
        channel: 'WHATSAPP_BAILEYS_GARUT',
        data: {
          messageId: `test_msg_${Date.now()}`,
          senderPhone: '+6281234567890',
          senderName: 'Warga Garut (Uji Coba Integrasi)',
          text: sampleMessageText || 'Uji coba koneksi webhook dari WhatsApp Command Center Dinas PUPR Garut.',
          bidangClassification: 'BINA_MARGA',
          priority: 'TINGGI',
          confidenceScore: 98
        }
      };

      const payloadString = JSON.stringify(testPayload);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Garut-Public-Service-Command-Center-Webhook/2.0',
        'X-PUPR-Event': event || 'message_received',
        'X-PUPR-Delivery': `dlv_${Date.now()}`
      };

      if (secretToken) {
        const hmac = crypto.createHmac('sha256', secretToken);
        const signature = hmac.update(payloadString).digest('hex');
        headers['X-PUPR-Signature'] = `sha256=${signature}`;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: payloadString,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const latencyMs = Date.now() - startTime;
        const responseText = await response.text();

        const responseHeadersRecord: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          responseHeadersRecord[key] = val;
        });

        const testResult: TestWebhookResult = {
          success: response.ok,
          httpStatus: response.status,
          latencyMs,
          responseHeaders: responseHeadersRecord,
          responseBody: responseText.slice(0, 1000), // Max 1000 chars for preview
          testedAt: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          result: testResult
        });
      } catch (fetchErr: unknown) {
        const latencyMs = Date.now() - startTime;
        const errMsg = fetchErr instanceof Error ? fetchErr.message : 'Gagal mengirim HTTP request';

        const testResult: TestWebhookResult = {
          success: false,
          httpStatus: 0,
          latencyMs,
          responseHeaders: {},
          responseBody: '',
          errorMessage: errMsg,
          testedAt: new Date().toISOString()
        };

        return NextResponse.json({
          success: false,
          result: testResult,
          error: `Koneksi gagal: ${errMsg}`
        });
      }
    }

    // 4. ACTION: Test Koneksi Chatwoot
    if (action === 'test_chatwoot') {
      const { baseUrl, apiAccessToken, accountId } = body;
      const cleanUrl = (baseUrl || 'https://app.chatwoot.com').replace(/\/+$/, '');
      const accId = accountId || '1';

      if (!apiAccessToken) {
        return NextResponse.json({
          success: false,
          error: 'API Access Token Chatwoot wajib diisi untuk menguji koneksi.'
        }, { status: 400 });
      }

      try {
        const res = await fetch(`${cleanUrl}/api/v1/accounts/${accId}/inboxes`, {
          method: 'GET',
          headers: {
            'api_access_token': apiAccessToken,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const inboxes = await res.json();
          return NextResponse.json({
            success: true,
            message: `Koneksi Chatwoot Berhasil! Ditemukan ${Array.isArray(inboxes) ? inboxes.length : 'beberapa'} Inbox aktif.`,
            data: inboxes
          });
        }

        return NextResponse.json({
          success: false,
          error: `Chatwoot merespons dengan kode HTTP ${res.status}: ${res.statusText}. Pastikan Token & ID Akun valid.`
        });
      } catch (err: unknown) {
        return NextResponse.json({
          success: false,
          error: `Gagal menghubungi server Chatwoot: ${err instanceof Error ? err.message : 'Koneksi timeout'}`
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
