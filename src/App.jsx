import React, { useState, useEffect, useMemo, useRef } from "react";

/* =========================================================================
   BRAZ ATIVOS — leitura técnica de mercado (cripto + ações)
   Versão com CRONÔMETRO DE VARREDURA (ciclo de 5 min) e marca "Braz Ativos".

   Conteúdo informativo/educacional. NÃO é recomendação nem análise de
   valores mobiliários (Res. CVM 20/2021). Dados de exemplo até o backend
   ser conectado — quando API_BASE apontar para o servidor, o app troca
   automaticamente para leitura ao vivo.
   ========================================================================= */

// URL do backend. Vazio = usa dados de exemplo (fallback).
// Ex.: "https://seu-backend.ngrok-free.app"
// URL pública do backend (ngrok). ATENÇÃO: muda a cada reinício do ngrok —
// quando reiniciar o túnel, troque aqui e suba o App.jsx de novo.
const API_BASE = "https://grandkid-outsider-dwindling.ngrok-free.dev";

// Ciclo de varredura, em segundos (5 minutos).
const CICLO_SEG = 5 * 60;

// -------- paleta "mesa de operações à noite" --------
const C = {
  bg: "#0F141B",
  panel: "#161E28",
  panel2: "#1C2732",
  line: "#28323F",
  ink: "#F1F4F9",
  dim: "#93A0B2",
  faint: "#5D6B7D",
  gold: "#F0C35A", // curto prazo (micro)
  steel: "#6BA6D8", // longo prazo (macro)
  green: "#3CD68C",
  red: "#E5655F",
};

const fonts =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// -------- dados de exemplo (substituídos pelo backend ao vivo) --------
const EXEMPLO = [
  {
    sym: "BTC/USDT",
    classe: "cripto",
    preco: 61450.0,
    vies: "alta",
    dia: 0.6,
    semana: 5.2,
    mes: 7.5,
    ano: 52.0,
    faixa: [60800, 65400],
    suporte: 61000,
    resist: 64800,
    tese: "Tendência de alta forte (EMA9 > EMA21). Repique defendeu o suporte — continuação com amplo espaço até a resistência.",
  },
  {
    sym: "ETH/USDT",
    classe: "cripto",
    preco: 1663.34,
    vies: "alta",
    dia: 1.4,
    semana: 4.5,
    mes: -2.1,
    ano: -34.9,
    faixa: [1610, 1720],
    suporte: 1625,
    resist: 1705,
    tese: "EMA9 cruzou EMA21 para cima. Reação no suporte curto.",
  },
  {
    sym: "SOL/USDT",
    classe: "cripto",
    preco: 138.72,
    vies: "alta",
    dia: 2.6,
    semana: 7.9,
    mes: 5.4,
    ano: 88.2,
    faixa: [128, 146],
    suporte: 131,
    resist: 144,
    tese: "Rompimento de topo curto com volume acima da média.",
  },
  {
    sym: "BNB/USDT",
    classe: "cripto",
    preco: 574.1,
    vies: "neutro",
    dia: -0.3,
    semana: 1.1,
    mes: 0.8,
    ano: 22.4,
    faixa: [560, 592],
    suporte: 566,
    resist: 588,
    tese: "Lateralização entre médias. Sem sinal direcional claro.",
  },
  {
    sym: "XRP/USDT",
    classe: "cripto",
    preco: 0.5218,
    vies: "baixa",
    dia: -1.2,
    semana: -3.4,
    mes: -6.7,
    ano: -12.1,
    faixa: [0.505, 0.548],
    suporte: 0.508,
    resist: 0.542,
    tese: "Perda da EMA21 no diário. Viés de baixa no curto prazo.",
  },
  {
    sym: "NVDA",
    classe: "acao",
    preco: 121.44,
    vies: "alta",
    dia: 0.9,
    semana: 3.1,
    mes: 8.6,
    ano: 154.2,
    faixa: [116, 126],
    suporte: 118,
    resist: 125,
    tese: "Tendência de alta no diário; topos e fundos ascendentes.",
  },
  {
    sym: "TSM",
    classe: "acao",
    preco: 168.9,
    vies: "alta",
    dia: 0.4,
    semana: 2.2,
    mes: 4.9,
    ano: 61.3,
    faixa: [162, 174],
    suporte: 164,
    resist: 172,
    tese: "Preço acima das médias; estrutura construtiva.",
  },
  {
    sym: "HIMS",
    classe: "acao",
    preco: 18.27,
    vies: "neutro",
    dia: -0.6,
    semana: 1.8,
    mes: -4.2,
    ano: 29.7,
    faixa: [17.1, 19.6],
    suporte: 17.4,
    resist: 19.2,
    tese: "Consolidação ampla. Aguardando definição de faixa.",
  },
];

// RSI semanal de exemplo (no ao vivo, virá do backend junto com o resto).
const RSI_SEM = {
  "BTC/USDT": 55, "ETH/USDT": 56, "SOL/USDT": 68, "BNB/USDT": 49,
  "XRP/USDT": 38, "NVDA": 63, "TSM": 58, "HIMS": 47,
};
EXEMPLO.forEach((a) => {
  if (RSI_SEM[a.sym] != null) a.rsiSem = RSI_SEM[a.sym];
});

// ---- gera ~45 criptos de exemplo (variadas) para alimentar o ranking ----
// No ao vivo, a lista real vem do scanner do backend (01_scanner).
const CRIPTOS_BASE = [
  ["DOGE/USDT", 0.122], ["ADA/USDT", 0.381], ["AVAX/USDT", 27.4], ["LINK/USDT", 13.6],
  ["DOT/USDT", 5.82], ["POL/USDT", 0.452], ["NEAR/USDT", 4.91], ["INJ/USDT", 21.3],
  ["ARB/USDT", 0.78], ["APT/USDT", 7.42], ["SUI/USDT", 1.36], ["SEI/USDT", 0.421],
  ["TIA/USDT", 6.18], ["OP/USDT", 1.54], ["LTC/USDT", 68.4], ["BCH/USDT", 342],
  ["ATOM/USDT", 6.81], ["FIL/USDT", 4.12], ["RNDR/USDT", 6.53], ["IMX/USDT", 1.24],
  ["AAVE/USDT", 92.5], ["UNI/USDT", 7.21], ["ETC/USDT", 19.1], ["HBAR/USDT", 0.058],
  ["VET/USDT", 0.026], ["ALGO/USDT", 0.131], ["STX/USDT", 1.61], ["GRT/USDT", 0.162],
  ["FTM/USDT", 0.421], ["RUNE/USDT", 4.32], ["THETA/USDT", 1.15], ["EGLD/USDT", 32.1],
  ["FLOW/USDT", 0.621], ["AXS/USDT", 5.42], ["SAND/USDT", 0.321], ["MANA/USDT", 0.361],
  ["GALA/USDT", 0.0212], ["CHZ/USDT", 0.0721], ["KAVA/USDT", 0.422], ["MINA/USDT", 0.552],
  ["DYDX/USDT", 1.26], ["PENDLE/USDT", 3.81], ["LDO/USDT", 1.46], ["JUP/USDT", 0.782],
  ["WLD/USDT", 2.34],
];

