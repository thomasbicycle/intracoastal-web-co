/**
 * Cloudflare Pages Function — Contact form handler
 * Route: /api/contact  (this file lives at /functions/api/contact.js)
 *
 * It receives the contact form submission, validates it, and emails it to you
 * using Resend (https://resend.com). Set these environment variables in your
 * Cloudflare Pages project (Settings → Environment variables):
 *
 *   RESEND_API_KEY   (secret)  – your Resend API key, e.g. re_xxxxxxxx
 *   CONTACT_TO                  – where you want inquiries delivered, e.g. contact@intracoastalwebco.com
 *   CONTACT_FROM                – a verified Resend sender, e.g. Intracoastal Web Co. <contact@intracoastalwebco.com>
 *
 * Until your own domain is verified in Resend, you can temporarily set
 * CONTACT_FROM to  onboarding@resend.dev  for testing (it only delivers to the
 * email on your Resend account).
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Accept JSON (from the site's fetch) or a normal form POST as a fallback.
    const contentType = request.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }

    // Honeypot: real people never see or fill this field. If it's filled, it's a bot.
    // Pretend success so the bot doesn't retry, but send nothing.
    if (data.company_website) {
      return json({ ok: true });
    }

    const name = (data.name || "").toString().trim();
    const email = (data.email || "").toString().trim();
    const message = (data.message || "").toString().trim();
    const business = (data.business || "").toString().trim();
    const phone = (data.phone || "").toString().trim();
    const projectType = (data.project_type || "").toString().trim();

    if (!name || !email || !message) {
      return json({ ok: false, error: "Please add your name, email, and a short message." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: "That email address doesn't look right — mind checking it?" }, 400);
    }
    if (message.length > 5000) {
      return json({ ok: false, error: "That message is a little long — please trim it down a bit." }, 400);
    }

    // Make sure the server is actually configured before we try to send.
    if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
      return json(
        { ok: false, error: "The contact form isn't fully set up yet. Please email us directly at contact@intracoastalwebco.com." },
        500
      );
    }

    const lines = [
      `Name:     ${name}`,
      `Email:    ${email}`,
      business ? `Business: ${business}` : null,
      phone ? `Phone:    ${phone}` : null,
      projectType ? `Need:     ${projectType}` : null,
      "",
      "Message:",
      message,
    ].filter((v) => v !== null).join("\n");

    const subject = `New inquiry — ${name}${business ? " (" + business + ")" : ""}`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: email,
        subject,
        text: lines,
      }),
    });

    if (!resendRes.ok) {
      // Log detail server-side for debugging, but keep the visitor message friendly.
      console.error("Resend error:", resendRes.status, await resendRes.text());
      return json(
        { ok: false, error: "Something went wrong sending your message. Please email us directly at contact@intracoastalwebco.com." },
        502
      );
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Contact function error:", err);
    return json({ ok: false, error: "Unexpected error. Please try again, or email us directly." }, 500);
  }
}

// Anything other than POST gets a clear, harmless response.
export async function onRequest(context) {
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }
  return json({ ok: false, error: "Method not allowed." }, 405);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
