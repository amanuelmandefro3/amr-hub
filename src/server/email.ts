import { Resend } from "resend";
import { loadServerEnvironment } from "./env";

let client: Resend | null = null;

function getClient() {
  if (!client) {
    client = new Resend(loadServerEnvironment().RESEND_API_KEY);
  }
  return client;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const { error } = await getClient().emails.send({
    from: loadServerEnvironment().EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
