import React, { useState, useEffect, useRef } from "react";

/* ============================================================
   PROJETO ATIVOS — protótipo navegável do PWA de alertas de mercado
   Fase 1: cripto (sinal técnico) + ações IA/quântica/semis (leitura técnica)
   Este é o FRONT que o assinante vê. O push real e o scanner entram
   depois, plugados no backend FastAPI. Aqui os dados são de exemplo
   para você validar a experiência e o enquadramento dos cards.
   ============================================================ */

// -- paleta "mesa de operações à noite", revista para legibilidade:
//    fundo um grau mais claro, texto mais branco, e DUAS famílias de acento —
//    âmbar para o curto prazo (micro), azul-aço para o longo prazo (macro).
const C = {
  bg: "#0F141B",
  panel: "#171E27",
  panel2: "#1E2732",
  panel3: "#232E3B",
  line: "#2C3745",
  lineSoft: "#232D3A",
  ink: "#F1F4F9",
  dim: "#9BA6B7",
  faint: "#6B7688",
  amber: "#F0A93B",     // curto prazo / micro
  amberSoft: "#F0A93B22",
  steel: "#6BA0E8",     // longo prazo / macro
  steelSoft: "#6BA0E822",
  up: "#46C08A",
  down: "#EC6A56",
  blue: "#6BA0E8",
};

const FONT_DISPLAY = "'Georgia', 'Times New Roman', serif";
const FONT_BODY = "'Inter', -apple-system, system-ui, sans-serif";
const FONT_MONO = "'SF Mono', 'Roboto Mono', 'Menlo', monospace";

// ---- dados de exemplo (usados como fallback antes do backend estar no ar) ----
const AGORA = "3 jul 2026, 13:18";

// URL do backend. Em produção, aponte para o seu servidor (VPS/Cloudflare).
// Se estiver vazio ou o backend estiver fora do ar, o app usa os exemplos.
const API_BASE = ""; // ex: "https://api.projeto-ativos.app"

const BRIEFING_EXEMPLO = {
  data: "Sexta, 3 de julho de 2026",
  texto:
    "Bom dia. O mercado abre a sexta com viés misto. No diário, o BTC mantém estrutura de alta acima da média de 21 períodos, mas o RSI perto de 68 sugere fôlego curto para novas máximas sem uma pausa. O ETH lateraliza entre 1.650 e 1.720 há seis dias — sem definição, o par tende a respeitar as bordas. Destaque para o funding negativo em SOL, sinal de que vendidos estão pagando para manter posição, condição que às vezes antecede repiques. No mundo das ações-tema, a NVDA testa resistência técnica após três pregões de volume acima da média; IonQ segue volátil sem direção definida. Nada aqui é recomendação — são leituras de condição de mercado para você formar a sua própria decisão.",
};

