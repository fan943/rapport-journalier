import { useState, useEffect } from "react";
import { Copy, Check, RotateCcw, FileText, Wand2 } from "lucide-react";

const ETAT_STYLES = {
  "veille":      { color: "#34d399", label: "Veille" },
  "sécurité":    { color: "#38bdf8", label: "Sécurité" },
  "anomalie":    { color: "#fbbf24", label: "Anomalie" },
  "dérangement": { color: "#f87171", label: "Dérangement" },
  "alarme feu":  { color: "#ef4444", label: "Alarme feu" },
};
const ETATS = Object.keys(ETAT_STYLES);

const STORAGE_KEY = "rapport-journalier";
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
const saved = loadSaved();
const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [date, setDate] = useState(saved?.date ?? today());
  const [site, setSite] = useState(saved?.site ?? "");
  const [etatArrivee, setEtatArrivee] = useState(saved?.etatArrivee ?? "veille");
  const [defautsArrivee, setDefautsArrivee] = useState(saved?.defautsArrivee ?? "");
  const [etatDepart, setEtatDepart] = useState(saved?.etatDepart ?? "veille");
  const [defautsDepart, setDefautsDepart] = useState(saved?.defautsDepart ?? "");
  const [essais, setEssais] = useState(saved?.essais ?? "");
  const [copied, setCopied] = useState(false);
  const [correcting, setCorrecting] = useState(false);

  const correctText = async () => {
    if (!essais.trim() || correcting) return;
    setCorrecting(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Corrige uniquement les fautes d'orthographe et de grammaire du texte suivant, en français. Garde le sens, le style et le vocabulaire technique SSI (ECS, CMSI, SDI, ZD, ZA, ZS, ZF, DAS, DI, dérangement, etc.) intacts. Réponds uniquement avec le texte corrigé, sans aucun commentaire, préambule ni guillemets.\n\nTexte :\n${essais}`,
            },
          ],
        }),
      });
      const data = await response.json();
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (text) setEssais(text);
    } catch (e) {
      // en cas d'erreur, on laisse le texte tel quel
    } finally {
      setCorrecting(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date, site, etatArrivee, defautsArrivee, etatDepart, defautsDepart, essais,
      }));
    } catch (e) {}
  }, [date, site, etatArrivee, defautsArrivee, etatDepart, defautsDepart, essais]);

  const fmtDate = (iso) => {
    if (!iso) return "(date non renseignée)";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const arriveeLines = etatArrivee === "veille"
    ? [`État de la centrale à l'arrivée : ${ETAT_STYLES[etatArrivee].label}`]
    : [`État de la centrale à l'arrivée : ${ETAT_STYLES[etatArrivee].label}`,
       defautsArrivee || "(détails non renseignés)"];

  const departLines = etatDepart === "veille"
    ? [`État de la centrale au départ : ${ETAT_STYLES[etatDepart].label}`]
    : [`État de la centrale au départ : ${ETAT_STYLES[etatDepart].label}`,
       defautsDepart || "(détails non renseignés)"];

  const report = [
    fmtDate(date),
    "",
    ...arriveeLines,
    "",
    "Essais / Observations :",
    essais || "(rien renseigné)",
    "",
    ...departLines,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  };

  const newReport = () => {
    if (!window.confirm("Démarrer un nouveau rapport ? (les champs actuels seront effacés)")) return;
    setDate(today());
    setEtatArrivee("veille");
    setDefautsArrivee("");
    setEtatDepart("veille");
    setDefautsDepart("");
    setEssais("");
  };

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; }
        .app { background: #0f1115; color: #e5e7eb; min-height: 100%; padding: 12px; max-width: 480px; margin: 0 auto; }
        .head { text-align: center; padding: 6px 0 14px; }
        .head h1 { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 13px;
          letter-spacing: 0.25em; color: #8b94a3; margin: 0; text-transform: uppercase; }

        .panel { background: #1a1e24; border: 1px solid #2d333d; border-radius: 12px; padding: 14px; margin-bottom: 12px; }
        .row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .row:last-child { margin-bottom: 0; }
        .row label { font-size: 13px; color: #8b94a3; }
        .row input, .row select, .row textarea {
          background: #14171c; border: 1px solid #2d333d; border-radius: 8px; color: #e5e7eb;
          padding: 10px; font-size: 15px; font-family: inherit;
        }
        .row textarea { resize: vertical; }

        .section-title { font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #8b94a3;
          margin: 16px 4px 8px; display: flex; align-items: center; gap: 6px; }

        .report-box { width: 100%; height: 200px; background: #14171c; border: 1px solid #2d333d; border-radius: 8px;
          color: #e5e7eb; font-family: ui-monospace, Menlo, monospace; font-size: 12px; padding: 10px; resize: none; }

        .btn-row { display: flex; gap: 8px; margin-top: 10px; }
        .copy-btn { flex: 1; padding: 12px; border-radius: 10px; border: none; background: #38bdf8;
          color: #0f1115; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .reset-btn { padding: 12px 16px; border-radius: 10px; border: 1px solid #2d333d; background: #1a1e24;
          color: #8b94a3; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .correct-btn { padding: 8px 12px; border-radius: 8px; border: 1px solid #2d333d; background: #14171c;
          color: #38bdf8; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 6px; align-self: flex-start; }
        .correct-btn:disabled { color: #4b5563; cursor: default; }

        select option { background: #14171c; color: #e5e7eb; }
      `}</style>

      <div className="head">
        <h1>Rapport journalier</h1>
      </div>

      <div className="panel">
        <div className="row">
          <label>Site</label>
          <input type="text" value={site} onChange={(e) => setSite(e.target.value)} placeholder="ex: Cœur Défense" />
        </div>
        <div className="row">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="row">
          <label>État de la centrale à l'arrivée</label>
          <select value={etatArrivee} onChange={(e) => setEtatArrivee(e.target.value)}
            style={{ color: ETAT_STYLES[etatArrivee].color, fontWeight: 700 }}>
            {ETATS.map((e) => <option key={e} value={e}>{ETAT_STYLES[e].label}</option>)}
          </select>
          {etatArrivee !== "veille" && (
            <textarea rows={3} value={defautsArrivee} onChange={(e) => setDefautsArrivee(e.target.value)}
              placeholder="Détails / défauts constatés à l'arrivée..." style={{ marginTop: 6 }} />
          )}
        </div>
        <div className="row">
          <label>Essais / Observations</label>
          <textarea rows={5} value={essais} onChange={(e) => setEssais(e.target.value)}
            placeholder="ex: Essai de la zone détection RDC et zone 412..." />
          <button className="correct-btn" onClick={correctText} disabled={correcting || !essais.trim()}>
            <Wand2 size={15} /> {correcting ? "Correction en cours..." : "Corriger l'orthographe"}
          </button>
        </div>
        <div className="row">
          <label>État de la centrale au départ</label>
          <select value={etatDepart} onChange={(e) => setEtatDepart(e.target.value)}
            style={{ color: ETAT_STYLES[etatDepart].color, fontWeight: 700 }}>
            {ETATS.map((e) => <option key={e} value={e}>{ETAT_STYLES[e].label}</option>)}
          </select>
          {etatDepart !== "veille" && (
            <textarea rows={3} value={defautsDepart} onChange={(e) => setDefautsDepart(e.target.value)}
              placeholder="Détails / défauts constatés au départ..." style={{ marginTop: 6 }} />
          )}
        </div>
      </div>

      <div className="section-title"><FileText size={14} /> Rapport</div>
      <div className="panel">
        <textarea readOnly className="report-box" value={report} />
        <div className="btn-row">
          <button className="copy-btn" onClick={copy}>
            {copied ? <><Check size={16} /> Copié</> : <><Copy size={16} /> Copier</>}
          </button>
          <button className="reset-btn" onClick={newReport}>
            <RotateCcw size={16} /> Nouveau
          </button>
        </div>
      </div>
    </div>
  );
}
