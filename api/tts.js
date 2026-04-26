/**
 * Proxy ל-TTS: הבקשה ל-Google TTS יוצאת מהשרת, לא מהדפדפן – אין CORS / Referer
 * של מחשב המשתמש, והנגן מקבל אודיו באותו מקור (Vercel).
 * הערה: שימוש ב־translate_tts היא ללא API רשמי; לייצור — שקלו Google Cloud TTS.
 */
const MAX_CHARS = 200;

module.exports = async function handler(req, res) {
  if (req.method === "HEAD") {
    return res.status(200).end();
  }
  if (req.method !== "GET") {
    return res
      .status(405)
      .setHeader("Allow", "GET, HEAD")
      .json({ error: "method not allowed" });
  }

  var rawQ = req.query && req.query.q;
  if (Array.isArray(rawQ)) {
    rawQ = rawQ[0];
  }
  var q = rawQ == null ? "" : String(rawQ);
  var tl = "el";
  if (req.query && req.query.tl) {
    var rawTl = req.query.tl;
    if (Array.isArray(rawTl)) {
      rawTl = rawTl[0];
    }
    if (rawTl && String(rawTl).length <= 12) {
      tl = String(rawTl);
    }
  }

  if (!q.trim() || q.length > MAX_CHARS) {
    return res.status(400).json({ error: "invalid or too long q" });
  }

  var ttsUrl =
    "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" +
    encodeURIComponent(tl) +
    "&q=" +
    encodeURIComponent(q);

  try {
    var upstream = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "audio/mpeg, audio/*, */*",
        Referer: "https://translate.google.com/",
      },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return res.status(502).json({
        error: "upstream",
        status: upstream.status,
      });
    }

    var ct = (upstream.headers.get("content-type") || "").toLowerCase();
    if (ct.indexOf("text/html") !== -1 || ct.indexOf("application/json") !== -1) {
      return res.status(502).json({ error: "upstream returned non-audio" });
    }

    var buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length < 80) {
      return res.status(502).json({ error: "empty or invalid audio" });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=604800"
    );
    return res.status(200).send(buf);
  } catch (e) {
    return res
      .status(500)
      .json({ error: e && e.message ? e.message : "fetch failed" });
  }
};
