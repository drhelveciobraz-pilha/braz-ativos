import React, { useState, useEffect, useCallback, useRef } from "react";

/* =========================================================================
   BRAZ ATIVOS — SINAIS (uso pessoal)
   Motor CRSI de ações. Varredura 10h30/14h30/18h30/22h30 (seg-sex),
   leitura sempre no timeframe diário. Botão "rodar agora" dispara na hora.
   ========================================================================= */

const API_BASE = "https://grandkid-outsider-dwindling.ngrok-free.dev";

const C = {
  bg: "#0B0F15",
  panel: "#141B24",
  panel2: "#1A2330",
  line: "#242E3B",
  ink: "#F1F4F9",
  dim: "#8B98AA",
  faint: "#546376",
  gold: "#F0C35A",
  steel: "#6BA6D8",
  green: "#3CD68C",
  red: "#E5655F",
};

const fonts =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const fmt = (n) =>
  n == null ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

const fmtData = (iso) => {
  if (!iso) return "—";
  const [ano, mes, dia] = String(iso).split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
};

const fmtHora = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const corConf = (crsi) => (crsi <= 5 ? C.green : crsi <= 12 ? C.gold : C.dim);

const box = {
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: 16,
  padding: 16,
  marginBottom: 10,
};

const rotuloMotivo = {
  fechou_alvo: "bateu alvo",
  fechou_stop: "bateu stop",
  fechou_tempo: "venceu prazo",
};

