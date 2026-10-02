module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { messages = [], student = false, image = null } = req.body || {};
  const system = (student
    ? "You are hass.ai, a friendly tutor for students. Explain simply, step by step, with examples."
    : "You are hass.ai, a helpful, friendly AI assistant.") +
    " Reply in the user's language (Urdu/Hinglish/English). If an image is given, read it carefully and help with it. Keep answers clear and not too long.";
  const contents = messages.slice(-12).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: String(m.text).slice(0, 2000) }]
  }));
  if (image && image.data && contents.length) {
    contents[contents.length - 1].parts.push({ inline_data: { mime_type: image.mime || "image/jpeg", data: image.data } });
  }
  const models = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash"];
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY || "" },
        body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents })
      });
      const data = await r.json();
      const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("");
      if (reply) return res.status(200).json({ reply });
    } catch (e) {}
  }
  res.status(200).json({ reply: "Abhi server busy hai, thori der baad dobara try karo 🙏" });
};