// Cada card traz agora:
//  - variação de fechamento (dia/semana/mês/ano) — dado factual de mercado
//  - níveis técnicos MACRO (quadro maior: semanal/mensal) e MICRO (tempo do sinal)
// Tudo é LEITURA de gráfico e dado histórico — descreve o passado, não instrui.
// Enquadramento seguro para cripto e ações (CVM Res. 20/2021).
const SINAIS_EXEMPLO = [
  {
    id: 1,
    classe: "cripto",
    ativo: "ETH/USDT",
    tf: "Diário",
    tipo: "Cruzamento de médias",
    vies: "alta",
    quando: "há 2h",
    preco: "1.663,34",
    carimbo: "3 jul 2026 · 11:15",
    nota: "EMA9 cruzou EMA21 para cima. Estrutura de alta no diário.",
    variacao: { d: "+1,4", s: "+4,5", m: "-27,0", a: "-34,9" },
    macro: { res: "1.860", sup: "1.503", topo: "2.422", fundo: "1.503" },
    micro: { res: "1.720", sup: "1.610", topo: "1.760", fundo: "1.640" },
    faixa: "1.610 – 1.720",
  },
  {
    id: 2,
    classe: "cripto",
    ativo: "BTC/USDT",
    tf: "Diário",
    tipo: "Tendência sustentada",
    vies: "alta",
    quando: "há 3h",
    preco: "63.756,00",
    carimbo: "3 jul 2026 · 10:30",
    nota: "Preço acima da média de 21 no diário; RSI perto de 68 sugere fôlego curto.",
    variacao: { d: "+0,6", s: "+2,8", m: "-4,2", a: "+18,9" },
    macro: { res: "71.200", sup: "58.400", topo: "73.780", fundo: "49.200" },
    micro: { res: "64.900", sup: "62.100", topo: "66.300", fundo: "61.500" },
    faixa: "62.100 – 64.900",
  },
  {
    id: 3,
    classe: "cripto",
    ativo: "SOL/USDT",
    tf: "Diário",
    tipo: "Funding extremo",
    vies: "alta",
    quando: "há 1h",
    preco: "141,20",
    carimbo: "3 jul 2026 · 12:15",
    nota: "Vendidos pagando caro para manter posição. Condição de possível repique.",
    variacao: { d: "-2,1", s: "+6,8", m: "-18,4", a: "+12,6" },
    macro: { res: "168,00", sup: "121,50", topo: "182,30", fundo: "119,80" },
    micro: { res: "148,90", sup: "132,40", topo: "154,60", fundo: "128,10" },
    faixa: "132,40 – 148,90",
    dado: "−0,081%",
  },
  {
    id: 4,
    classe: "cripto",
    ativo: "BNB/USDT",
    tf: "4 horas",
    tipo: "Range detectado",
    vies: "neutro",
    quando: "há 25min",
    preco: "588,40",
    carimbo: "3 jul 2026 · 12:55",
    nota: "Quatro dias em lateralização estreita. Preço tende a respeitar as bordas.",
    variacao: { d: "+0,3", s: "-1,1", m: "+3,4", a: "+27,5" },
    macro: { res: "642,00", sup: "540,00", topo: "678,10", fundo: "512,30" },
    micro: { res: "602,00", sup: "574,50", topo: "608,80", fundo: "570,10" },
    faixa: "574,50 – 602,00",
  },
  {
    id: 5,
    classe: "cripto",
    ativo: "XRP/USDT",
    tf: "Diário",
    tipo: "Rompimento de resistência",
    vies: "alta",
    quando: "há 5h",
    preco: "0,5820",
    carimbo: "3 jul 2026 · 08:40",
    nota: "Fechou acima da resistência de 0,57 com volume acima da média.",
    variacao: { d: "+3,1", s: "+8,9", m: "+12,2", a: "-6,4" },
    macro: { res: "0,6400", sup: "0,4900", topo: "0,7280", fundo: "0,4210" },
    micro: { res: "0,5700", sup: "0,5480", topo: "0,5990", fundo: "0,5350" },
    faixa: "0,5480 – 0,5700",
  },
  {
    id: 6,
    classe: "acao",
    ativo: "NVDA",
    setor: "Semicondutores / IA",
    tf: "Diário",
    tipo: "Teste de resistência",
    vies: "alta",
    quando: "fechamento de ontem",
    preco: "168,45",
    carimbo: "2 jul 2026 · 17:00 (fech.)",
    nota: "Três pregões de volume acima da média testando o topo recente.",
    variacao: { d: "+2,3", s: "+5,1", m: "+9,7", a: "+41,2" },
    macro: { res: "182,00", sup: "138,20", topo: "195,60", fundo: "132,40" },
    micro: { res: "170,80", sup: "162,30", topo: "174,20", fundo: "158,10" },
    faixa: "162,30 – 170,80",
  },
  {
    id: 7,
    classe: "acao",
    ativo: "AMD",
    setor: "Semicondutores / IA",
    tf: "Diário",
    tipo: "Cruzamento de médias",
    vies: "alta",
    quando: "fechamento de ontem",
    preco: "142,80",
    carimbo: "2 jul 2026 · 17:00 (fech.)",
    nota: "Média de 9 cruzou a de 21 no diário; recuperação após suporte.",
    variacao: { d: "+1,6", s: "+3,7", m: "-2,1", a: "+22,4" },
    macro: { res: "158,00", sup: "118,50", topo: "164,90", fundo: "112,30" },
    micro: { res: "147,20", sup: "138,60", topo: "150,40", fundo: "135,10" },
    faixa: "138,60 – 147,20",
  },
  {
    id: 8,
    classe: "acao",
    ativo: "IONQ",
    setor: "Computação quântica",
    tf: "Diário",
    tipo: "Volatilidade atípica",
    vies: "neutro",
    quando: "fechamento de ontem",
    preco: "43,10",
    carimbo: "2 jul 2026 · 17:00 (fech.)",
    nota: "Amplitude diária 2,3x acima da média de 20 pregões. Sem direção definida.",
    variacao: { d: "-4,8", s: "-1,2", m: "+18,6", a: "+64,3" },
    macro: { res: "58,40", sup: "28,90", topo: "62,10", fundo: "26,70" },
    micro: { res: "46,20", sup: "38,50", topo: "49,70", fundo: "35,90" },
    faixa: "38,50 – 46,20",
  },
  {
    id: 9,
    classe: "acao",
    ativo: "RGTI",
    setor: "Computação quântica",
    tf: "Diário",
    tipo: "Teste de suporte",
    vies: "baixa",
    quando: "fechamento de ontem",
    preco: "11,35",
    carimbo: "2 jul 2026 · 17:00 (fech.)",
    nota: "Perdeu a média de 21 e testa o suporte de 10,80 pela segunda vez no mês.",
    variacao: { d: "-3,2", s: "-6,4", m: "-11,8", a: "+38,7" },
    macro: { res: "16,20", sup: "8,40", topo: "18,90", fundo: "7,10" },
    micro: { res: "12,60", sup: "10,80", topo: "13,40", fundo: "10,20" },
    faixa: "10,80 – 12,60",
  },
];