// Barra visual do CRSI — quanto mais perto de 0 (fundo), mais verde.
function BarraCRSI({ crsi, compacta = false }) {
  const pos = Math.max(0, Math.min(100, crsi));
  const cor = corConf(crsi);
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          position: "relative",
          height: compacta ? 5 : 6,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${C.green}, ${C.gold} 14%, ${C.line} 45%, ${C.line} 100%)`,
          opacity: 0.95,
        }}
      >
        <div style={{ position: "absolute", left: "2%", top: -2, bottom: -2, width: 1, background: C.faint, opacity: 0.5 }} />
        <div
          style={{
            position: "absolute", top: "50%", left: `${pos}%`,
            transform: "translate(-50%, -50%)",
            width: compacta ? 9 : 13, height: compacta ? 9 : 13,
            borderRadius: "50%", background: C.ink,
            border: `2px solid ${C.bg}`,
            boxShadow: `0 0 0 1.5px ${cor}, 0 0 8px ${cor}`,
            transition: "left 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

// ---- ícone de spinner simples, via CSS (sem dependência externa) ----
function Spinner({ cor = C.gold, tamanho = 14 }) {
  return (
    <span
      style={{
        display: "inline-block", width: tamanho, height: tamanho,
        border: `2px solid ${cor}33`, borderTopColor: cor,
        borderRadius: "50%", animation: "girar 0.7s linear infinite",
      }}
    />
  );
}

// ---------------------------------------------------------------------
// Hook central: controla a varredura (status, disparo, contagem de versão
// pra forçar as abas a recarregarem os dados quando termina)
// ---------------------------------------------------------------------
function useVarredura() {
  const [status, setStatus] = useState({ rodando: false, ultima_execucao: null, ultimo_erro: null });
  const [versao, setVersao] = useState(0);
  const rodandoAntes = useRef(false);

  const consultarStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/admin/status`);
      const s = await r.json();
      setStatus(s);
      return s;
    } catch {
      return null;
    }
  }, []);

  // TODO aparelho que tiver o app aberto fica checando sozinho, de 5 em 5s --
  // não depende de ter sido ele quem apertou "rodar agora". O status real
  // mora no servidor; cada tela só espelha ele.
  useEffect(() => {
    consultarStatus();
    const t = setInterval(consultarStatus, 5000);
    return () => clearInterval(t);
  }, [consultarStatus]);

  // quando a varredura passa de "rodando" pra "parada", essa tela específica
  // recarrega os dados sozinha (funciona em qualquer aparelho, não só no
  // que clicou o botão)
  useEffect(() => {
    if (rodandoAntes.current && !status.rodando) {
      setVersao((v) => v + 1);
    }
    rodandoAntes.current = status.rodando;
  }, [status.rodando]);

  const rodarAgora = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/admin/rodar_agora`);
      const j = await r.json();
      if (j.ok) {
        setStatus((s) => ({ ...s, rodando: true }));
      }
    } catch {}
  }, []);

  const forcarAtualizacao = useCallback(() => setVersao((v) => v + 1), []);

  return { status, versao, rodarAgora, forcarAtualizacao };
}

export default function App() {
  const [aba, setAba] = useState("top5");
  const { status, versao, rodarAgora, forcarAtualizacao } = useVarredura();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: fonts }}>
      <style>{`
        @keyframes girar { to { transform: rotate(360deg); } }
        @keyframes pulsar { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        button:active { transform: scale(0.97); }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 14px 40px" }}>
        {/* ---------- cabeçalho ---------- */}
        <header style={{ paddingTop: 24, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6 }}>Braz</span>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6, color: C.gold }}>Ativos</span>
          </div>
          <div style={{ fontSize: 12.5, color: C.dim, marginTop: 2 }}>
            Sinais CRSI · ações · uso pessoal
          </div>
        </header>

        {/* ---------- barra de varredura (sempre visível) ---------- */}
        <div
          style={{
            ...box,
            marginBottom: 14,
            background: `linear-gradient(135deg, ${C.panel2}, ${C.panel})`,
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <div
            style={{
              width: 9, height: 9, borderRadius: "50%",
              background: status.rodando ? C.gold : C.green,
              boxShadow: `0 0 8px ${status.rodando ? C.gold : C.green}`,
              animation: status.rodando ? "pulsar 1s ease infinite" : "none",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>
              {status.rodando ? "Varrendo ~895 ativos…" : "Motor em dia"}
            </div>
            <div style={{ fontSize: 10.5, color: C.faint }}>
              {status.rodando
                ? "pode levar alguns minutos"
                : status.ultima_execucao
                ? `última varredura às ${fmtHora(status.ultima_execucao)}`
                : "ainda não rodou nesta sessão"}
            </div>
          </div>
          <button
            onClick={rodarAgora}
            disabled={status.rodando}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 10, border: "none",
              background: status.rodando ? C.line : C.gold,
              color: status.rodando ? C.faint : "#1A1608",
              fontSize: 12.5, fontWeight: 700, cursor: status.rodando ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {status.rodando ? <Spinner cor={C.faint} /> : "⚡"}
            {status.rodando ? "rodando" : "rodar agora"}
          </button>
        </div>
        {status.ultimo_erro && (
          <div style={{ ...box, borderColor: C.red + "55", color: C.red, fontSize: 11.5, padding: 10 }}>
            última varredura falhou: {status.ultimo_erro}
          </div>
        )}

        {/* ---------- abas ---------- */}
        <div style={{ display: "flex", gap: 6, margin: "0 0 6px", flexWrap: "wrap" }}>
          {[
            ["top5", "Top 5"],
            ["posicoes", "Posições"],
            ["todos", "Todos os ativos"],
            ["historico", "Histórico"],
          ].map(([k, label]) => {
            const on = aba === k;
            return (
              <button
                key={k}
                onClick={() => setAba(k)}
                style={{
                  flex: "1 1 auto", minWidth: 90, padding: "10px 0",
                  borderRadius: 11,
                  border: `1px solid ${on ? C.gold : C.line}`,
                  background: on ? "rgba(240,195,90,0.12)" : "transparent",
                  color: on ? C.gold : C.dim,
                  fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 10, color: C.faint, lineHeight: 1.5, margin: "8px 2px 16px" }}>
          CRSI(2,2,100) · alvo trailing (topo 2 barras) · stop −5% · 10 dias · sem MA200
          <br />~900 ações (S&P 500 + S&P 400) · leitura diária
        </div>

        {aba === "top5" && <Top5 versao={versao} aoConfirmar={forcarAtualizacao} />}
        {aba === "posicoes" && <Posicoes versao={versao} />}
        {aba === "todos" && <TodosAtivos versao={versao} />}
        {aba === "historico" && <Historico versao={versao} />}
      </div>
    </div>
  );
}

function useFetch(caminho, versao) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const buscar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await fetch(`${API_BASE}${caminho}`);
      setDados(await r.json());
    } catch {
      setDados(null);
    }
    setCarregando(false);
  }, [caminho]);

  useEffect(() => { buscar(); }, [buscar, versao]);
  return { dados, carregando, recarregar: buscar };
}

function BotaoAtualizar({ onClick, carregando }) {
  return (
    <button onClick={onClick} disabled={carregando}
      style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11,
               padding: "7px 12px", borderRadius: 9, border: `1px solid ${C.line}`,
               background: "transparent", color: C.dim, marginBottom: 12, cursor: "pointer" }}>
      {carregando ? <Spinner tamanho={11} cor={C.dim} /> : "↻"} atualizar tela
    </button>
  );
}

function EstadoVazio({ icone, texto }) {
  return (
    <div style={{ ...box, textAlign: "center", padding: "32px 16px", color: C.dim }}>
      <div style={{ fontSize: 26, marginBottom: 8, opacity: 0.6 }}>{icone}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{texto}</div>
    </div>
  );
}