function rndSeed(i) {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return x - Math.floor(x);
}

function geraCripto([sym, base], idx) {
  const i = idx + 1;
  const r = (k) => rndSeed(i * 9 + k);
  const t = r(1) * 2 - 1;
  const vies = t > 0.22 ? "alta" : t < -0.22 ? "baixa" : "neutro";
  const d = vies === "alta" ? 1 : vies === "baixa" ? -1 : 0;
  const r1 = (n) => Math.round(n * 10) / 10;
  const dia = r1(d * 0.8 + (r(2) - 0.5) * 2.4);
  const semana = r1(d * 3.2 + (r(3) - 0.5) * 5);
  const mes = r1(d * 5 + (r(4) - 0.5) * 9);
  const ano = r1(d * 32 + (r(5) - 0.5) * 70);
  const range = base * (0.05 + r(6) * 0.06);
  const pos = 0.12 + r(7) * 0.76;
  const low = base - pos * range;
  const high = low + range;
  const rsiSem = Math.max(22, Math.min(84, Math.round(50 + semana * 1.8 + (r(8) - 0.5) * 14)));
  const tese =
    vies === "alta"
      ? "Tendência de alta; médias empilhadas. Leitura construtiva."
      : vies === "baixa"
      ? "Tendência de baixa; preço sob as médias. Pressão vendedora."
      : "Lateralização entre médias. Sem direção definida.";
  const dec = base < 1 ? 4 : 2;
  const rd = (n) => Number(n.toFixed(dec));
  // amostras para o preview das novas leituras (no ao vivo vêm do backend)
  const funding = Number(((r(9) - 0.45) * 0.002).toFixed(6));
  const distEma9 = Number((d * (1 + r(10) * 5) + (r(11) - 0.5) * 2).toFixed(2));
  const eventos =
    r(12) > 0.8
      ? [{ tipo: vies === "baixa" ? "Cruzamento de médias" : "Rompimento de resistência", vies, nota: tese }]
      : [];
  return {
    sym,
    classe: "cripto",
    preco: rd(base),
    vies,
    dia,
    semana,
    mes,
    ano,
    faixa: [rd(low), rd(high)],
    suporte: rd(low + range * 0.04),
    resist: rd(high - range * 0.04),
    rsiSem,
    funding,
    distEma9,
    eventos,
    tese,
  };
}

EXEMPLO.push(...CRIPTOS_BASE.map(geraCripto));

// -------- utilidades --------
const fmtPreco = (n) =>
  n >= 100
    ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toLocaleString("pt-BR", { minimumFractionDigits: n < 1 ? 4 : 2, maximumFractionDigits: 4 });

const fmtPct = (n) => `${n > 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")}%`;
const mmss = (s) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};
const corPct = (n) => (n > 0 ? C.green : n < 0 ? C.red : C.dim);

const viesInfo = {
  alta: { txt: "viés de alta", cor: C.green },
  baixa: { txt: "viés de baixa", cor: C.red },
  neutro: { txt: "sem viés", cor: C.dim },
};

// Qualidade do setup em estrelas (0–5). Descritivo, não recomendação.
// Cruza: força da leitura + R:R na direção + posição favorável na faixa
// + alinhamento de prazos + folga do RSI. Conflito e viés neutro penalizam.
function calcEstrelas(a) {
  const { score, conflito } = calcVies(a);
  const dir = score >= 50 ? "long" : "short";
  const mag = Math.abs(score - 50);
  const pos = Math.min(1, Math.max(0, (a.preco - a.faixa[0]) / (a.faixa[1] - a.faixa[0])));
  const distR = (a.resist - a.preco) / a.preco;
  const distS = (a.preco - a.suporte) / a.preco;
  const rsi = a.rsiSem ?? 50;

  const reward = dir === "long" ? distR : distS;
  const risk = dir === "long" ? distS : distR;
  const rr = risk > 0 ? reward / risk : 0;

  const qMag = Math.min(1, mag / 35);
  const qRR = Math.min(1, rr / 4);
  const qPos = dir === "long" ? 1 - pos : pos; // extremo favorável à direção
  const alin =
    [a.dia, a.semana, a.mes].filter((v) => (dir === "long" ? v > 0 : v < 0)).length / 3;
  let qRsi;
  if (dir === "long") qRsi = rsi >= 70 ? 0.3 : rsi >= 65 ? 0.6 : 1;
  else qRsi = rsi <= 30 ? 0.3 : rsi <= 35 ? 0.6 : 1;

  let q = 0.3 * qMag + 0.25 * qRR + 0.2 * qPos + 0.15 * alin + 0.1 * qRsi;
  if (conflito) q *= 0.55;
  if (a.vies === "neutro") q *= 0.5;

  const estrelas = Math.max(0, Math.min(5, Math.round(q * 5 * 2) / 2));
  const lado = a.vies === "neutro" ? "neutro" : dir;
  return { estrelas, q, lado };
}

