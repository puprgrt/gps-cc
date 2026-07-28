import { WhatsAppConnectionStatus } from '../domain/whatsapp';

export class BaileysService {
  private static version = '@whiskeysockets/baileys v7.0.0-rc13';

  /**
   * Retrieve real Baileys socket connection state from backend API.
   * Returns actual QR code from WhatsApp Meta servers (via Baileys backend).
   */
  public static async getConnectionStatus(): Promise<WhatsAppConnectionStatus> {
    try {
      const res = await fetch('/api/whatsapp/baileys', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return {
          status: data.status || 'disconnected',
          phoneNumber: data.userInfo?.phone ? `+${data.userInfo.phone}` : undefined,
          userJid: data.userInfo?.id,
          pushName: data.userInfo?.name,
          qrCodeRaw: data.qrCodeRaw || undefined,
          pairingCode: data.pairingCode || undefined,
          activeSince: data.userInfo?.connectedAt,
          lastSync: new Date(),
          baileysVersion: data.baileysVersion || this.version,
          sessionPath: './baileys_auth_garut',
          pingMs: data.pingMs || undefined,
        };
      }
    } catch {
      // Backend unreachable
    }

    return {
      status: 'disconnected',
      baileysVersion: this.version,
      sessionPath: './baileys_auth_garut',
      lastSync: new Date(),
    };
  }

  /**
   * Triggers Baileys WASocket connection flow (QR or Phone Pairing Code).
   * The backend will initialize the WhatsApp socket and generate a REAL QR code
   * from Meta's servers, which will be available via getConnectionStatus() polling.
   */
  public static async startBaileysHandshake(type: 'qr' | 'pairing' = 'qr', phoneNumber?: string): Promise<{
    status: WhatsAppConnectionStatus;
    qrRaw?: string;
    pairingCode?: string;
  }> {
    try {
      const res = await fetch('/api/whatsapp/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', mode: type, phoneNumber }),
      });
      if (res.ok) {
        const data = await res.json();
        // After POST /connect, the backend starts the Baileys socket.
        // The real QR code will arrive asynchronously via connection.update event.
        // We need to poll getConnectionStatus() to get it.
        return {
          status: {
            status: data.status || 'connecting',
            qrCodeRaw: data.qrCodeRaw || undefined,
            pairingCode: data.pairingCode || undefined,
            baileysVersion: this.version,
            sessionPath: './baileys_auth_garut',
            lastSync: new Date(),
          },
          qrRaw: data.qrCodeRaw,
          pairingCode: data.pairingCode,
        };
      }
    } catch {
      // Backend unreachable
    }

    // Backend unavailable — return connecting state without fake QR
    return {
      status: {
        status: 'connecting',
        baileysVersion: this.version,
        sessionPath: './baileys_auth_garut',
        lastSync: new Date(),
      },
    };
  }

  /**
   * Requests a fresh QR code by triggering reconnect on the Baileys backend.
   * Returns the new connection status (QR will be available after polling).
   */
  public static async requestFreshQr(): Promise<WhatsAppConnectionStatus> {
    try {
      const res = await fetch('/api/whatsapp/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconnect' }),
      });
      if (res.ok) {
        // Wait briefly for new QR to generate, then poll status
        await new Promise(resolve => setTimeout(resolve, 1500));
        return this.getConnectionStatus();
      }
    } catch {
      // Backend unreachable
    }

    return {
      status: 'disconnected',
      baileysVersion: this.version,
      sessionPath: './baileys_auth_garut',
      lastSync: new Date(),
    };
  }

  /**
   * Confirms authentication by checking the current connection status.
   * With real Baileys, authentication happens automatically when the user
   * scans the QR code with their phone — no simulation needed.
   */
  public static async confirmAuthentication(): Promise<WhatsAppConnectionStatus> {
    return this.getConnectionStatus();
  }

  /**
   * Triggers manual reconnection on the Baileys socket
   */
  public static async triggerReconnect(): Promise<boolean> {
    try {
      const res = await fetch('/api/whatsapp/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconnect' }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Disconnects active Baileys socket session
   */
  public static async disconnectBaileys(): Promise<WhatsAppConnectionStatus> {
    try {
      await fetch('/api/whatsapp/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
    } catch {
      // Fallback
    }

    return {
      status: 'disconnected',
      baileysVersion: this.version,
      sessionPath: './baileys_auth_garut',
      lastSync: new Date(),
    };
  }
}