function Top5({ versao, aoConfirmar }) {
  const { dados, carregando, recarregar } = useFetch("/api/top5", versao);
  const [confirmando, setConfirmando] = useState(null);
  const [confirmados, setConfirmados] = useState({});

  async function confirmarEntrada(s) {
    setConfirmando(s.ativo);
    try {
      const r = await fetch(`${API_BASE}/api/confirmar_entrada`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ativo: s.ativo, preco_entrada: s.preco_entrada,
          alvo: s.alvo, stop: s.stop, data: s.data,
        }),
      });
      const j = await r.json();
      if (j.ok) {
        setConfirmados((c) => ({ ...c, [s.ativo]: true }));
        aoConfirmar?.(); // avisa o app: tem posição nova, atualiza a aba Posições
      } else {
        alert(j.mensagem);
      }
    } catch {
      alert("Não consegui confirmar — backend fora do ar?");
    }
    setConfirmando(null);
  }

  return (
    <div>
      <BotaoAtualizar onClick={recarregar} carregando={carregando} />
      {!dados?.top?.length ? (
        <EstadoVazio icone="🎯" texto="Nenhum sinal ainda nesta varredura. Volta depois de rodar de novo." />
      ) : (
        <>
          <div style={{ fontSize: 11, color: C.faint, margin: "0 2px 10px" }}>
            {dados.total_sinais_hoje} sinais no total · os {dados.top.length} mais extremos
          </div>
          {dados.top.map((s) => {
            const jaConfirmado = confirmados[s.ativo];
            return (
              <div key={s.ativo} style={{ ...box, borderColor: corConf(s.crsi) + "55" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <b style={{ fontSize: 17 }}>{s.ativo}</b>
                  <span style={{ color: corConf(s.crsi), fontWeight: 800, fontSize: 12.5 }}>CRSI {s.crsi}</span>
                </div>
                <div style={{ marginBottom: 12 }}><BarraCRSI crsi={s.crsi} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 12.5, marginBottom: 12 }}>
                  <div>entrada<br /><b style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(s.preco_entrada)}</b></div>
                  <div>alvo<br /><b style={{ color: C.green, fontVariantNumeric: "tabular-nums" }}>${fmt(s.alvo)}</b></div>
                  <div>stop<br /><b style={{ color: C.red, fontVariantNumeric: "tabular-nums" }}>${fmt(s.stop)}</b></div>
                </div>
                <button
                  onClick={() => confirmarEntrada(s)}
                  disabled={jaConfirmado || confirmando === s.ativo}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
                    background: jaConfirmado ? "rgba(60,214,140,0.15)" : C.green,
                    color: jaConfirmado ? C.green : "#0A2318",
                    fontSize: 12.5, fontWeight: 700,
                    cursor: jaConfirmado ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {confirmando === s.ativo ? <Spinner cor="#0A2318" /> : jaConfirmado ? "✓" : "✅"}
                  {jaConfirmado ? "confirmado — acompanhando" : confirmando === s.ativo ? "confirmando..." : "entrei long nesse"}
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function Posicoes({ versao }) {
  const { dados, carregando, recarregar } = useFetch("/api/posicoes_abertas", versao);
  const entradas = dados ? Object.entries(dados) : [];

  return (
    <div>
      <BotaoAtualizar onClick={recarregar} carregando={carregando} />
      {entradas.length === 0 ? (
        <EstadoVazio icone="📭" texto="Nenhuma posição aberta agora." />
      ) : (
        <>
          <div style={{ fontSize: 11, color: C.faint, margin: "0 2px 10px" }}>
            {entradas.length} posição(ões) aberta(s)
          </div>
          {entradas.map(([ativo, p]) => {
            const alvoMoveu = p.alvo_inicial !== p.alvo_atual;
            const diasCor = p.dias_abertos >= 8 ? C.red : p.dias_abertos >= 5 ? C.gold : C.dim;
            const pctPrazo = Math.min(100, ((p.dias_abertos ?? 0) / 10) * 100);
            return (
              <div key={ativo} style={box}>
                <b style={{ fontSize: 17 }}>{ativo}</b>

                <div style={{ margin: "10px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 4 }}>
                    <span style={{ color: C.faint, letterSpacing: 0.3 }}>PRAZO</span>
                    <span style={{ color: diasCor, fontWeight: 700 }}>dia {p.dias_abertos ?? "?"} de 10</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: C.line, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${pctPrazo}%`, background: diasCor, transition: "width 0.3s ease" }} />
                  </div>
                </div>

                <div style={{ fontSize: 10.5, color: C.faint, marginBottom: 8 }}>
                  entrada em {fmtData(p.data_entrada)} · ${fmt(p.preco_entrada)}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12.5,
                              background: C.bg, borderRadius: 10, padding: 10 }}>
                  <div>
                    <div style={{ color: C.faint, fontSize: 10 }}>alvo inicial</div>
                    <b style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(p.alvo_inicial)}</b>
                  </div>
                  <div>
                    <div style={{ color: C.faint, fontSize: 10 }}>alvo atual {alvoMoveu ? "· caminhou" : "· parado"}</div>
                    <b style={{ color: C.green, fontVariantNumeric: "tabular-nums" }}>${fmt(p.alvo_atual)}</b>
                  </div>
                </div>

                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: C.faint, fontSize: 10 }}>stop (fixo)</span>
                  <b style={{ color: C.red, fontVariantNumeric: "tabular-nums" }}>${fmt(p.stop)}</b>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function TodosAtivos({ versao }) {
  const { dados, carregando, recarregar } = useFetch("/api/todos_ativos", versao);
  return (
    <div>
      <BotaoAtualizar onClick={recarregar} carregando={carregando} />
      {!dados?.ativos?.length ? (
        <EstadoVazio icone="📡" texto="Ainda sem dado — roda a varredura primeiro." />
      ) : (
        <div style={box}>
          <div style={{ fontSize: 11, color: C.faint, marginBottom: 12 }}>
            {dados.ativos.length} ativos · quanto mais verde, mais perto de virar sinal Top 5
          </div>
          {dados.ativos.map((a) => (
            <div key={a.ativo} style={{ padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <b style={{ fontSize: 12.5 }}>{a.ativo}</b>
                  {a.em_posicao && (
                    <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 6,
                                    background: "rgba(107,166,216,0.15)", color: C.steel, fontWeight: 700 }}>
                      ABERTO
                    </span>
                  )}
                </span>
                <span style={{ display: "flex", gap: 10, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: C.dim }}>${fmt(a.preco)}</span>
                  <span style={{ color: corConf(a.crsi), width: 32, textAlign: "right", fontWeight: 700 }}>{a.crsi}</span>
                </span>
              </div>
              <BarraCRSI crsi={a.crsi} compacta />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Historico({ versao }) {
  const { dados, carregando, recarregar } = useFetch("/api/historico", versao);
  const s = dados?.stats;

  return (
    <div>
      <BotaoAtualizar onClick={recarregar} carregando={carregando} />
      {!s ? (
        <EstadoVazio icone="📜" texto="Nenhum trade fechado ainda. Assim que um sinal bater alvo, stop ou vencer o prazo, ele entra aqui." />
      ) : (
        <>
          <div style={box}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>{s.acerto_pct}%</div>
                <div style={{ fontSize: 9.5, color: C.faint, letterSpacing: 0.3 }}>ACERTO</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{s.n}</div>
                <div style={{ fontSize: 9.5, color: C.faint, letterSpacing: 0.3 }}>TRADES</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.retorno_total >= 0 ? C.green : C.red }}>
                  {s.retorno_total > 0 ? "+" : ""}{s.retorno_total}%
                </div>
                <div style={{ fontSize: 9.5, color: C.faint, letterSpacing: 0.3 }}>SOMA</div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: C.dim, marginTop: 12, textAlign: "center",
                          paddingTop: 10, borderTop: `1px dashed ${C.line}` }}>
              médio {s.retorno_medio > 0 ? "+" : ""}{s.retorno_medio}% · melhor +{s.melhor}% · pior {s.pior}%
            </div>
            <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6, textAlign: "center" }}>
              {Object.entries(s.por_motivo).map(([m, n]) => `${rotuloMotivo[m] || m}: ${n}`).join(" · ")}
            </div>
          </div>

          <div style={{ fontSize: 10, color: C.faint, margin: "0 2px 14px", lineHeight: 1.4 }}>
            Referência do backtest (2 anos, ~900 ativos): 63% acerto, +0,27%/trade em
            média. Se o real destoar muito com amostra de 30+ trades, é sinal de
            rever limite/stop/dias.
          </div>

          <div style={{ fontSize: 11.5, color: C.faint, fontWeight: 700, letterSpacing: 0.3, margin: "0 2px 8px" }}>
            TODOS OS TRADES FECHADOS
          </div>
          {dados.trades.map((t, i) => (
            <div key={i} style={{ ...box, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b style={{ fontSize: 13.5 }}>{t.ativo}</b>
                <div style={{ fontSize: 10.5, color: C.faint }}>
                  {fmtData(t.data_fechamento)} · {rotuloMotivo[t.tipo] || t.tipo}
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.retorno_pct >= 0 ? C.green : C.red,
                             fontVariantNumeric: "tabular-nums" }}>
                {t.retorno_pct > 0 ? "+" : ""}{t.retorno_pct}%
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
