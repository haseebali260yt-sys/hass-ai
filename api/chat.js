module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { messages = [], student = false } = req.body || {};
  const system = student
    ? "You are hass.ai, a friendly tutor for students. Explain simply, step by step, with examples. Reply in the user's language (Urdu/Hinglish/English)."
    : "You are hass.ai, a helpful, friendly AI assistant. Reply in the user's language (Urdu/Hinglish/English).";
  const contents = messages.slice(-12).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: String(m.text).slice(0, 2000) }]
  }));
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY || "" },
      body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents })
    });
    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || ("Error: " + (data?.error?.message || JSON.stringify(data).slice(0, 300)));
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ reply: "Server error: " + e.message });
  }
};