// 5 estrelas com brilho — cor por direção (verde=long, vermelho=short)
function Estrelas({ n, cor }) {
  const c = cor || "#FFD24A";
  return (
    <div style={{ display: "inline-flex", gap: 2 }} aria-label={`${n} de 5 estrelas`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const frac = Math.max(0, Math.min(1, n - i));
        return (
          <span
            key={i}
            style={{
              position: "relative",
              width: 15,
              height: 15,
              display: "inline-block",
              fontSize: 15,
              lineHeight: "15px",
            }}
          >
            <span style={{ position: "absolute", left: 0, top: 0, color: C.line }}>★</span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: `${frac * 100}%`,
                overflow: "hidden",
                whiteSpace: "nowrap",
                color: c,
                textShadow: `0 0 6px ${c}`,
              }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ============================ COMPONENTE ============================
// ---- adaptador: formato do backend -> formato dos cards do app ----
function adaptarCard(c) {
  const v = c.variacao || {};
  const micro = c.micro || {};
  const num = (x) => (x === null || x === undefined || isNaN(Number(x)) ? 0 : Number(x));
  const sup = num(micro.sup);
  const res = num(micro.res);
  const preco = num(c.preco_num);
  // faixa segura (evita divisão por zero se sup==res)
  let faixa = [sup, res];
  if (!(res > sup)) faixa = [preco * 0.98, preco * 1.02];
  // RSI semanal real; se ausente (moeda nova), cai para o diário; senão 50
  const rsiSem =
    c.rsi_sem !== null && c.rsi_sem !== undefined
      ? num(c.rsi_sem)
      : c.rsi_d !== null && c.rsi_d !== undefined
      ? num(c.rsi_d)
      : 50;
  return {
    sym: c.ativo || "—",
    classe: c.classe === "acao" ? "acao" : "cripto",
    preco,
    vies: c.vies || "neutro",
    dia: num(v.d),
    semana: num(v.s),
    mes: num(v.m),
    ano: v.a === null || v.a === undefined ? null : num(v.a),
    faixa,
    suporte: faixa[0],
    resist: faixa[1],
    rsiSem,
    funding: c.funding !== undefined ? c.funding : null,
    distEma9: c.dist_ema9 !== undefined && c.dist_ema9 !== null ? num(c.dist_ema9) : null,
    sr: c.sr || null,
    volRel: c.vol_rel !== undefined && c.vol_rel !== null ? num(c.vol_rel) : null,
    bb: c.bb || null,
    atrPct: c.atr_pct !== undefined && c.atr_pct !== null ? num(c.atr_pct) : null,
    poc: c.poc !== undefined && c.poc !== null ? num(c.poc) : null,
    mediasAcima: c.medias_acima || null,
    tese: c.nota || "",
    ts: c.ts || 0,
    tipo: c.tipo || "",
    eventos: c.eventos || [],
  };
}

export default function App() {
  const [filtro, setFiltro] = useState("todos");
  const [ativos, setAtivos] = useState([]); // vazio até o backend responder (sem números falsos)
  const [online, setOnline] = useState(false);
  const [secLeft, setSecLeft] = useState(CICLO_SEG);
  const [ultimaLeitura, setUltimaLeitura] = useState(Date.now());
  const [agora, setAgora] = useState(Date.now());
  const [briefing, setBriefing] = useState(null);
  const [analises, setAnalises] = useState([]);
  const [agendaIA, setAgendaIA] = useState(null); // horários fixos + próxima rodada

  // relógio de 1s: cronômetro + idade do dado
  useEffect(() => {
    const t = setInterval(() => {
      setAgora(Date.now());
      setSecLeft((s) => {
        if (s <= 1) {
          setUltimaLeitura(Date.now());
          buscar(); // ao zerar, rebusca (se houver backend)
          return CICLO_SEG;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // busca no backend (só se API_BASE estiver configurado)
  async function buscar() {
    if (!API_BASE) return; // sem backend: mantém exemplos
    try {
      const r = await fetch(`${API_BASE}/api/cards?limite=60`, {
        headers: { "ngrok-skip-browser-warning": "true" }, // pula a tela de aviso do ngrok
      });
      const dados = await r.json();
      if (Array.isArray(dados) && dados.length) {
        const adaptados = dados.map(adaptarCard);
        setAtivos(adaptados);
        setOnline(true);
        // "última leitura" = carimbo mais recente entre os cards
        const maxTs = Math.max(...adaptados.map((a) => a.ts || 0));
        if (maxTs > 0) {
          setUltimaLeitura(maxTs * 1000);
          // CRONÔMETRO SINCRONIZADO: conta a partir da varredura REAL do
          // backend, não do momento em que o app abriu. Se a idade passar
          // do ciclo, usa o módulo (próxima varredura esperada).
          const idadeS = Math.floor(Date.now() / 1000 - maxTs);
          const resto = CICLO_SEG - (((idadeS % CICLO_SEG) + CICLO_SEG) % CICLO_SEG);
          setSecLeft(Math.max(5, resto));
        }
      }
    } catch {
      setOnline(false); // backend indisponível: mantém última leitura
    }
    // leituras IA pré-geradas (top setups)
    try {
      const ra = await fetch(`${API_BASE}/api/analises?limite=15`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const la = await ra.json();
      if (Array.isArray(la)) setAnalises(la);
    } catch {}
    // agenda das rodadas de IA (horários fixos + próxima)
    try {
      const rg = await fetch(`${API_BASE}/api/analises/agenda`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const g = await rg.json();
      if (g && g.proxima) setAgendaIA(g);
    } catch {}
  }

  useEffect(() => {
    buscar();
  }, []);

  // rebusca só as leituras IA (após gerar uma sob demanda)
  async function recarregarAnalises() {
    try {
      const ra = await fetch(`${API_BASE}/api/analises?limite=15`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const la = await ra.json();
      if (Array.isArray(la)) setAnalises(la);
    } catch {}
  }

  const idadeSeg = Math.floor((agora - ultimaLeitura) / 1000);
  const progresso = 1 - secLeft / CICLO_SEG;

  // memória do ciclo anterior (para mostrar ▲▼ de mudança de estrelas)
  const prevStars = useRef({});
  const [filtroRadar, setFiltroRadar] = useState(null); // 'long' | 'short' | 'zona' | null

  const lista = useMemo(() => {
    const enriquecidos = ativos.map((a) => {
      const { estrelas, q, lado } = calcEstrelas(a);
      const { conflito } = calcVies(a);
      // zona de gatilho: preço a <1% do nível relevante à direção
      const distSup = a.suporte > 0 ? ((a.preco - a.suporte) / a.preco) * 100 : 99;
      const distRes = a.preco > 0 ? ((a.resist - a.preco) / a.preco) * 100 : 99;
      const distNivel = lado === "short" ? distRes : distSup;
      const emZona = distNivel >= 0 && distNivel < 0.4;
      // delta de estrelas vs. ciclo anterior
      const antes = prevStars.current[a.sym];
      const delta = antes === undefined ? 0 : Math.sign(estrelas - antes);
      // ordenação híbrida: qualidade + urgência (zona de gatilho pesa)
      const sortKey = estrelas + (emZona ? 1.2 : 0) - (conflito ? 0.4 : 0);
      return { ...a, estrelas, q, lado, conflito, emZona, distNivel, delta, sortKey };
    });
    // atualiza a memória DEPOIS de calcular os deltas
    enriquecidos.forEach((a) => (prevStars.current[a.sym] = a.estrelas));

    return enriquecidos
      .filter((a) => filtro === "todos" || a.classe === filtro)
      .filter((a) => {
        if (filtroRadar === "long") return a.lado === "long" && a.estrelas >= 4 && !a.conflito;
        if (filtroRadar === "short") return a.lado === "short" && a.estrelas >= 4 && !a.conflito;
        if (filtroRadar === "zona") return a.emZona;
        return true;
      })
      .sort((x, y) => y.sortKey - x.sortKey || y.q - x.q);
  }, [ativos, filtro, filtroRadar]);

  // contagens do radar executivo (sobre o universo filtrado por classe)
  const radar = useMemo(() => {
    const base = ativos
      .map((a) => {
        const { estrelas, lado } = calcEstrelas(a);
        const { conflito } = calcVies(a);
        const distSup = a.suporte > 0 ? ((a.preco - a.suporte) / a.preco) * 100 : 99;
        const distRes = a.preco > 0 ? ((a.resist - a.preco) / a.preco) * 100 : 99;
        const distNivel = lado === "short" ? distRes : distSup;
        return { lado, estrelas, conflito, emZona: distNivel >= 0 && distNivel < 0.4 };
      })
      .filter(() => true);
    const long = base.filter((a) => a.lado === "long" && a.estrelas >= 4 && !a.conflito).length;
    const short = base.filter((a) => a.lado === "short" && a.estrelas >= 4 && !a.conflito).length;
    const zona = base.filter((a) => a.emZona).length;
    return { long, short, zona, total: base.length };
  }, [ativos]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: fonts }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "0 14px 40px" }}>
        {/* ---------- cabeçalho ---------- */}
        <header style={{ paddingTop: 22, paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Braz</span>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: C.gold }}>
              Ativos
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: C.dim, marginTop: 2 }}>
            Leitura técnica de mercado · cripto e ações
          </div>
        </header>

        {/* ---------- cronômetro de varredura (assinatura) ---------- */}
        <ScanTimer
          secLeft={secLeft}
          progresso={progresso}
          idadeSeg={idadeSeg}
          online={online}
        />

        {/* ---------- radar executivo (visão de mesa em 2s) ---------- */}
        <Radar radar={radar} ativo={filtroRadar} onSel={setFiltroRadar} />

        {/* ---------- briefing IA (2x/dia) ---------- */}
        <BriefingSobDemanda briefing={briefing} setBriefing={setBriefing} />

        {/* ---------- filtros ---------- */}
        <div style={{ display: "flex", gap: 8, margin: "16px 0 14px" }}>
          {[
            ["todos", "Todos"],
            ["cripto", "Cripto"],
            ["acao", "Ações"],
            ["ia", "🧠 IA"],
          ].map(([k, label]) => {
            const on = filtro === k;
            return (
              <button
                key={k}
                onClick={() => setFiltro(k)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 10,
                  border: `1px solid ${on ? C.gold : C.line}`,
                  background: on ? "rgba(240,195,90,0.10)" : C.panel,
                  color: on ? C.gold : C.dim,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ---------- cards / aba IA ---------- */}
        {filtro === "ia" ? (
          <ListaAnalises itens={analises} agenda={agendaIA} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lista.map((a) => (
              <Card key={a.sym} a={a} idadeSeg={idadeSeg}
                temAnalise={analises.some((x) => x.ativo === a.sym &&
                  x.criado_em && (Date.now() - new Date(x.criado_em).getTime()) < 24 * 3600 * 1000)}
                aoGerar={recarregarAnalises} />
            ))}
          </div>
        )}

        {/* ---------- disclaimer ---------- */}
        <footer
          style={{
            marginTop: 20,
            padding: "12px 12px",
            borderRadius: 12,
            border: `1px solid ${C.line}`,
            background: C.panel,
            fontSize: 11,
            lineHeight: 1.5,
            color: C.faint,
          }}
        >
          Conteúdo informativo e educacional. Não é recomendação de investimento nem análise de
          valores mobiliários (Res. CVM 20/2021). Leitura técnica de dados públicos. Decisões e
          riscos são de responsabilidade do usuário. Rentabilidade passada não garante resultado
          futuro.
        </footer>
      </div>
    </div>
  );
}

// ---------------- briefing IA (2x/dia, gerado no backend) ----------------
function BriefingSobDemanda({ briefing, setBriefing }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(null);

  async function gerar() {
    setGerando(true);
    setErro(null);
    try {
      const r = await fetch(`${API_BASE}/api/briefing/gerar`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (d && d.texto) setBriefing({ texto: d.texto, periodo: "sob demanda", criado_em: new Date().toISOString() });
      else throw new Error("vazio");
    } catch {
      setErro("Não foi possível gerar agora (backend acessível?).");
    }
    setGerando(false);
  }

  if (briefing) return <BriefingBox b={briefing} />;
  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={gerar}
        disabled={gerando}
        style={{
          width: "100%", padding: "11px 0", borderRadius: 12,
          border: `1px solid ${C.line}`, background: C.panel,
          color: C.ink, fontSize: 13, fontWeight: 700,
          cursor: gerando ? "wait" : "pointer",
        }}
      >
        {gerando ? "🧠 Gerando análise geral... (pode levar ~1 min)" : "🧠 Gerar análise geral do mercado"}
      </button>
      {erro && (
        <div style={{ marginTop: 6, fontSize: 11.5, color: C.red }}>{erro}</div>
      )}
    </div>
  );
}

function BriefingBox({ b }) {
  const [aberto, setAberto] = useState(false);
  const quando = b.criado_em ? b.criado_em.slice(11, 16) : "";
  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: C.panel,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          background: "transparent",
          border: "none",
          color: C.ink,
          cursor: "pointer",
          fontSize: 12.5,
          fontWeight: 700,
        }}
      >
        <span>
          🧠 Briefing IA{" "}
          <span style={{ color: C.dim, fontWeight: 500 }}>
            · {b.periodo || ""} {quando && `· ${quando}`}
          </span>
        </span>
        <span style={{ color: C.dim }}>{aberto ? "▴" : "▾"}</span>
      </button>
      {aberto && (
        <div
          style={{
            padding: "0 12px 12px",
            fontSize: 12.5,
            lineHeight: 1.55,
            color: C.dim,
            whiteSpace: "pre-wrap",
          }}
        >
          {b.texto}
        </div>
      )}
    </div>
  );
}

// ---------------- leitura IA sob demanda (por ativo) ----------------
function AnaliseIA({ a, jaGerada, aoGerar }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [texto, setTexto] = useState(null);
  const [erro, setErro] = useState(null);
  const [antiga, setAntiga] = useState(false); // backend devolveu leitura anterior (stale)

  async function pedir() {
    // leitura NOVA já na tela: o clique só abre/fecha
    if (texto && !antiga) {
      setAberto(!aberto);
      return;
    }
    // sem leitura, ou só a antiga: (re)tenta gerar
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch(
        `${API_BASE}/api/analise?ativo=${encodeURIComponent(a.sym)}`,
        { headers: { "ngrok-skip-browser-warning": "true" } }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setTexto(d.texto || "Sem análise disponível.");
      setAntiga(!!d.stale);
      setAberto(true);
      if (d.stale) {
        setErro("A geração ao vivo falhou — esta é a leitura ANTERIOR. Toque de novo para tentar gerar outra.");
      } else if (aoGerar) {
        aoGerar(); // leitura nova de verdade: registra na aba 🧠 IA
      }
    } catch {
      setErro("Não foi possível obter a leitura agora (backend acessível?).");
      setAberto(true);
    }
    setCarregando(false);
  }

  const gerada = (!!texto && !antiga) || jaGerada; // sucesso = leitura NOVA (ou da rodada recente)

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={pedir}
        disabled={carregando}
        style={{
          width: "100%",
          padding: "9px 0",
          borderRadius: 10,
          border: `1px solid ${gerada ? "rgba(74,222,128,0.45)" : "rgba(240,195,90,0.4)"}`,
          background: gerada ? "rgba(74,222,128,0.08)" : "rgba(240,195,90,0.08)",
          color: gerada ? C.green : C.gold,
          fontSize: 12.5,
          fontWeight: 700,
          cursor: carregando ? "wait" : "pointer",
        }}
      >
        {carregando
          ? "Gerando leitura... (pode levar ~1 min)"
          : texto && antiga
          ? "🧠 leitura anterior — tentar gerar de novo"
          : texto && aberto
          ? "🧠 Ocultar leitura IA"
          : gerada
          ? "🧠 análise IA gerada com sucesso"
          : "🧠 Leitura IA deste setup"}
      </button>
      {aberto && (erro || texto) && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 11px",
            borderRadius: 10,
            border: `1px solid ${erro ? C.red : C.line}`,
            background: C.bg,
            fontSize: 12.5,
            lineHeight: 1.55,
            color: erro ? C.red : C.dim,
            whiteSpace: "pre-wrap",
          }}
        >
          {erro || texto}
        </div>
      )}
    </div>
  );
}

// ---------------- aba IA: leituras pré-geradas dos melhores setups ----------------
function BannerProximaAnalise({ agenda }) {
  if (!agenda || !agenda.proxima) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 13px",
        borderRadius: 10,
        border: `1px solid ${C.line}`,
        background: C.panel2,
        fontSize: 11.5,
        color: C.dim,
      }}
    >
      <span>
        ⏭️ Próxima análise IA:{" "}
        <b style={{ color: C.gold || "#C9A227" }}>
          {agenda.proxima}
          {agenda.proxima_amanha ? " (amanhã)" : ""}
        </b>
      </span>
      <span style={{ fontSize: 10.5 }}>
        TOP {agenda.top_n} · {agenda.horarios.join(" · ")}
      </span>
    </div>
  );
}

function ListaAnalises({ itens, agenda }) {
  if (!itens || itens.length === 0)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <BannerProximaAnalise agenda={agenda} />
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: `1px solid ${C.line}`,
            background: C.panel,
            fontSize: 12.5,
            color: C.dim,
            lineHeight: 1.55,
          }}
        >
          Nenhuma leitura IA pronta ainda. O backend analisa os {""}
          <b style={{ color: C.ink }}>
            {agenda?.top_n || 3} melhores setups
          </b>{" "}
          do radar em rodadas fixas
          {agenda?.horarios ? ` (${agenda.horarios.join(", ")})` : ""} —
          aguarde a próxima rodada (ou verifique se o backend está no ar).
        </div>
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <BannerProximaAnalise agenda={agenda} />
      {itens.map((it) => (
        <AnalisePainel key={it.ativo} it={it} />
      ))}
    </div>
  );
}

