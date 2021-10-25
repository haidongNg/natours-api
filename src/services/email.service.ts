import {/* inject, */ BindingScope, injectable} from '@loopback/core';
import {createTransport, SentMessageInfo} from 'nodemailer';
import {EmailTemplate, Member} from '../models';

@injectable({scope: BindingScope.TRANSIENT})
export class EmailService {
  constructor(/* Add @inject to inject parameters */) {}

  // Create a transporter
  private static async setupTransporter() {
    const portMail = Number(process.env.SMTP_PORT);

    return createTransport({
      host: process.env.SMTP_SERVER,
      port: portMail,
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendResetPasswordMail(user: Member): Promise<SentMessageInfo> {
    const transporter = await EmailService.setupTransporter();

    // Create template
    const emailTemplate = new EmailTemplate({
      to: user.email,
      subject: '[Natour] Reset Password Request',
      html: `
      <div>
        <p>Hello, ${user.name}</p>
        <p style="color: red;">We received a request to reset the password for your account with email address: ${user.email}</p>
        <p>To reset your password click on the link provided below</p>
        <a href="${process.env.APPLICATION_URL}/reset-password-finish.html?resetKey=${user.resetKey}">Reset your password link</a>
        <p>If you didn’t request to reset your password, please ignore this email or reset your password to protect your account.</p>
        <p>Thanks</p>
        <p>LoopBack'ers at Natour</p>
      </div>
      `,
    });
    // Actaully send the mail
    return transporter.sendMail(emailTemplate);
  }
}