const ATIVOS_CRIPTO = ["BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX","LINK","DOT","POL","NEAR","INJ","ARB","APT"];

// Ações agrupadas por TESE — o recorte que dá identidade ao produto:
// a cadeia da revolução IA (chips → data centers → energia → quântica),
// mais mineração/tesouraria cripto, fintech e saúde.
const TESES_ACOES = [
  { tese: "IA & infraestrutura de dados", itens: ["NVDA","AMD","AVGO","MU","SMCI","PLTR","NBIS","CRWV","BBAI"] },
  { tese: "Computação quântica", itens: ["IONQ","RGTI","QS","NNE"] },
  { tese: "Energia & nuclear (a base da IA)", itens: ["OKLO","CEG","GEV","VRT","VST"] },
  { tese: "Mineração & tesouraria cripto", itens: ["MSTR","CLSK","IREN","COIN","HOOD"] },
  { tese: "Saúde", itens: ["HIMS"] },
];

function ViesTag({ vies }) {
  const map = {
    alta: { t: "viés de alta", c: C.up },
    baixa: { t: "viés de baixa", c: C.down },
    neutro: { t: "neutro", c: C.dim },
  };
  const v = map[vies] || map.neutro;
  return (
    <span style={{
      color: v.c, border: `1px solid ${v.c}55`, background: `${v.c}18`,
      fontFamily: FONT_MONO, fontSize: 12, letterSpacing: 0.3,
      padding: "3px 10px", borderRadius: 5, whiteSpace: "nowrap", fontWeight: 600,
    }}>{v.t}</span>
  );
}