function AnalisePainel({ it }) {
  const [aberto, setAberto] = useState(false);
  const quando = it.criado_em
    ? `${it.criado_em.slice(8, 10)}/${it.criado_em.slice(5, 7)} ${it.criado_em.slice(11, 16)}`
    : "";
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})`,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 13px",
          background: "transparent",
          border: "none",
          color: C.ink,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 14.5, fontWeight: 800 }}>
          🧠 {it.ativo}
        </span>
        <span style={{ fontSize: 11, color: C.dim }}>
          {quando} {aberto ? "▴" : "▾"}
        </span>
      </button>
      {aberto && (
        <div
          style={{
            padding: "0 13px 13px",
            fontSize: 12.5,
            lineHeight: 1.55,
            color: C.dim,
            whiteSpace: "pre-wrap",
          }}
        >
          {it.texto}
        </div>
      )}
    </div>
  );
}

// ---------------- radar executivo (contagens tocáveis) ----------------
function Radar({ radar, ativo, onSel }) {
  const Item = ({ id, n, rotulo, cor }) => {
    const on = ativo === id;
    return (
      <button
        onClick={() => onSel(on ? null : id)}
        style={{
          flex: 1,
          padding: "8px 4px",
          borderRadius: 10,
          border: `1px solid ${on ? cor : C.line}`,
          background: on ? `${cor}18` : C.panel,
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: cor, fontVariantNumeric: "tabular-nums" }}>
          {n}
        </div>
        <div style={{ fontSize: 9.5, color: on ? cor : C.dim, fontWeight: 600 }}>{rotulo}</div>
      </button>
    );
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <Item id="long" n={radar.long} rotulo="LONG LIMPOS" cor={C.green} />
      <Item id="short" n={radar.short} rotulo="SHORT LIMPOS" cor={C.red} />
      <Item id="zona" n={radar.zona} rotulo="EM ZONA" cor={C.gold} />
      <button
        onClick={() => onSel(null)} /* NO RADAR = limpar filtro -> volta todos os ativos */
        style={{
          flex: 1, padding: "8px 4px", borderRadius: 10,
          border: `1px solid ${ativo == null ? C.dim : C.line}`,
          background: C.panel, textAlign: "center", cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: C.dim, fontVariantNumeric: "tabular-nums" }}>
          {radar.total}
        </div>
        <div style={{ fontSize: 9.5, color: C.faint, fontWeight: 600 }}>NO RADAR</div>
      </button>
    </div>
  );
}

// ---------------- cronômetro (anel + estado) ----------------
function ScanTimer({ secLeft, progresso, idadeSeg, online }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - progresso);
  const alerta = secLeft <= 30;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderRadius: 14,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})`,
      }}
    >
      {/* anel */}
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke={C.line} strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={alerta ? C.gold : C.steel}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
        />
        <text
          x="32"
          y="34"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={C.ink}
          fontSize="13"
          fontWeight="700"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {mmss(secLeft)}
        </text>
      </svg>

      {/* texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>
          Próxima leitura em {mmss(secLeft)}
        </div>
        <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
          Última varredura há {idadeSeg < 60 ? `${idadeSeg}s` : `${Math.floor(idadeSeg / 60)} min`}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          {(() => {
            const atrasado = online && idadeSeg > CICLO_SEG * 2;
            const cor = !online ? C.gold : atrasado ? "#F0A05A" : C.green;
            const txt = !online
              ? "aguardando conectar ao backend"
              : atrasado
              ? "dados atrasados — verifique backend/ngrok"
              : "scanner ao vivo";
            return (
              <>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: cor,
                    boxShadow: `0 0 6px ${cor}`,
                  }}
                />
                <span style={{ fontSize: 11, color: cor, fontWeight: 600 }}>{txt}</span>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ---------------- card de ativo ----------------
function Card({ a, idadeSeg, temAnalise, aoGerar }) {
  const v = viesInfo[a.vies];
  const cripto = a.classe === "cripto";
  const pos =
    Math.min(1, Math.max(0, (a.preco - a.faixa[0]) / (a.faixa[1] - a.faixa[0]))) * 100;
  const corZona = a.lado === "short" ? C.red : C.green;
  const temEvento = (a.eventos || []).length > 0;

  return (
    <div
      style={{
        borderRadius: 14,
        border: a.emZona ? `1px solid ${corZona}` : `1px solid ${C.line}`,
        boxShadow: a.emZona ? `0 0 12px ${corZona}33` : "none",
        background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})`,
        padding: 14,
      }}
    >
      {/* badges de urgência: zona de gatilho / evento fresco */}
      {(a.emZona || temEvento) && (
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          {a.emZona && (
            <span
              style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
                padding: "3px 7px", borderRadius: 5,
                color: corZona, background: `${corZona}1a`, border: `1px solid ${corZona}55`,
              }}
            >
              ◎ EM ZONA DE LEITURA · {a.distNivel.toFixed(2).replace(".", ",")}% do nível
            </span>
          )}
          {temEvento && (
            <span
              style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
                padding: "3px 7px", borderRadius: 5,
                color: C.gold, background: "rgba(240,195,90,0.10)",
                border: "1px solid rgba(240,195,90,0.4)",
              }}
            >
              ⚡ {a.eventos[0].tipo.toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* qualidade do setup (5 estrelas: melhores oportunidades) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 9,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Estrelas
            n={a.estrelas}
            cor={a.lado === "long" ? C.green : a.lado === "short" ? C.red : "#F0C35A"}
          />
          {a.delta !== 0 && (
            <span
              style={{
                fontSize: 11, fontWeight: 800,
                color: a.delta > 0 ? C.green : C.red,
              }}
              title="mudança desde o último ciclo"
            >
              {a.delta > 0 ? "▲" : "▼"}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, color: C.faint, letterSpacing: 0.3 }}>
          qualidade do setup
        </span>
      </div>

      {/* topo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800 }}>{a.sym}</span>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: 0.4,
              padding: "3px 6px",
              borderRadius: 5,
              color: cripto ? C.gold : C.steel,
              background: cripto ? "rgba(240,195,90,0.10)" : "rgba(107,166,216,0.12)",
              border: `1px solid ${cripto ? "rgba(240,195,90,0.3)" : "rgba(107,166,216,0.3)"}`,
            }}
          >
            {cripto ? "SINAL TÉCNICO" : "LEITURA TÉCNICA"}
          </span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: v.cor }}>{v.txt}</span>
      </div>

      {/* preço */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span
          style={{ fontSize: 25, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}
        >
          {fmtPreco(a.preco)}
        </span>
        <span style={{ fontSize: 11, color: C.faint }}>
          leitura há {idadeSeg < 60 ? `${idadeSeg}s` : `${Math.floor(idadeSeg / 60)} min`}
        </span>
      </div>

      {/* tese */}
      <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.45, marginTop: 6 }}>{a.tese}</div>

      {/* indicadores que alimentam a leitura */}
      <IndicadoresRow a={a} />

      {/* curto x longo prazo */}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <PrazoBox
          titulo="CURTO PRAZO"
          cor={C.gold}
          itens={[
            ["Dia", a.dia],
            ["Semana", a.semana],
          ]}
        />
        <PrazoBox
          titulo="LONGO PRAZO"
          cor={C.steel}
          itens={[
            ["Mês", a.mes],
            ["Ano", a.ano],
          ]}
        />
      </div>

      {/* níveis de suporte/resistência por horizonte */}
      <NiveisBlock a={a} />

      {/* distância aos extremos — descritivo, apoia leitura de risco */}
      <RiscoRow a={a} />

      {/* referência de risco/retorno a partir dos níveis técnicos */}
      <RRBox a={a} />

      {/* predisposição técnica: leitura pende para Short ou Long */}
      <ViesBar a={a} />

      {/* leitura IA sob demanda deste ativo */}
      <AnaliseIA a={a} jaGerada={temAnalise} aoGerar={aoGerar} />
    </div>
  );
}

