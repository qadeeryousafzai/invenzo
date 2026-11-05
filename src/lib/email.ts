export async function sendTransactionalEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Email delivery failed with status ${response.status}.`);
}

export function safeEmailHtml(title: string, link: string, action: string, expiration = "30 minutes") {
  const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  const safeLink = escapeHtml(link);
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;color:#17211b"><h1>${escapeHtml(title)}</h1><p>Use the secure link below. It expires in ${escapeHtml(expiration)}.</p><p><a href="${safeLink}" style="display:inline-block;background:#175b45;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">${escapeHtml(action)}</a></p><p>If you did not request this, you can ignore this email.</p></div>`;
}
