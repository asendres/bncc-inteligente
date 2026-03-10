import React, { useState, useEffect, useRef } from "react";

const etapasEscolares = [
  { label: "Educação Infantil – Bebês (0 a 1 ano e 6 meses)", value: "bebe", cor: "#f97316" },
  { label: "Educação Infantil – Crianças bem pequenas (1a7m a 3a11m)", value: "crianca_pequena", cor: "#f97316" },
  { label: "Educação Infantil – Crianças pequenas (4 a 5 anos e 11 meses)", value: "crianca_pre", cor: "#f97316" },
  { label: "Ensino Fundamental I – 1º ano (6 anos)", value: "ef1", cor: "#3b82f6" },
  { label: "Ensino Fundamental I – 2º ano (7 anos)", value: "ef2", cor: "#3b82f6" },
  { label: "Ensino Fundamental I – 3º ano (8 anos)", value: "ef3", cor: "#3b82f6" },
  { label: "Ensino Fundamental I – 4º ano (9 anos)", value: "ef4", cor: "#3b82f6" },
  { label: "Ensino Fundamental I – 5º ano (10 anos)", value: "ef5", cor: "#3b82f6" },
  { label: "Ensino Fundamental II – 6º ano (11 anos)", value: "ef6", cor: "#8b5cf6" },
  { label: "Ensino Fundamental II – 7º ano (12 anos)", value: "ef7", cor: "#8b5cf6" },
  { label: "Ensino Fundamental II – 8º ano (13 anos)", value: "ef8", cor: "#8b5cf6" },
  { label: "Ensino Fundamental II – 9º ano (14 anos)", value: "ef9", cor: "#8b5cf6" },
  { label: "Ensino Médio – 1ª série (15 anos)", value: "em1", cor: "#10b981" },
  { label: "Ensino Médio – 2ª série (16 anos)", value: "em2", cor: "#10b981" },
  { label: "Ensino Médio – 3ª série (17 anos)", value: "em3", cor: "#10b981" },
];

const areas = [
  "Todas as áreas", "Linguagens", "Matemática",
  "Ciências da Natureza", "Ciências Humanas", "Ensino Religioso",
];

const etapaGrupos = [
  { label: "Ed. Infantil", cor: "#f97316", icon: "🌱" },
  { label: "Fund. I", cor: "#3b82f6", icon: "📗" },
  { label: "Fund. II", cor: "#8b5cf6", icon: "📘" },
  { label: "Médio", cor: "#10b981", icon: "🎓" },
];

const STORAGE_KEY = "bncc_historico";

interface HistoricoItem {
  timestamp: number;
  atividade: string;
  etapa: string;
  etapaCor: string;
  area: string;
  resultado: string;
}

