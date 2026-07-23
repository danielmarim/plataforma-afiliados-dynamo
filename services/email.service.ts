import "server-only";

import { EMAIL_FROM, resend } from "@/lib/resend";

/**
 * Serviço de envio de e-mails transacionais via Resend.
 * Templates e gatilhos serão implementados na etapa de regras de negócio.
 */
export const emailService = {
  async send(options: {
    to: string | string[];
    subject: string;
    html: string;
  }) {
    return resend.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  },
};