// ----- RSI: zona de leitura -----
function rsiZona(r) {
  if (r >= 70) return { t: "sobrecomprado", c: C.red };
  if (r <= 30) return { t: "sobrevendido", c: C.green };
  if (r >= 55) return { t: "comprador", c: C.green };
  if (r <= 45) return { t: "vendedor", c: C.red };
  return { t: "neutro", c: C.dim };
}

// ----- indicadores à vista no card -----
function IndicadoresRow({ a }) {
  const z = rsiZona(a.rsiSem);
  const medias =
    a.vies === "alta" ? "EMA9 > EMA21" : a.vies === "baixa" ? "EMA9 < EMA21" : "EMA9 ≈ EMA21";
  const medCor = a.vies === "alta" ? C.green : a.vies === "baixa" ? C.red : C.dim;
  const chip = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 9px",
    borderRadius: 8,
    background: C.bg,
    border: `1px solid ${C.line}`,
    fontSize: 11,
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      <div style={chip}>
        <span style={{ color: C.faint }}>RSI sem.</span>
        <span style={{ color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {a.rsiSem}
        </span>
        <span style={{ color: z.c, fontWeight: 600 }}>{z.t}</span>
      </div>
      <div style={chip}>
        <span style={{ color: C.faint }}>Médias</span>
        <span style={{ color: medCor, fontWeight: 600 }}>{medias}</span>
      </div>
      {a.mediasAcima && (
        <div style={chip}>
          <span style={{ color: C.faint }}>Acima de</span>
          <span style={{ color: C.ink, fontWeight: 700 }}>{a.mediasAcima}</span>
          <span style={{ color: C.faint }}>médias</span>
        </div>
      )}
      {a.volRel !== null && a.volRel !== undefined && (
        <div style={chip}>
          <span style={{ color: C.faint }}>Vol</span>
          <span
            style={{
              color: a.volRel >= 1.5 ? C.green : a.volRel <= 0.6 ? C.red : C.ink,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(a.volRel).replace(".", ",")}x
          </span>
          <span style={{ color: C.faint, fontSize: 10 }}>vs média 20d</span>
        </div>
      )}
      {a.bb && (
        <div style={chip}>
          <span style={{ color: C.faint }}>BB20</span>
          <span style={{ color: C.ink, fontWeight: 600 }}>{a.bb.posicao}</span>
        </div>
      )}
      {a.funding !== null && a.funding !== undefined && (
        <div style={chip}>
          <span style={{ color: C.faint }}>Funding</span>
          <span
            style={{
              color: a.funding > 0.0005 ? C.red : a.funding < -0.0003 ? C.green : C.dim,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(a.funding * 100).toFixed(3).replace(".", ",")}%
          </span>
          <span style={{ color: C.faint, fontSize: 10 }}>
            {a.funding > 0 ? "comprados pagam" : a.funding < 0 ? "vendidos pagam" : "neutro"}
          </span>
        </div>
      )}
      {a.distEma9 !== null && a.distEma9 !== undefined && Math.abs(a.distEma9) > 4 && (
        <div style={{ ...chip, border: `1px solid ${C.gold}55` }}>
          <span style={{ color: C.gold, fontWeight: 600 }}>
            ⚠ esticado {a.distEma9 > 0 ? "+" : ""}
            {a.distEma9.toFixed(1).replace(".", ",")}% da EMA9
          </span>
        </div>
      )}
    </div>
  );
}

/* Leitura de viés técnico — DESCRITIVA, não recomendação.
   Composto multi-timeframe (preview). No ao vivo, virá do motor do backend.
   Fatores: estrutura(médias) + momentum(dia/semana/mês) + RSI semanal + posição na faixa.
   Sinais opostos entre prazos se cancelam (menos "puxado") e acusam conflito. */
function calcVies(a) {
  const clamp1 = (x) => Math.max(-1, Math.min(1, x));
  const sEstr = a.vies === "alta" ? 1 : a.vies === "baixa" ? -1 : 0;
  const sDia = clamp1(a.dia / 3);
  const sSem = clamp1(a.semana / 6);
  const sMes = clamp1(a.mes / 8);
  const rsi = a.rsiSem ?? 50;
  const sRsi = clamp1((rsi - 50) / 25);
  const pos = Math.min(1, Math.max(0, (a.preco - a.faixa[0]) / (a.faixa[1] - a.faixa[0])));
  const sFaixa = clamp1((0.5 - pos) * 1.2); // perto do suporte = mais espaço p/ cima

  const raw = 22 * sEstr + 10 * sDia + 10 * sSem + 8 * sMes + 12 * sRsi + 6 * sFaixa;
  const score = 50 + 45 * Math.tanh(raw / 45); // saturação suave (extremos raros)

  const d = score - 50;
  const mag = Math.abs(d);
  const forca = mag < 8 ? "neutro" : mag < 22 ? "moderado" : "forte";

  // conflito: prazos/indicadores fortes em direções opostas
  const sinais = [sEstr, sSem, sMes, sRsi];
  const conflito = sinais.some((x) => x > 0.3) && sinais.some((x) => x < -0.3);

  // alerta de exaustão por RSI
  const alertaRsi = rsi >= 70 ? "sobrecomprado" : rsi <= 30 ? "sobrevendido" : null;

  let label, cor;
  if (forca === "neutro") {
    label = "Neutro";
    cor = C.dim;
  } else {
    label = `${d > 0 ? "Long" : "Short"} ${forca}`;
    cor = d > 0 ? C.green : C.red;
  }
  return { score, label, cor, conflito, alertaRsi };
}

// níveis de suporte/resistência por horizonte de operação
function NiveisBlock({ a }) {
  const f = (n) => (n === null || n === undefined ? "—" : fmtPreco(n));
  const Row = ({ rot, sup, res, forte }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px 0",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          color: forte ? C.ink : C.faint,
          fontWeight: forte ? 700 : 500,
          width: 90,
        }}
      >
        {rot}
      </span>
      <span style={{ fontSize: 12.5, color: C.red, fontVariantNumeric: "tabular-nums" }}>
        {f(sup)}
      </span>
      <span style={{ fontSize: 10, color: C.faint }}>·</span>
      <span style={{ fontSize: 12.5, color: C.green, fontVariantNumeric: "tabular-nums" }}>
        {f(res)}
      </span>
    </div>
  );
  const sr = a.sr;
  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 11px",
        borderRadius: 10,
        border: `1px solid ${C.line}`,
        background: C.bg,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: C.faint,
          letterSpacing: 0.4,
          marginBottom: 4,
        }}
      >
        <span>NÍVEIS POR HORIZONTE</span>
        <span>
          <span style={{ color: C.red }}>suporte</span> ·{" "}
          <span style={{ color: C.green }}>resistência</span>
        </span>
      </div>
      {sr ? (
        <>
          <Row rot="Curto (10d)" sup={sr.curto?.sup} res={sr.curto?.res} />
          <Row rot="Médio (30d)" sup={sr.medio?.sup} res={sr.medio?.res} forte />
          <Row rot="Longo (90d)" sup={sr.longo?.sup} res={sr.longo?.res} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 4,
              fontSize: 10.5,
              color: C.dim,
              marginTop: 6,
            }}
          >
            <span>
              Estrutural 180d:{" "}
              <b style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}>
                {f(sr.estrutural?.fundo)}
              </b>{" "}
              –{" "}
              <b style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}>
                {f(sr.estrutural?.topo)}
              </b>
            </span>
            {a.poc !== null && a.poc !== undefined && (
              <span>
                POC 90d{" "}
                <b style={{ color: C.gold, fontVariantNumeric: "tabular-nums" }}>{f(a.poc)}</b>
              </span>
            )}
          </div>
        </>
      ) : (
        <Row rot="Médio (30d)" sup={a.suporte} res={a.resist} forte />
      )}
      <div style={{ fontSize: 9.5, color: C.faint, marginTop: 6 }}>
        Zona e R:R do app usam o horizonte médio (30d).
      </div>
    </div>
  );
}

