import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly from?: string;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('GMAIL_USER');
    const pass = this.config.get<string>('GMAIL_APP_PASSWORD');
    this.from = user;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }

  async sendResetCode(to: string, code: string) {
    // Sin credenciales configuradas -> modo dev: se imprime el codigo en consola
    if (!this.transporter) {
      this.logger.warn(
        `[DEV] Codigo de recuperacion para ${to}: ${code}  (configura GMAIL_USER y GMAIL_APP_PASSWORD en backend/.env para enviar email real)`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: `Control Vehicular <${this.from}>`,
      to,
      subject: 'Codigo de recuperacion de contrasena',
      text: `Tu codigo de recuperacion es: ${code}\nVence en 10 minutos.`,
      html: `
        <div style="font-family:sans-serif;max-width:420px">
          <h2>Recuperacion de contrasena</h2>
          <p>Tu codigo de verificacion es:</p>
          <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
          <p style="color:#666">Vence en 10 minutos. Si no lo solicitaste, ignora este correo.</p>
        </div>`,
    });
    this.logger.log(`Codigo de recuperacion enviado a ${to}`);
  }
}