export default function BNCCApp() {
  const [tab, setTab] = useState("busca");
  const [atividade, setAtividade] = useState("");
  const [etapa, setEtapa] = useState("");
  const [area, setArea] = useState("Todas as áreas");
  const [resultado, setResultado] = useState<HistoricoItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [selectedHistorico, setSelectedHistorico] = useState<HistoricoItem | null>(null);
  const [searchHistorico, setSearchHistorico] = useState("");
  const resultadoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistorico(JSON.parse(stored));
    } catch {}
  }, []);

  function salvarHistorico(item: HistoricoItem) {
    try {
      const novo = [item, ...historico];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novo));
      setHistorico(novo);
    } catch {}
  }

  function deletarItem(timestamp: number) {
    try {
      const novo = historico.filter(h => h.timestamp !== timestamp);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novo));
      setHistorico(novo);
      if (selectedHistorico?.timestamp === timestamp) setSelectedHistorico(null);
    } catch {}
  }

  const etapaLabel = etapasEscolares.find(f => f.value === etapa)?.label || "";
  const etapaCor = etapasEscolares.find(f => f.value === etapa)?.cor || "#3b82f6";

  async function buscar() {
    if (!atividade.trim() || !etapa) return;
    setLoading(true);
    setResultado(null);

    const areaFiltro = area !== "Todas as áreas" ? `Foco na área: ${area}.` : "";
    const prompt = `Você é um especialista em educação e na Base Nacional Comum Curricular (BNCC) do Brasil.

O professor quer trabalhar a seguinte atividade ou objetivo:
"${atividade}"

Etapa Escolar: ${etapaLabel}
${areaFiltro}

Sua tarefa:
1. Identifique as habilidades da BNCC mais relevantes para essa atividade e etapa escolar.
2. Para cada habilidade, forneça:
   - Código da habilidade (ex: EF15LP01, EI03CG01, EM13LGG101)
   - Descrição completa da habilidade conforme a BNCC
   - Área/componente curricular
   - Por que essa habilidade se relaciona com a atividade proposta
3. Sugira também objetivos de aprendizagem alinhados.
4. Se for Educação Infantil, use os Campos de Experiência e objetivos de aprendizagem correspondentes.

Formate a resposta de forma clara e organizada em Markdown. Seja preciso e use os códigos e textos reais da BNCC.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      const texto = data.content?.map((b: any) => b.text || "").join("") || "Sem resposta.";
      const novoItem: HistoricoItem = {
        timestamp: Date.now(), atividade, etapa: etapaLabel, etapaCor, area, resultado: texto
      };
      setResultado(novoItem);
      salvarHistorico(novoItem);
      setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setResultado({ timestamp: 0, atividade: "", etapa: "", etapaCor: "", area: "", resultado: "__erro__" });
    }
    setLoading(false);
  }

  function formatarData(ts: number) {
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function renderMarkdown(text: string) {
    return text
      .replace(/^### (.+)$/gm, '<h3 style="color:#1e40af;font-size:1rem;font-weight:700;margin:1.2rem 0 0.4rem">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color:#1d4ed8;font-size:1.1rem;font-weight:800;margin:1.5rem 0 0.5rem;border-bottom:2px solid #dbeafe;padding-bottom:0.4rem">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="color:#1e3a8a;font-size:1.25rem;font-weight:900;margin:0 0 1rem">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1e40af;font-weight:700">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em style="color:#374151">$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#eff6ff;color:#1d4ed8;padding:0.1rem 0.4rem;border-radius:5px;font-family:monospace;font-size:0.85em;font-weight:600">$1</code>')
      .replace(/^- (.+)$/gm, '<li style="margin:0.3rem 0 0.3rem 1.2rem;color:#374151;list-style:disc">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin:0.6rem 0;color:#374151;line-height:1.75">')
      .replace(/\n/g, '<br/>');
  }

  const filteredHistorico = historico.filter(h =>
    h.atividade?.toLowerCase().includes(searchHistorico.toLowerCase()) ||
    h.etapa?.toLowerCase().includes(searchHistorico.toLowerCase())
  );

  const isErro = resultado?.resultado === "__erro__";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f0f9ff 0%, #fafafa 50%, #f5f3ff 100%)",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#111827"
    }}>
      <div style={{ height: 5, background: "linear-gradient(90deg, #f97316, #eab308, #3b82f6, #8b5cf6, #10b981)" }} />

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 1.2rem 4rem" }}>

        {/* Header */}
        <header style={{ padding: "1.8rem 0 1.4rem", display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" as const }}>
          <div style={{
            width: 50, height: 50, borderRadius: "14px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", flexShrink: 0, boxShadow: "0 4px 14px rgba(59,130,246,0.3)"
          }}>📚</div>
          <div>
            <h1 style={{
              margin: 0, fontSize: "clamp(1.4rem, 4vw, 1.9rem)", fontWeight: 900,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>BNCC Inteligente</h1>
            <p style={{ margin: "0.1rem 0 0", color: "#6b7280", fontSize: "0.85rem" }}>
              Encontre habilidades da BNCC com inteligência artificial
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem", flexWrap: "wrap" as const, justifyContent: "flex-end" }}>
            {etapaGrupos.map(g => (
              <span key={g.label} style={{
                background: g.cor + "18", color: g.cor,
                border: `1px solid ${g.cor}35`, borderRadius: "20px",
                padding: "0.2rem 0.7rem", fontSize: "0.7rem", fontWeight: 700
              }}>{g.icon} {g.label}</span>
            ))}
          </div>
        </header>

        {/* Tabs */}
        <div style={{
          display: "flex", marginBottom: "1.8rem",
          background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: "12px", padding: "0.3rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>
          {[
            { id: "busca", label: "🔍 Nova Busca" },
            { id: "historico", label: `📋 Histórico${historico.length > 0 ? ` (${historico.length})` : ""}` }
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedHistorico(null); }}
              style={{
                flex: 1, padding: "0.6rem 1rem", borderRadius: "9px",
                border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: "0.9rem", fontWeight: 600,
                transition: "all 0.18s",
                background: tab === t.id ? "linear-gradient(135deg, #3b82f6, #6d28d9)" : "transparent",
                color: tab === t.id ? "#fff" : "#6b7280",
                boxShadow: tab === t.id ? "0 2px 8px rgba(59,130,246,0.28)" : "none"
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* BUSCA */}
        {tab === "busca" && (
          <div>
            <div style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: "16px", padding: "1.8rem",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
            }}>
              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  color: "#374151", fontSize: "0.8rem", fontWeight: 700,
                  letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: "0.5rem"
                }}>
                  <span style={{ background: "#eff6ff", color: "#3b82f6", borderRadius: "6px", padding: "0.1rem 0.4rem", fontSize: "0.75rem" }}>✏️</span>
                  Atividade ou Objetivo Pedagógico
                </label>
                <textarea
                  value={atividade}
                  onChange={e => setAtividade(e.target.value)}
                  placeholder="Ex: Trabalhar interpretação de texto com fábulas; Desenvolver raciocínio lógico com operações matemáticas..."
                  rows={4}
                  style={{
                    width: "100%", boxSizing: "border-box" as const,
                    background: "#f9fafb", border: "1.5px solid #e5e7eb",
                    borderRadius: "10px", padding: "0.85rem 1rem",
                    color: "#111827", fontFamily: "inherit", fontSize: "0.95rem",
                    resize: "vertical" as const, outline: "none", lineHeight: 1.65
                  }}
                  onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    color: "#374151", fontSize: "0.8rem", fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: "0.5rem"
                  }}>
                    <span style={{ background: "#f5f3ff", color: "#8b5cf6", borderRadius: "6px", padding: "0.1rem 0.4rem", fontSize: "0.75rem" }}>🏫</span>
                    Etapa Escolar
                  </label>
                  <select value={etapa} onChange={e => setEtapa(e.target.value)}
                    style={{
                      width: "100%", background: "#f9fafb",
                      border: "1.5px solid #e5e7eb", borderRadius: "10px",
                      padding: "0.75rem 1rem", color: etapa ? "#111827" : "#9ca3af",
                      fontFamily: "inherit", fontSize: "0.88rem", outline: "none", cursor: "pointer"
                    }}
                    onFocus={e => { e.target.style.borderColor = "#8b5cf6"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  >
                    <option value="">Selecione a etapa escolar...</option>
                    <optgroup label="🌱 Educação Infantil">
                      {etapasEscolares.filter(e => ["bebe","crianca_pequena","crianca_pre"].includes(e.value)).map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="📗 Ensino Fundamental I">
                      {etapasEscolares.filter(e => ["ef1","ef2","ef3","ef4","ef5"].includes(e.value)).map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="📘 Ensino Fundamental II">
                      {etapasEscolares.filter(e => ["ef6","ef7","ef8","ef9"].includes(e.value)).map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🎓 Ensino Médio">
                      {etapasEscolares.filter(e => ["em1","em2","em3"].includes(e.value)).map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    color: "#374151", fontSize: "0.8rem", fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: "0.5rem"
                  }}>
                    <span style={{ background: "#ecfdf5", color: "#10b981", borderRadius: "6px", padding: "0.1rem 0.4rem", fontSize: "0.75rem" }}>📐</span>
                    Área do Conhecimento
                  </label>
                  <select value={area} onChange={e => setArea(e.target.value)}
                    style={{
                      width: "100%", background: "#f9fafb",
                      border: "1.5px solid #e5e7eb", borderRadius: "10px",
                      padding: "0.75rem 1rem", color: "#111827",
                      fontFamily: "inherit", fontSize: "0.88rem", outline: "none", cursor: "pointer"
                    }}
                    onFocus={e => { e.target.style.borderColor = "#10b981"; e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  >
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={buscar} disabled={loading || !atividade.trim() || !etapa}
                style={{
                  width: "100%", padding: "0.9rem", border: "none", borderRadius: "10px",
                  background: loading || !atividade.trim() || !etapa ? "#f3f4f6" : "linear-gradient(135deg, #3b82f6, #7c3aed)",
                  color: loading || !atividade.trim() || !etapa ? "#9ca3af" : "#fff",
                  fontFamily: "inherit", fontSize: "1rem", fontWeight: 700,
                  cursor: loading || !atividade.trim() || !etapa ? "not-allowed" : "pointer",
                  boxShadow: loading || !atividade.trim() || !etapa ? "none" : "0 4px 14px rgba(59,130,246,0.32)"
                }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7rem" }}>
                    <span style={{
                      width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)",
                      borderTop: "2.5px solid #fff", borderRadius: "50%",
                      animation: "spin 0.75s linear infinite", display: "inline-block"
                    }} />
                    Consultando a BNCC com IA...
                  </span>
                ) : "🔍 Buscar Habilidades BNCC"}
              </button>
            </div>

            {resultado && !isErro && (
              <div ref={resultadoRef} style={{
                marginTop: "1.8rem", background: "#fff",
                border: "1px solid #e5e7eb", borderRadius: "16px",
                overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)"
              }}>
                <div style={{
                  padding: "1rem 1.5rem", borderBottom: "1px solid #f3f4f6",
                  background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "10px",
                      background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem"
                    }}>✨</div>
                    <div>
                      <div style={{ color: "#1e40af", fontWeight: 800, fontSize: "0.88rem" }}>Habilidades BNCC Encontradas</div>
                      <div style={{ fontSize: "0.76rem", color: "#6b7280", marginTop: "0.1rem" }}>
                        {resultado.area} · {resultado.etapa?.split("–")[0]?.trim()}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0",
                    borderRadius: "20px", padding: "0.25rem 0.8rem", fontSize: "0.74rem", fontWeight: 700
                  }}>✓ Salvo</span>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <div style={{
                    background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px",
                    padding: "0.7rem 1rem", marginBottom: "1.2rem", fontSize: "0.88rem",
                    color: "#92400e", fontStyle: "italic"
                  }}>"{resultado.atividade}"</div>
                  <div style={{ lineHeight: 1.75, fontSize: "0.93rem", color: "#374151" }}
                    dangerouslySetInnerHTML={{ __html: `<p style="margin:0.5rem 0;color:#374151;line-height:1.75">${renderMarkdown(resultado.resultado)}</p>` }}
                  />
                </div>
              </div>
            )}

            {isErro && (
              <div style={{
                marginTop: "1.5rem", padding: "1rem 1.5rem",
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: "12px", color: "#991b1b", fontSize: "0.9rem"
              }}>⚠️ Erro ao consultar. Verifique sua conexão e tente novamente.</div>
            )}
          </div>
        )}

        {/* HISTÓRICO */}
        {tab === "historico" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: selectedHistorico ? "320px 1fr" : "1fr",
            gap: "1.2rem", alignItems: "start"
          }}>
            <div>
              <div style={{ marginBottom: "1rem", position: "relative" }}>
                <span style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" as const }}>🔎</span>
                <input value={searchHistorico} onChange={e => setSearchHistorico(e.target.value)}
                  placeholder="Filtrar histórico..."
                  style={{
                    width: "100%", boxSizing: "border-box" as const,
                    background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: "10px",
                    padding: "0.65rem 1rem 0.65rem 2.4rem", color: "#111827",
                    fontFamily: "inherit", fontSize: "0.88rem", outline: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>

              {filteredHistorico.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "3rem 1.5rem",
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.7rem" }}>📭</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#6b7280" }}>
                    {historico.length === 0 ? "Nenhuma busca realizada ainda." : "Nenhum resultado para o filtro."}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
                  {filteredHistorico.map(h => (
                    <div key={h.timestamp} onClick={() => setSelectedHistorico(h)}
                      style={{
                        padding: "0.95rem 1.1rem",
                        background: selectedHistorico?.timestamp === h.timestamp ? "#eff6ff" : "#fff",
                        border: `1.5px solid ${selectedHistorico?.timestamp === h.timestamp ? "#93c5fd" : "#e5e7eb"}`,
                        borderRadius: "12px", cursor: "pointer",
                        position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                      }}
                    >
                      <div style={{
                        fontSize: "0.88rem", color: "#111827", fontWeight: 600,
                        marginBottom: "0.4rem", paddingRight: "1.5rem",
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const
                      }}>{h.atividade}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{
                          background: (h.etapaCor || "#3b82f6") + "18",
                          color: h.etapaCor || "#3b82f6",
                          border: `1px solid ${(h.etapaCor || "#3b82f6")}35`,
                          borderRadius: "20px", padding: "0.1rem 0.55rem",
                          fontSize: "0.68rem", fontWeight: 700
                        }}>{h.etapa?.split("–")[0]?.trim()}</span>
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{formatarData(h.timestamp)}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deletarItem(h.timestamp); }}
                        style={{
                          position: "absolute", top: "0.7rem", right: "0.7rem",
                          background: "none", border: "none", cursor: "pointer",
                          color: "#d1d5db", fontSize: "0.9rem", padding: "0.15rem 0.35rem", borderRadius: "5px"
                        }}
                        onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = "#ef4444"; (e.target as HTMLButtonElement).style.background = "#fee2e2"; }}
                        onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = "#d1d5db"; (e.target as HTMLButtonElement).style.background = "none"; }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedHistorico && (
              <div style={{
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px",
                overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                maxHeight: "78vh", overflowY: "auto"
              }}>
                <div style={{
                  padding: "1rem 1.5rem", borderBottom: "1px solid #f3f4f6",
                  background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
                  position: "sticky", top: 0, zIndex: 1,
                  display: "flex", alignItems: "center", gap: "0.8rem"
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "9px",
                    background: selectedHistorico.etapaCor || "#3b82f6",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem"
                  }}>
                    {selectedHistorico.etapa?.includes("Infantil") ? "🌱" : selectedHistorico.etapa?.includes("Médio") ? "🎓" : "📗"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#1e40af", fontWeight: 800, fontSize: "0.85rem" }}>
                      {selectedHistorico.etapa?.split("–")[0]?.trim()}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#6b7280" }}>
                      {formatarData(selectedHistorico.timestamp)} · {selectedHistorico.area}
                    </div>
                  </div>
                  <button onClick={() => setSelectedHistorico(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1rem", padding: "0.2rem 0.4rem", borderRadius: "5px" }}
                  >✕</button>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <div style={{
                    background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px",
                    padding: "0.65rem 1rem", marginBottom: "1.2rem",
                    fontSize: "0.88rem", color: "#92400e", fontStyle: "italic"
                  }}>"{selectedHistorico.atividade}"</div>
                  <div style={{ lineHeight: 1.75, fontSize: "0.9rem", color: "#374151" }}
                    dangerouslySetInnerHTML={{ __html: `<p style="margin:0.5rem 0;color:#374151;line-height:1.75">${renderMarkdown(selectedHistorico.resultado)}</p>` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f3f4f6; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
}