// distância aos extremos (descritivo) — geografia do preço para leitura de risco
function RiscoRow({ a }) {
  const distR = ((a.resist - a.preco) / a.preco) * 100;
  const distS = ((a.preco - a.suporte) / a.preco) * 100;
  const ampl = ((a.faixa[1] - a.faixa[0]) / a.faixa[0]) * 100;
  const pos = Math.min(1, Math.max(0, (a.preco - a.faixa[0]) / (a.faixa[1] - a.faixa[0])));
  const terco = pos < 0.34 ? "terço inferior" : pos < 0.67 ? "terço médio" : "terço superior";
  const p2 = (n) => n.toFixed(2).replace(".", ",");
  const p1 = (n) => n.toFixed(1).replace(".", ",");

  const Cell = ({ label, val, cor }) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: C.faint }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: cor, fontVariantNumeric: "tabular-nums" }}>
        {val}
      </div>
    </div>
  );

  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 11px",
        borderRadius: 10,
        border: `1px dashed ${C.line}`,
        background: C.bg,
      }}
    >
      <div style={{ fontSize: 10, color: C.faint, letterSpacing: 0.4, marginBottom: 8 }}>
        DISTÂNCIA AOS EXTREMOS · preço no {terco} da faixa
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Cell label="até resistência" val={`+${p2(distR)}%`} cor={C.green} />
        <Cell label="até suporte" val={`−${p2(distS)}%`} cor={C.red} />
        <Cell label="amplitude" val={`${p1(ampl)}%`} cor={C.dim} />
      </div>
    </div>
  );
}

