import { Resend } from "resend";

export type SendEmailParams = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

let cachedClient: Resend | null = null;

function getClient(): Resend {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquant. Ajoutez-le à votre .env");
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM || "DroneSpot <no-reply@drone-spot.app>";
  if (!from) throw new Error("EMAIL_FROM manquant. Ajoutez-le à votre .env");

  const client = getClient();
  const result = await client.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  if ((result as any)?.error) {
    const err = (result as any).error;
    throw new Error(typeof err === "string" ? err : JSON.stringify(err));
  }
}