function SinalCard({ s }) {
  const isCripto = s.classe === "cripto";
  const accent = isCripto ? C.amber : C.steel;
  const rotulo = isCripto ? "Sinal técnico" : "Leitura técnica";

  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.line}`,
      borderLeft: `4px solid ${accent}`, borderRadius: 10,
      padding: "18px 20px", marginBottom: 16,
    }}>
      {/* cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 21, fontWeight: 700, color: C.ink, letterSpacing: 0.5 }}>
              {s.ativo}
            </span>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10.5, color: accent,
              border: `1px solid ${accent}66`, background: `${accent}14`,
              padding: "2px 7px", borderRadius: 4,
              textTransform: "uppercase", letterSpacing: 0.8,
            }}>{rotulo}</span>
          </div>
          <div style={{ color: C.dim, fontSize: 13.5, marginTop: 5, fontFamily: FONT_BODY }}>
            {isCripto ? s.tf : `${s.setor} · ${s.tf}`}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <ViesTag vies={s.vies} />
          <div style={{ color: C.faint, fontSize: 11.5, marginTop: 7, fontFamily: FONT_MONO }}>{s.quando}</div>
        </div>
      </div>

      {/* preço no momento da análise + carimbo de data/hora */}
      {s.preco && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginTop: 14, padding: "11px 14px", background: C.panel3,
          border: `1px solid ${C.line}`, borderRadius: 8,
        }}>
          <div>
            <div style={{ color: C.faint, fontSize: 10, fontFamily: FONT_MONO, textTransform: "uppercase", letterSpacing: 0.7 }}>
              preço na análise
            </div>
            <div style={{ color: C.ink, fontSize: 22, fontFamily: FONT_MONO, fontWeight: 700, marginTop: 3, letterSpacing: 0.3 }}>
              {s.preco}
            </div>
          </div>
          <div style={{ color: C.faint, fontSize: 11.5, fontFamily: FONT_MONO, textAlign: "right", lineHeight: 1.4 }}>
            {s.carimbo}
          </div>
        </div>
      )}

      {/* tipo do evento + nota */}
      <div style={{ color: accent, fontSize: 12.5, fontFamily: FONT_MONO, marginTop: 14, letterSpacing: 0.4 }}>
        {s.tipo.toUpperCase()}
      </div>
      <div style={{ color: C.ink, fontSize: 15, lineHeight: 1.55, marginTop: 7, fontFamily: FONT_BODY }}>
        {s.nota}
      </div>

      {/* ---------- VARIAÇÃO DE FECHAMENTO: curto vs longo ---------- */}
      {s.variacao && (
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <ReguaVar titulo="Curto prazo" cor={C.amber}
            itens={[["Dia", s.variacao.d], ["Semana", s.variacao.s]]} />
          <ReguaVar titulo="Longo prazo" cor={C.steel}
            itens={[["Mês", s.variacao.m], ["Ano", s.variacao.a]]} />
        </div>
      )}

      {/* faixa de operação (sempre) + funding quando houver */}
      {(s.faixa || s.dado) && (
        <div style={{
          display: "flex", gap: 24, marginTop: 12, padding: "11px 14px",
          background: C.panel2, border: `1px solid ${C.lineSoft}`, borderRadius: 8,
        }}>
          {s.faixa && <Nivel rotulo="faixa de operação" valor={s.faixa} cor={C.ink} />}
          {s.dado && <Nivel rotulo="funding atual" valor={s.dado} cor={C.up} />}
        </div>
      )}

      {/* ---------- NÍVEIS: micro (curto) e macro (longo) em painéis ---------- */}
      {(s.micro || s.macro) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          {s.micro && (
            <PainelNiveis titulo="Curto prazo · tempo do sinal" cor={C.amber} n={s.micro} />
          )}
          {s.macro && (
            <PainelNiveis titulo="Longo prazo · quadro maior" cor={C.steel} n={s.macro} />
          )}
        </div>
      )}
    </div>
  );
}

function ReguaVar({ titulo, cor, itens }) {
  return (
    <div style={{
      flex: 1, background: C.panel2, border: `1px solid ${C.lineSoft}`,
      borderTop: `2px solid ${cor}`, borderRadius: 8, padding: "9px 4px 10px",
    }}>
      <div style={{
        color: cor, fontSize: 9.5, fontFamily: FONT_MONO, letterSpacing: 0.8,
        textTransform: "uppercase", textAlign: "center", marginBottom: 8,
      }}>{titulo}</div>
      <div style={{ display: "flex" }}>
        {itens.map(([k, v], i) => {
          const up = !String(v).startsWith("-");
          return (
            <div key={k} style={{
              flex: 1, textAlign: "center",
              borderLeft: i === 0 ? "none" : `1px solid ${C.line}`,
            }}>
              <div style={{ color: C.faint, fontSize: 10, fontFamily: FONT_BODY }}>{k}</div>
              <div style={{ color: up ? C.up : C.down, fontSize: 15, fontFamily: FONT_MONO, fontWeight: 700, marginTop: 3 }}>
                {up ? "+" : ""}{v}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PainelNiveis({ titulo, cor, n }) {
  return (
    <div style={{
      background: C.panel2, border: `1px solid ${C.lineSoft}`,
      borderLeft: `2px solid ${cor}`, borderRadius: 8, padding: "12px 16px",
    }}>
      <div style={{
        color: cor, fontSize: 10, fontFamily: FONT_MONO, letterSpacing: 0.8,
        textTransform: "uppercase", marginBottom: 12,
      }}>
        {titulo}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 12px" }}>
        {n.res && <Nivel rotulo="resistência" valor={n.res} cor={C.down} />}
        {n.sup && <Nivel rotulo="suporte" valor={n.sup} cor={C.up} />}
        {n.topo && <Nivel rotulo="topo" valor={n.topo} cor={C.dim} />}
        {n.fundo && <Nivel rotulo="fundo" valor={n.fundo} cor={C.dim} />}
      </div>
    </div>
  );
}

function Nivel({ rotulo, valor, cor }) {
  return (
    <div>
      <div style={{ color: C.faint, fontSize: 10.5, fontFamily: FONT_MONO, textTransform: "uppercase", letterSpacing: 0.6 }}>{rotulo}</div>
      <div style={{ color: cor, fontSize: 17, fontFamily: FONT_MONO, fontWeight: 600, marginTop: 3 }}>{valor}</div>
    </div>
  );
}

function App() {
  const [aba, setAba] = useState("radar");
  const [filtro, setFiltro] = useState("todos");
  const [instalar, setInstalar] = useState(true);

  // dados vivos: começam com os exemplos, e são substituídos pelos reais
  // assim que o backend responde. Se o backend estiver fora, mantém exemplos.
  const [sinais, setSinais] = useState(SINAIS_EXEMPLO);
  const [briefing, setBriefing] = useState(BRIEFING_EXEMPLO);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!API_BASE) return; // sem backend configurado: fica nos exemplos
    let ativo = true;

    async function carregar() {
      try {
        const rc = await fetch(`${API_BASE}/api/cards?limite=40`);
        if (rc.ok) {
          const dados = await rc.json();
          if (ativo && Array.isArray(dados) && dados.length) {
            // garante um id para a key do React
            setSinais(dados.map((c, i) => ({ id: c.id ?? i + 1, ...c })));
            setOnline(true);
          }
        }
        const rb = await fetch(`${API_BASE}/api/briefing`);
        if (rb.ok) {
          const b = await rb.json();
          if (ativo && Array.isArray(b) && b.length) {
            setBriefing({ data: b[0].criado_em, texto: b[0].texto });
          }
        }
      } catch (e) {
        // backend indisponível: silenciosamente mantém os exemplos
      }
    }

    carregar();
    const t = setInterval(carregar, 60000); // atualiza a cada minuto
    return () => { ativo = false; clearInterval(t); };
  }, []);

  const sinaisFiltrados = sinais.filter(s =>
    filtro === "todos" ? true : s.classe === filtro
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT_BODY, color: C.ink }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 90 }}>

        {/* cabeçalho */}
        <header style={{
          padding: "20px 20px 16px", borderBottom: `1px solid ${C.line}`,
          position: "sticky", top: 0, background: C.bg, zIndex: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: -0.3 }}>
                Projeto <span style={{ color: C.amber }}>Ativos</span>
              </div>
              <div style={{ color: C.faint, fontSize: 11, fontFamily: FONT_MONO, marginTop: 2 }}>
                {online ? "scanner ao vivo" : "modo demonstração"} · {AGORA}
              </div>
            </div>
            <div style={{
              width: 9, height: 9, borderRadius: "50%",
              background: online ? C.up : C.faint,
              boxShadow: online ? `0 0 10px ${C.up}` : "none", marginTop: 4,
            }} title={online ? "scanner ao vivo" : "aguardando backend"} />
          </div>
        </header>

        {/* banner de instalação (PWA) */}
        {instalar && (
          <div style={{
            margin: "14px 16px 0", background: C.panel2, border: `1px solid ${C.line}`,
            borderRadius: 8, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center",
          }}>
            <div style={{ fontSize: 20 }}>📲</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Instale na tela de início</div>
              <div style={{ color: C.dim, fontSize: 11.5, marginTop: 2, lineHeight: 1.4 }}>
                Toque em Compartilhar → "Adicionar à Tela de Início" para receber os alertas como app.
              </div>
            </div>
            <button onClick={() => setInstalar(false)} style={{
              background: "none", border: "none", color: C.faint, fontSize: 18, cursor: "pointer",
            }}>×</button>
          </div>
        )}

        {aba === "radar" && (
          <div style={{ padding: "16px 16px 0" }}>
            {/* filtros por classe */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["todos","Todos"],["cripto","Cripto"],["acao","Ações"]].map(([k,label]) => (
                <button key={k} onClick={() => setFiltro(k)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 6, cursor: "pointer",
                  fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
                  background: filtro === k ? C.amber : C.panel,
                  color: filtro === k ? C.bg : C.dim,
                  border: `1px solid ${filtro === k ? C.amber : C.line}`,
                }}>{label}</button>
              ))}
            </div>
            {sinaisFiltrados.map(s => <SinalCard key={s.id} s={s} />)}

            {/* disclaimer fixo do rodapé da lista */}
            <div style={{
              background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 8,
              padding: "14px 16px", marginTop: 6, marginBottom: 8,
            }}>
              <div style={{ color: C.amber, fontSize: 10.5, fontFamily: FONT_MONO, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Aviso importante
              </div>
              <div style={{ color: C.dim, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>
                As variações de fechamento e os níveis de resistência, suporte, topo e fundo
                (macro e micro) são <b style={{ color: C.ink }}>dados de mercado e leituras do gráfico</b> —
                descrevem o que o preço já fez, não são instruções de compra ou venda. Todo o conteúdo é
                gerado automaticamente por regras de análise técnica, de forma genérica e não personalizada,
                com finalidade informativa e educacional. <b style={{ color: C.ink }}>Não constitui recomendação
                de investimento</b> nem consultoria de valores mobiliários (CVM). As decisões e a gestão de
                risco são de inteira responsabilidade do usuário. Rentabilidade passada não garante
                resultados futuros.
              </div>
            </div>
          </div>
        )}

        {aba === "briefing" && (
          <div style={{ padding: "20px 18px 0" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>Briefing do dia</div>
            <div style={{ color: C.faint, fontSize: 12, fontFamily: FONT_MONO, marginTop: 3 }}>{briefing.data}</div>
            <div style={{
              marginTop: 16, background: C.panel, border: `1px solid ${C.line}`,
              borderLeft: `3px solid ${C.amber}`, borderRadius: 8, padding: "18px 20px",
            }}>
              <div style={{ color: C.dim, fontSize: 10.5, fontFamily: FONT_MONO, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Gerado por IA · leitura de condições de mercado
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: C.ink, margin: 0, fontFamily: FONT_BODY }}>
                {briefing.texto}
              </p>
            </div>
            <div style={{ color: C.faint, fontSize: 11, lineHeight: 1.5, marginTop: 14, padding: "0 4px" }}>
              O briefing descreve o estado do mercado. Não é recomendação de compra ou venda.
            </div>
          </div>
        )}

        {aba === "ativos" && (
          <div style={{ padding: "20px 18px 0" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 }}>Ativos no radar</div>
            <div style={{ color: C.dim, fontSize: 13, marginTop: 5, fontFamily: FONT_BODY, lineHeight: 1.5 }}>
              O scanner acompanha estes ativos nos tempos gráficos de 4h, diário e semanal.
              As ações seguem a tese da revolução da IA — dos chips à energia que a alimenta.
            </div>

            <SecaoAtivos titulo="Cripto" cor={C.amber} itens={ATIVOS_CRIPTO} sufixo="/USDT" />

            <div style={{
              marginTop: 26, marginBottom: 4, fontFamily: FONT_DISPLAY,
              fontSize: 16, fontWeight: 700, color: C.ink,
            }}>
              Ações · por tese
            </div>
            {TESES_ACOES.map(t => (
              <SecaoAtivos key={t.tese} titulo={t.tese} cor={C.steel} itens={t.itens} sufixo="" />
            ))}
          </div>
        )}

        {aba === "conta" && (
          <div style={{ padding: "20px 18px 0" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 }}>Sua assinatura</div>

            {/* assinatura atual */}
            <div style={{
              marginTop: 16, background: C.panel, border: `1px solid ${C.line}`,
              borderLeft: `3px solid ${C.up}`, borderRadius: 10, padding: 18,
            }}>
              <Linha k="Plano atual" v="Mensal" />
              <Linha k="Status" v="Ativa" cor={C.up} />
              <Linha k="Renova em" v="2 ago 2026" />
              <Linha k="Alertas recebidos" v="128 este mês" />
            </div>

            {/* planos disponíveis */}
            <div style={{ marginTop: 24, fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700 }}>
              Planos
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <PlanoCard
                nome="Semanal" preco="14,99" periodo="por semana"
                obs="Ideal para experimentar" cor={C.steel} destaque={false}
              />
              <PlanoCard
                nome="Mensal" preco="49,99" periodo="por mês"
                obs="Melhor custo-benefício" cor={C.amber} destaque
              />
            </div>
            <div style={{ color: C.faint, fontSize: 11.5, lineHeight: 1.5, marginTop: 10, padding: "0 2px" }}>
              O mensal equivale a R$ 12,50/semana — mais econômico que o semanal avulso.
              Renovação automática; cancele quando quiser. Direito de arrependimento de 7 dias
              conforme o Código de Defesa do Consumidor.
            </div>

            {/* notificações */}
            <div style={{
              marginTop: 22, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 18,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Notificações</div>
              <Toggle label="Sinais de cripto" on />
              <Toggle label="Leituras de ações" on />
              <Toggle label="Briefing diário (8h)" on />
              <Toggle label="Funding extremo" on={false} />
            </div>
          </div>
        )}
      </div>

      {/* navegação inferior */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: C.panel,
        borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "center",
      }}>
        <div style={{ display: "flex", width: "100%", maxWidth: 480 }}>
          {[
            ["radar","Radar","◎"],
            ["briefing","Briefing","☰"],
            ["ativos","Ativos","⊞"],
            ["conta","Conta","○"],
          ].map(([k,label,ic]) => (
            <button key={k} onClick={() => setAba(k)} style={{
              flex: 1, padding: "11px 0 14px", background: "none", border: "none", cursor: "pointer",
              color: aba === k ? C.amber : C.faint, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3,
            }}>
              <span style={{ fontSize: 18 }}>{ic}</span>
              <span style={{ fontSize: 10.5, fontFamily: FONT_BODY, fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SecaoAtivos({ titulo, cor, itens, sufixo }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{
        fontSize: 11, fontFamily: FONT_MONO, color: cor, textTransform: "uppercase",
        letterSpacing: 0.6, marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cor }} />
        {titulo} · {itens.length}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {itens.map(a => (
          <span key={a} style={{
            fontFamily: FONT_MONO, fontSize: 12.5, color: C.ink, background: C.panel,
            border: `1px solid ${C.line}`, padding: "5px 10px", borderRadius: 5,
          }}>{a}<span style={{ color: C.faint }}>{sufixo}</span></span>
        ))}
      </div>
    </div>
  );
}

function PlanoCard({ nome, preco, periodo, obs, cor, destaque }) {
  return (
    <div style={{
      flex: 1, background: destaque ? `${cor}10` : C.panel,
      border: `1px solid ${destaque ? cor : C.line}`,
      borderRadius: 10, padding: "16px 14px", position: "relative",
    }}>
      {destaque && (
        <div style={{
          position: "absolute", top: -9, right: 12, background: cor, color: C.bg,
          fontSize: 9.5, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: 0.5,
          padding: "2px 8px", borderRadius: 4, textTransform: "uppercase",
        }}>Recomendado</div>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: FONT_BODY }}>{nome}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 8 }}>
        <span style={{ color: C.faint, fontSize: 13, fontFamily: FONT_MONO }}>R$</span>
        <span style={{ color: cor, fontSize: 26, fontWeight: 700, fontFamily: FONT_MONO }}>{preco}</span>
      </div>
      <div style={{ color: C.faint, fontSize: 11, fontFamily: FONT_MONO, marginTop: 2 }}>{periodo}</div>
      <div style={{ color: C.dim, fontSize: 11.5, marginTop: 10, fontFamily: FONT_BODY, lineHeight: 1.4 }}>{obs}</div>
      <button style={{
        width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 7, cursor: "pointer",
        background: destaque ? cor : "transparent", color: destaque ? C.bg : cor,
        border: `1px solid ${cor}`, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
      }}>Assinar</button>
    </div>
  );
}

function Linha({ k, v, cor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13.5 }}>
      <span style={{ color: C.dim }}>{k}</span>
      <span style={{ color: cor || C.ink, fontFamily: FONT_MONO, fontWeight: 600 }}>{v}</span>
    </div>
  );
}

function Toggle({ label, on }) {
  const [v, setV] = useState(on);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" }}>
      <span style={{ fontSize: 13, color: C.ink }}>{label}</span>
      <button onClick={() => setV(!v)} style={{
        width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: v ? C.up : C.line, position: "relative", transition: "background .2s",
      }}>
        <span style={{
          position: "absolute", top: 3, left: v ? 21 : 3, width: 18, height: 18,
          borderRadius: "50%", background: "#fff", transition: "left .2s",
        }} />
      </button>
    </div>
  );
}

export default App;