// Referência de risco/retorno a partir dos níveis técnicos (descritivo).
function RRBox({ a }) {
  const p2 = (n) => n.toFixed(2).replace(".", ",");
  const fmt = (n) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (a.lado === "neutro") {
    return (
      <div
        style={{
          marginTop: 12,
          padding: "10px 11px",
          borderRadius: 10,
          border: `1px dashed ${C.line}`,
          background: C.bg,
          fontSize: 11.5,
          color: C.dim,
        }}
      >
        Sem direção definida — referência de R:R indisponível.
      </div>
    );
  }

  const long = a.lado === "long";
  const cor = long ? C.green : C.red;
  const alvo = long ? a.resist : a.suporte;
  const inval = long ? a.suporte : a.resist;
  const retorno = (Math.abs(alvo - a.preco) / a.preco) * 100;
  const risco = (Math.abs(a.preco - inval) / a.preco) * 100;
  const rr = risco > 0 ? retorno / risco : 0;

  const Cell = ({ label, val, c }) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: C.faint }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>
        {val}
      </div>
    </div>
  );

  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 11px",
        borderRadius: 10,
        border: `1px dashed ${cor}55`,
        background: C.bg,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 10, color: C.faint, letterSpacing: 0.4 }}>
          RISCO / RETORNO · {long ? "leitura long" : "leitura short"}
        </span>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 800,
            color: cor,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          R:R ≈ 1:{rr.toFixed(1).replace(".", ",")}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Cell label="entrada ref." val={fmt(a.preco)} c={C.ink} />
        <Cell label={`alvo (+${p2(retorno)}%)`} val={fmt(alvo)} c={C.green} />
        <Cell label={`invalidação (−${p2(risco)}%)`} val={fmt(inval)} c={C.red} />
      </div>
      <div style={{ fontSize: 10, color: C.faint, marginTop: 8, lineHeight: 1.4 }}>
        Referências técnicas, não ordem de execução. Stop mais folgado reduz o R:R.
      </div>
    </div>
  );
}

