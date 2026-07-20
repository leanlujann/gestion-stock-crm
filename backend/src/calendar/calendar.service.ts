import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

interface EventoPedido {
  titulo: string;
  descripcion: string;
  fechaEntrega: Date;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  readonly enabled: boolean;
  private oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

  constructor() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
    this.enabled = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN);

    if (this.enabled) {
      this.oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
      this.oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    } else {
      this.logger.warn('Google Calendar no configurado (faltan GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN); se omite.');
    }
  }

  async crearEvento(evento: EventoPedido): Promise<string | null> {
    if (!this.enabled || !this.oauth2Client) return null;

    const yyyy = evento.fechaEntrega.getUTCFullYear();
    const mm = String(evento.fechaEntrega.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(evento.fechaEntrega.getUTCDate()).padStart(2, '0');
    const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Argentina/Buenos_Aires';

    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: evento.titulo,
          description: evento.descripcion,
          start: { dateTime: `${yyyy}-${mm}-${dd}T08:00:00`, timeZone },
          end: { dateTime: `${yyyy}-${mm}-${dd}T08:30:00`, timeZone },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }] },
        },
      });
      return res.data.id ?? null;
    } catch (err) {
      this.logger.error('Error creando evento en Google Calendar', err as Error);
      return null;
    }
  }

  async eliminarEvento(eventId: string | null | undefined): Promise<void> {
    if (!this.enabled || !this.oauth2Client || !eventId) return;
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      await calendar.events.delete({ calendarId: 'primary', eventId });
    } catch (err) {
      this.logger.error('Error eliminando evento en Google Calendar', err as Error);
    }
  }
}
