// ============================================================
//  api/claude.js  —  Proxy serverless (Vercel) para a Anthropic
// ============================================================
//  note -> Vercel -> Anthropic. A chave vive SÓ aqui (env var na Vercel).
//
//  Variáveis de ambiente (Vercel > Settings > Environment Variables):
//    ANTHROPIC_API_KEY  -> sua chave da Anthropic
//    PROXY_TOKEN        -> segredo compartilhado com o note
//  Ambas precisam estar marcadas em PRODUCTION e exigem REDEPLOY p/ valer.
// ============================================================

// maxDuration 60s: o Sonnet leva 15-30s para gerar ~900 tokens; com 10s a
// função é cortada no meio (FUNCTION_INVOCATION_TIMEOUT / HTTP 504).
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "use POST" });

  // Diagnóstico explícito: diz QUAL variável falta (em vez de 500 mudo)
  const temToken = !!process.env.PROXY_TOKEN;
  const temKey = !!process.env.ANTHROPIC_API_KEY;
  if (!temToken || !temKey) {
    return res.status(500).json({
      error: "variavel de ambiente ausente na Vercel",
      PROXY_TOKEN: temToken ? "ok" : "FALTANDO",
      ANTHROPIC_API_KEY: temKey ? "ok" : "FALTANDO",
      dica: "configure em Settings > Environment Variables (Production) e faca REDEPLOY",
    });
  }

  // Autenticação por token compartilhado
  const token = req.headers["x-proxy-token"];
  if (token !== process.env.PROXY_TOKEN)
    return res.status(401).json({ error: "token invalido" });

  // Parse robusto do corpo (Vercel nem sempre faz o parse automático)
  let body = {};
  try {
    if (typeof req.body === "string") body = JSON.parse(req.body);
    else if (req.body && typeof req.body === "object") body = req.body;
    else {
      // lê o stream manualmente como último recurso
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString("utf8");
      body = raw ? JSON.parse(raw) : {};
    }
  } catch (e) {
    return res.status(400).json({ error: "body invalido", detail: String(e).slice(0, 150) });
  }

  const prompt = body.prompt;
  const maxTokens = body.max_tokens || 900;
  const model = body.model || "claude-sonnet-4-6";
  if (!prompt) return res.status(400).json({ error: "prompt ausente" });

  // Chama a Anthropic
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
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
    return res.status(502).json({ error: "falha ao chamar anthropic", detail: String(e).slice(0, 200) });
  }
}
