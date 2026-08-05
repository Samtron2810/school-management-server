import { BrevoClient, BrevoEnvironment } from "@getbrevo/brevo";
import env from "./env.js";

let _client = null;

const getClient = () => {
  if (_client) return _client;

  if (!env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  _client = new BrevoClient({
    apiKey: env.BREVO_API_KEY,
    environment: BrevoEnvironment.Production,
  });

  return _client;
};

/**
 * Send a transactional email via Brevo REST API.
 * @param {{ to: string, toName?: string, subject: string, html: string, text?: string }} options
 */
export const sendMail = async ({ to, toName, subject, html, text }) => {
  const client = getClient();

  await client.transactionalEmails.sendTransacEmail({
    sender: {
      name: env.BREVO_SENDER_NAME || "TronSchool",
      email: env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: to, name: toName || to }],
    subject,
    htmlContent: html,
    textContent: text || html.replace(/<[^>]+>/g, ""),
  });
};

export default { sendMail };