function ViesBar({ a }) {
  const { score, label, cor, conflito, alertaRsi } = calcVies(a);
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10.5,
          color: C.faint,
          marginBottom: 5,
        }}
      >
        <span>PREDISPOSIÇÃO TÉCNICA</span>
        <span style={{ color: cor, fontWeight: 700 }}>{label}</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${C.red}, ${C.gold}, ${C.green})`,
          opacity: 0.92,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${score}%`,
            transform: "translate(-50%, -50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: C.ink,
            border: `3px solid ${C.bg}`,
            boxShadow: `0 0 0 2px ${cor}, 0 0 12px ${cor}`,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: C.dim,
          marginTop: 5,
        }}
      >
        <span style={{ color: C.red }}>Short</span>
        <span>Neutro</span>
        <span style={{ color: C.green }}>Long</span>
      </div>
      {(conflito || alertaRsi) && (
        <div style={{ fontSize: 10.5, color: C.gold, marginTop: 6, lineHeight: 1.4 }}>
          ⚠ {conflito ? "sinais divergentes entre prazos" : ""}
          {conflito && alertaRsi ? " · " : ""}
          {alertaRsi ? `RSI ${alertaRsi}` : ""}
        </div>
      )}
    </div>
  );
}

function PrazoBox({ titulo, cor, itens }) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 10,
        border: `1px solid ${C.line}`,
        background: C.bg,
        padding: "9px 10px",
      }}
    >
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: cor }}>
        {titulo}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
        {itens.map(([label, val]) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: C.faint }}>{label}</div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: val === null || val === undefined ? C.faint : corPct(val),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {val === null || val === undefined ? "—" : fmtPct(val)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
