import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(to: string, resetUrl: string) {
    const host = this.config.getOrThrow<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? '587');
    const secure = this.config.get<string>('SMTP_SECURE') === 'true';
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    const from = this.config.getOrThrow<string>('SMTP_FROM');

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SMTP_PORT deve ser uma porta válida');
    }
    if (!host.trim()) {
      throw new Error('SMTP_HOST não pode ficar vazio');
    }
    if (Boolean(user) !== Boolean(pass)) {
      throw new Error('SMTP_USER e SMTP_PASSWORD devem ser configurados juntos');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });

    await transporter.sendMail({
      from,
      to,
      subject: 'Redefinição de senha - HAWK',
      text: `Recebemos uma solicitação para redefinir sua senha. Use este link em até 30 minutos: ${resetUrl}\n\nSe você não solicitou a redefinição, ignore este e-mail.`,
      html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${resetUrl}">Criar uma nova senha</a></p><p>Este link expira em 30 minutos. Se você não solicitou a redefinição, ignore este e-mail.</p>`,
    });
  }
}
