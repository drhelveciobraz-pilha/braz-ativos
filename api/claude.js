// ============================================================
//  api/claude.js  —  Proxy serverless (Vercel) para a Anthropic
// ============================================================
//  Por quê: o backend (note) tem rota internacional instável e paga por
//  respostas que se perdem na rede. Aqui a chamada internacional acontece
//  no datacenter da Vercel (rota estável). O note só fala com a Vercel.
//
//  Bônus: a ANTHROPIC_API_KEY vive SÓ aqui (variável de ambiente na Vercel),
//  nunca mais no note nem em foto/print/git.
//
//  Variáveis de ambiente (Vercel > Settings > Environment Variables):
//    ANTHROPIC_API_KEY  -> sua chave da Anthropic
//    PROXY_TOKEN        -> segredo compartilhado com o note (string longa)
//
//  O note manda o header  x-proxy-token  igual ao PROXY_TOKEN. Sem isso,
//  qualquer um na internet gastaria sua chave chamando esta URL pública.
// ============================================================

export const config = { maxDuration: 60 }; // Sonnet pode passar de 10s; Hobby aceita até 60

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "use POST" });

  // 1) Autenticação por token compartilhado
  const token = req.headers["x-proxy-token"];
  if (!process.env.PROXY_TOKEN || token !== process.env.PROXY_TOKEN)
    return res.status(401).json({ error: "token invalido" });

  // 2) Chave (só existe aqui, na Vercel)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: "ANTHROPIC_API_KEY ausente na Vercel" });

  // 3) Encaminha o prompt para a Anthropic
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const prompt = body.prompt;
    const maxTokens = body.max_tokens || 900;
    const model = body.model || "claude-sonnet-4-6";
    if (!prompt) return res.status(400).json({ error: "prompt ausente" });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      return res.status(r.status).json({ error: `anthropic ${r.status}`, detail });
    }

    const data = await r.json();
    const texto = (data.content || []).map((b) => b.text || "").join("");
    return res.status(200).json({ texto });
  } catch (e) {
    return res.status(502).json({ error: "falha no proxy", detail: String(e).slice(0, 200) });
  }
}
