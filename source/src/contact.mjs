// Best-effort per-process/isolate throttle. Use host edge rate limits for distributed traffic.
const attempts = new Map();
async function allowAttempt(request) {
  const address =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-runtime-client-ip") ||
    "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(address),
  );
  const key = Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const item = attempts.get(key) || { count: 0, until: now + 600000 };
  if (attempts.size >= 5000 && !attempts.has(key)) return false;
  item.count++;
  attempts.set(key, item);
  return item.count <= 5;
}
export const contactReady = (env) => {
  try {
    return (
      [
        "RESEND_API_KEY",
        "CONTACT_TO_EMAIL",
        "CONTACT_FROM_EMAIL",
        "TURNSTILE_SECRET_KEY",
        "PUBLIC_TURNSTILE_SITE_KEY",
      ].every((k) => typeof env[k] === "string" && env[k].trim()) &&
      new URL(env.PUBLIC_SITE_URL).protocol === "https:"
    );
  } catch {
    return false;
  }
};
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
export async function contact(request, env, fetcher = fetch) {
  if (!contactReady(env)) return json({ error: "Enquiry delivery is not configured yet. Please use the published contact details when available." }, 503);
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  let origin;
  try {
    origin = new URL(env.PUBLIC_SITE_URL).origin;
  } catch {
    return json({ error: "Contact configuration is incomplete." }, 503);
  }
  if (request.headers.get("origin") !== origin) return json({ error: "This request is not permitted." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Use JSON." }, 415);
  if (Number(request.headers.get("content-length") || 0) > 16384) return json({ error: "Message is too large." }, 413);
  let b;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw Error();
    let n = 0;
    let chunks = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      n += value.byteLength;
      if (n > 16384) {
        await reader.cancel();
        return json({ error: "Message is too large." }, 413);
      }
      chunks.push(value);
    }
    const all = new Uint8Array(n);
    let i = 0;
    for (const c of chunks) {
      all.set(c, i);
      i += c.length;
    }
    b = JSON.parse(new TextDecoder().decode(all));
  } catch {
    return json({ error: "Invalid message." }, 400);
  }
  if (!b || typeof b !== "object")
    return json({ error: "Invalid message." }, 400);
  if (b.website) return json({ error: "Message rejected." }, 400);
  if (
    typeof b.name !== "string" ||
    b.name.trim().length < 2 ||
    b.name.length > 120 ||
    typeof b.email !== "string" ||
    b.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) ||
    /[\r\n]/.test(b.email) ||
    typeof b.message !== "string" ||
    b.message.trim().length < 20 ||
    b.message.length > 5000
  )
    return json(
      {
        error:
          "Enter a name, a valid email and a message of 20–5,000 characters.",
      },
      400,
    );
  if (!(await allowAttempt(request)))
    return json(
      {
        error:
          "Too many enquiries. Please wait ten minutes before trying again.",
      },
      429,
    );
  if (typeof b.token !== "string" || b.token.length > 2048)
    return json({ error: "Please complete spam protection." }, 400);
  try {
    const verified = await fetcher(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: b.token,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const check = await verified.json();
    if (
      !check.success ||
      check.hostname !== new URL(origin).hostname ||
      check.action !== "contact"
    )
      return json(
        { error: "Spam verification failed or expired. Please try again." },
        400,
      );
    const delivered = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: b.email.trim(),
        subject: "Business Playbook Series: website enquiry",
        text: `Name: ${b.name.trim()}\nEmail: ${b.email.trim()}\n\n${b.message.trim()}`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!delivered.ok)
      return json(
        {
          error:
            "The mail service could not accept your message. Please try later or use the published contact details.",
        },
        502,
      );
    const receipt = await delivered.json();
    if (!receipt.id)
      return json(
        { error: "Delivery could not be confirmed. Please try later." },
        502,
      );
    return json({
      message: "Your enquiry has been accepted by the mail service. Thank you.",
    });
  } catch {
    return json(
      {
        error:
          "The delivery service is temporarily unavailable. Please try later.",
      },
      502,
    );
  }
}
