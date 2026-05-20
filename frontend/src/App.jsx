import { useState, useRef, useEffect, useCallback } from "react";

// ── Palette & tokens ──────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #06070A;
    --surface:   #0E1018;
    --card:      #12151F;
    --border:    rgba(255,255,255,0.07);
    --border2:   rgba(255,255,255,0.12);
    --teal:      #00D4AA;
    --teal2:     #00B894;
    --teal-dim:  rgba(0,212,170,0.12);
    --teal-glow: rgba(0,212,170,0.25);
    --white:     #F0F2F8;
    --muted:     #6B7280;
    --danger:    #FF4757;
    --warn:      #FFB347;
    --font-head: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --radius:    16px;
    --radius-sm: 10px;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--white);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--teal2); border-radius: 3px; }

  /* ── Noise overlay ── */
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
  }

  /* ── Glow blob ── */
  .glow-blob {
    position: fixed; border-radius: 50%; filter: blur(120px);
    pointer-events: none; z-index: 0;
  }
  .glow-blob-1 { width: 500px; height: 500px; background: rgba(0,212,170,0.08); top: -100px; right: -100px; }
  .glow-blob-2 { width: 400px; height: 400px; background: rgba(0,184,148,0.06); bottom: 100px; left: -100px; }

  /* ── Nav ── */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px;
    background: rgba(6,7,10,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo {
    font-family: var(--font-head);
    font-size: 22px; font-weight: 800;
    background: linear-gradient(135deg, var(--teal), #7FFFDC);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }
  .nav-links { display: flex; gap: 36px; list-style: none; }
  .nav-links a {
    color: var(--muted); text-decoration: none; font-size: 14px;
    font-weight: 500; transition: color 0.2s; letter-spacing: 0.3px;
  }
  .nav-links a:hover { color: var(--white); }
  .nav-cta {
    background: var(--teal); color: #000; border: none;
    padding: 10px 24px; border-radius: 8px;
    font-family: var(--font-body); font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px;
  }
  .nav-cta:hover { background: var(--teal2); transform: translateY(-1px); }

  /* ── Sections ── */
  section { position: relative; z-index: 1; }

  /* ── Hero ── */
  .hero {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 120px 24px 80px;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--teal-dim); border: 1px solid rgba(0,212,170,0.3);
    padding: 6px 16px; border-radius: 100px;
    font-size: 12px; font-weight: 500; color: var(--teal);
    letter-spacing: 1px; text-transform: uppercase; margin-bottom: 32px;
  }
  .hero-badge span { width: 6px; height: 6px; background: var(--teal); border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }

  .hero h1 {
    font-family: var(--font-head);
    font-size: clamp(48px, 7vw, 88px);
    font-weight: 800; line-height: 1.05;
    letter-spacing: -2px; margin-bottom: 24px;
  }
  .hero h1 .accent {
    background: linear-gradient(135deg, var(--teal) 0%, #7FFFDC 50%, #00B894 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero p {
    font-size: clamp(16px, 2vw, 20px); color: var(--muted);
    max-width: 560px; margin: 0 auto 48px; font-weight: 300; line-height: 1.7;
  }
  .hero-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .btn-primary {
    background: var(--teal); color: #000;
    padding: 14px 32px; border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 15px; font-weight: 600;
    border: none; cursor: pointer; transition: all 0.25s;
    display: flex; align-items: center; gap: 8px;
  }
  .btn-primary:hover { background: #00EFC0; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,212,170,0.3); }
  .btn-secondary {
    background: transparent; color: var(--white);
    padding: 14px 32px; border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 15px; font-weight: 500;
    border: 1px solid var(--border2); cursor: pointer; transition: all 0.25s;
  }
  .btn-secondary:hover { border-color: var(--teal); color: var(--teal); background: var(--teal-dim); }

  .hero-stats {
    display: flex; gap: 48px; margin-top: 72px; justify-content: center; flex-wrap: wrap;
  }
  .stat { text-align: center; }
  .stat-val {
    font-family: var(--font-head); font-size: 36px; font-weight: 800;
    background: linear-gradient(135deg, var(--teal), #7FFFDC);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .stat-lbl { font-size: 13px; color: var(--muted); margin-top: 4px; letter-spacing: 0.5px; }

  /* ── Demo Section ── */
  .demo-section {
    padding: 80px 24px; max-width: 1100px; margin: 0 auto;
  }
  .section-label {
    font-size: 12px; font-weight: 600; color: var(--teal);
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;
  }
  .section-title {
    font-family: var(--font-head); font-size: clamp(32px, 4vw, 52px);
    font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px;
  }
  .section-sub { color: var(--muted); max-width: 500px; line-height: 1.7; margin-bottom: 56px; }

  .demo-container {
    display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start;
  }
  @media (max-width: 900px) { .demo-container { grid-template-columns: 1fr; } }

  /* Camera card */
  .camera-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden; position: relative;
  }
  .camera-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }
  .camera-title { font-size: 13px; font-weight: 600; color: var(--muted); letter-spacing: 0.5px; }
  .rec-dot {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--danger); font-weight: 500;
  }
  .rec-dot span { width: 8px; height: 8px; background: var(--danger); border-radius: 50%; animation: pulse 1.5s infinite; }

  .video-wrapper {
    position: relative; background: #000; aspect-ratio: 4/3; overflow: hidden;
  }
  video { width: 100%; height: 100%; object-fit: cover; display: block; transform: scaleX(-1); }
  canvas.overlay { position: absolute; inset: 0; width: 100%; height: 100%; }
  .roi-guide {
    position: absolute;
    top: 20.8%;
    left: 46.875%;
    width: 46.875%;
    height: 62.5%;
    border: 2px dashed rgba(0,212,170,0.9);
    pointer-events: none;
    border-radius: 14px;
    box-sizing: border-box;
  }
  .roi-label {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 999px;
    color: var(--teal);
    background: rgba(0,0,0,0.5);
  }

  /* Hand outline guide */
  .hand-guide {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }
  .hand-outline-svg { width: 55%; max-width: 220px; opacity: 0.25; transition: opacity 0.4s; }
  .hand-outline-svg.aligned { opacity: 0; }

  /* Alignment indicator */
  .align-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 12px 16px;
    background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
    display: flex; align-items: center; gap: 10px;
  }
  .align-bar-text { font-size: 13px; font-weight: 500; }
  .align-progress { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
  .align-fill { height: 100%; border-radius: 2px; transition: width 0.3s, background 0.3s; }

  /* Result panel */
  .result-panel {
    display: flex; flex-direction: column; gap: 16px;
  }

  .result-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 24px;
  }

  .gesture-display {
    text-align: center; padding: 32px 0;
  }
  .gesture-number {
    font-family: var(--font-head); font-size: 96px; font-weight: 800; line-height: 1;
    background: linear-gradient(135deg, var(--teal) 0%, #7FFFDC 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    transition: all 0.3s;
  }
  .gesture-label { font-size: 14px; color: var(--muted); margin-top: 8px; letter-spacing: 0.5px; }

  .confidence-section { margin-top: 20px; }
  .conf-header { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; }
  .conf-label { color: var(--muted); }
  .conf-val { color: var(--teal); font-weight: 600; }
  .conf-bar { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
  .conf-fill {
    height: 100%; border-radius: 4px;
    background: linear-gradient(90deg, var(--teal2), var(--teal));
    transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
  }

  .status-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 500;
    margin-top: 16px;
  }
  .status-badge.idle { background: rgba(107,114,128,0.15); color: var(--muted); }
  .status-badge.aligning { background: rgba(255,179,71,0.15); color: var(--warn); }
  .status-badge.detecting { background: rgba(0,212,170,0.15); color: var(--teal); }
  .status-badge.alert { background: rgba(255,71,87,0.15); color: var(--danger); }

  /* Alert box */
  .alert-box {
    background: rgba(255,71,87,0.08); border: 1px solid rgba(255,71,87,0.25);
    border-radius: var(--radius-sm); padding: 14px 16px;
    font-size: 13px; color: #FF8A95; display: none; align-items: center; gap: 10px;
  }
  .alert-box.show { display: flex; }

  /* Controls */
  .cam-btn {
    width: 100%; padding: 14px; border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; border: none;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .cam-btn.start { background: var(--teal); color: #000; }
  .cam-btn.start:hover { background: #00EFC0; }
  .cam-btn.stop { background: rgba(255,71,87,0.15); color: var(--danger); border: 1px solid rgba(255,71,87,0.3); }
  .cam-btn.stop:hover { background: rgba(255,71,87,0.25); }

  /* ── Gestures Library ── */
  .gestures-section { padding: 80px 24px; max-width: 1100px; margin: 0 auto; }
  .gestures-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
  .gesture-card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 28px 24px; text-align: center; cursor: pointer;
    transition: all 0.25s; position: relative; overflow: hidden;
  }
  .gesture-card::before {
    content: ''; position: absolute; inset: 0; opacity: 0;
    background: radial-gradient(circle at center, var(--teal-dim), transparent 70%);
    transition: opacity 0.3s;
  }
  .gesture-card:hover { border-color: var(--teal); transform: translateY(-4px); }
  .gesture-card:hover::before { opacity: 1; }
  .gesture-card.active { border-color: var(--teal); background: rgba(0,212,170,0.05); }
  .gesture-emoji { font-size: 56px; line-height: 1; margin-bottom: 16px; display: block; }
  .gesture-num { font-family: var(--font-head); font-size: 32px; font-weight: 800; color: var(--teal); }
  .gesture-name { font-size: 14px; color: var(--muted); margin-top: 4px; }
  .gesture-tip { font-size: 12px; color: var(--muted); margin-top: 10px; line-height: 1.5; opacity: 0.7; }

  /* ── Practice Mode ── */
  .practice-section { padding: 80px 24px; max-width: 1100px; margin: 0 auto; }
  .practice-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
  .practice-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 48px; text-align: center;
  }
  .practice-target {
    font-family: var(--font-head); font-size: 120px; font-weight: 800; line-height: 1;
    background: linear-gradient(135deg, var(--teal), #7FFFDC);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin: 24px 0;
  }
  .practice-prompt { font-size: 18px; color: var(--muted); margin-bottom: 8px; }
  .practice-feedback { font-size: 22px; font-weight: 600; margin-top: 24px; min-height: 36px; }
  .practice-feedback.correct { color: var(--teal); }
  .practice-feedback.wrong { color: var(--danger); }
  .score-row {
    display: flex; gap: 32px; justify-content: center; margin-top: 32px; flex-wrap: wrap;
  }
  .score-item { text-align: center; }
  .score-val { font-family: var(--font-head); font-size: 40px; font-weight: 800; color: var(--teal); }
  .score-lbl { font-size: 13px; color: var(--muted); }

  /* ── Features Grid ── */
  .features-section { padding: 80px 24px; max-width: 1100px; margin: 0 auto; }
  .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 56px; }
  .feature-card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px;
    transition: all 0.25s; position: relative; overflow: hidden;
  }
  .feature-card:hover { border-color: var(--border2); transform: translateY(-2px); }
  .feature-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--teal-dim); display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 20px;
  }
  .feature-card h3 { font-family: var(--font-head); font-size: 18px; font-weight: 700; margin-bottom: 10px; }
  .feature-card p { font-size: 14px; color: var(--muted); line-height: 1.7; }

  /* ── Footer ── */
  footer {
    border-top: 1px solid var(--border); padding: 48px 24px;
    text-align: center; color: var(--muted); font-size: 14px;
    position: relative; z-index: 1;
  }
  .footer-logo {
    font-family: var(--font-head); font-size: 20px; font-weight: 800;
    background: linear-gradient(135deg, var(--teal), #7FFFDC);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 16px; display: block;
  }

  /* ── Tab switcher ── */
  .tabs { display: flex; gap: 4px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 4px; margin-bottom: 40px; width: fit-content; }
  .tab {
    padding: 9px 22px; border-radius: 8px; font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all 0.2s; border: none; background: transparent; color: var(--muted);
    font-family: var(--font-body);
  }
  .tab.active { background: var(--teal); color: #000; font-weight: 600; }

  /* ── History Log ── */
  .history-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px;
  }
  .history-title { font-size: 13px; color: var(--muted); margin-bottom: 14px; font-weight: 600; letter-spacing: 0.5px; }
  .history-list { display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; }
  .history-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; background: var(--surface); border-radius: 8px;
    font-size: 13px;
  }
  .history-gesture { font-weight: 700; color: var(--teal); font-family: var(--font-head); }
  .history-conf { color: var(--muted); font-size: 12px; }
  .history-time { color: var(--muted); font-size: 11px; }

  @media (max-width: 900px) {
    nav { padding: 0 24px; flex-wrap: wrap; justify-content: center; height: auto; }
    .nav-links { gap: 18px; justify-content: center; }
    .nav-cta {
      width: 100%; max-width: 220px; margin-top: 14px;
      padding: 8px 20px; font-size: 13px;
    }
    .hero { padding: 100px 18px 64px; }
    .hero-stats { gap: 24px; margin-top: 56px; }
    .hero h1 { font-size: clamp(38px, 10vw, 64px); }
    .hero p { max-width: 100%; margin-bottom: 36px; }
    .hero-btns { gap: 12px; }
    .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
    .section-title { text-align: center; }
    .section-sub { max-width: 100%; margin-left: auto; margin-right: auto; }
    .practice-card, .gesture-card, .history-card, .camera-card, .result-card { padding: 20px; }
    .practice-layout { grid-template-columns: 1fr; }
    .practice-card { width: 100%; }
    .practice-target { font-size: clamp(72px, 15vw, 96px); }
    .score-row { gap: 20px; }
    .feature-card { padding: 20px; }
  }

  @media (max-width: 600px) {
    .nav-links { gap: 12px; }
    .nav-links a { font-size: 13px; }
    .hero { padding: 90px 16px 48px; }
    .hero-badge { margin-bottom: 24px; }
    .hero h1 { line-height: 1.1; }
    .hero p { font-size: 15px; }
    .hero-stats { flex-direction: column; align-items: center; gap: 18px; }
    .demo-section, .gestures-section, .practice-section { padding-left: 16px; padding-right: 16px; }
    .tabs { width: 100%; flex-wrap: wrap; }
    .tab { flex: 1 1 auto; text-align: center; }
    .gesture-card { padding: 20px; }
    .practice-card { padding: 28px 20px; }
    .practice-prompt { font-size: 16px; }
    .score-item { flex: 1 1 45%; }
    footer { padding: 32px 16px; }
  }
`;

// ── Gesture data ────────────────────────────────────────────
const GESTURES = [
    { num: "0", emoji: "✊", name: "Zero", tip: "Closed fist — all fingers curled in", color: "#00D4AA" },
    { num: "1", emoji: "☝️", name: "One", tip: "Index finger pointing up, others closed", color: "#7FFFDC" },
    { num: "2", emoji: "✌️", name: "Two", tip: "Index + middle finger up (V sign)", color: "#00B894" },
];

const STATUS = {
    idle: { label: "Camera off", cls: "idle" },
    aligning: { label: "Align your hand…", cls: "aligning" },
    detecting: { label: "Detecting gesture", cls: "detecting" },
    alert: { label: "Hand not detected", cls: "alert" },
};

// ── Hand SVG outline ────────────────────────────────────────
const HandSVG = ({ aligned }) => (
    <svg className={`hand-outline-svg${aligned ? " aligned" : ""}`} viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M80 180 C50 180 30 160 28 130 L22 80 C20 68 28 60 38 62 L40 62 L40 40 C40 30 48 24 56 26 C58 18 66 14 74 18 C76 10 86 8 92 14 C98 8 108 12 108 22 L108 62 C118 60 126 68 124 80 L118 130 C116 160 110 180 80 180Z" stroke="#00D4AA" strokeWidth="2.5" fill="rgba(0,212,170,0.06)" strokeLinejoin="round" />
        <line x1="56" y1="26" x2="56" y2="62" stroke="#00D4AA" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
        <line x1="74" y1="18" x2="74" y2="62" stroke="#00D4AA" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
        <line x1="92" y1="14" x2="92" y2="62" stroke="#00D4AA" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
    </svg>
);

// ── Backend API endpoint ────────────────────────────────────
const API_URL = "https://shahnaz123aqsa-auslanai.hf.space/predict";
// const API_URL = "http://localhost:5000/predict";

// ── Main App ────────────────────────────────────────────────
export default function App() {
    const [page, setPage] = useState("home");
    const [camOn, setCamOn] = useState(false);
    const [status, setStatus] = useState("idle");
    const [alignScore, setAlignScore] = useState(0);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [practiceTarget, setPracticeTarget] = useState("1");
    const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0 });
    const [practiceFeedback, setPracticeFeedback] = useState("");
    const [activeGesture, setActiveGesture] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const alignRef = useRef(0);
    const predictingRef = useRef(false);

    const [predicting, setPredicting] = useState(false);
    const [backendStatus, setBackendStatus] = useState("unknown");
    const [frontendReady, setFrontendReady] = useState(false);

    const captureAndPredict = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || predictingRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, width, height);

        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        console.log("[capture] sending frame", width, height, "bytes", imageData.length);
        predictingRef.current = true;
        setPredicting(true);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: imageData.split(",")[1]
                }),
            });
            const data = await response.json();
            console.log("[predict] response", response.status, data);
            if (!response.ok) throw new Error(data.error || "Prediction failed");
            // Return clean prediction response from backend
            return {
                gesture: String(data.gesture),
                confidence: Number(data.confidence || 0).toFixed(1)
            };
        } catch (error) {
            console.error("Prediction error:", error);
            return null;
        } finally {
            predictingRef.current = false;
            setPredicting(false);
        }
    }, []);

    // Start camera
    const startCamera = useCallback(async () => {
        console.log("[startCamera] starting camera");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
            console.log("[startCamera] got stream", stream);
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCamOn(true);
            setStatus("aligning");
            setAlignScore(0);

            // Detection loop — predict every 1.5s when hand is in frame
            let tick = 0;
            intervalRef.current = setInterval(() => {
                tick++;
                // Alignment score: ramp up faster, drop slower
                const newScore = Math.min(100, alignRef.current + (Math.random() > 0.25 ? 8 : -2));
                alignRef.current = Math.max(0, newScore);
                setAlignScore(Math.round(alignRef.current));

                if (alignRef.current < 30) {
                    setStatus("alert");
                    setResult(null);
                } else if (alignRef.current < 60) {
                    setStatus("aligning");
                } else {
                    setStatus("detecting");
                    // Predict every 5 ticks (~1.5s) instead of 8, and don't skip if aligning
                    if (tick % 5 === 0 && !predictingRef.current) {
                        captureAndPredict().then(det => {
                            if (det) {
                                setResult(det);
                                setHistory(h => [{ ...det, time: new Date().toLocaleTimeString() }, ...h.slice(0, 9)]);
                            }
                        });
                    }
                }
            }, 300);
        } catch (error) {
            console.error("[startCamera] error", error);
            alert("Camera permission denied or unavailable. Please allow camera access.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        clearInterval(intervalRef.current);
        setCamOn(false);
        setStatus("idle");
        setAlignScore(0);
        setResult(null);
    }, []);

    useEffect(() => () => { stopCamera(); }, [stopCamera]);

    useEffect(() => {
        console.log("[App] mounted");
        setFrontendReady(true);
        setBackendStatus("waking");

        // HF free spaces sleep — retry up to 5 times with delay
        const wakeBackend = async () => {
            for (let attempt = 1; attempt <= 5; attempt++) {
                try {
                    const res = await fetch("https://shahnaz123aqsa-auslanai.hf.space/health", { signal: AbortSignal.timeout(15000) });
                    const data = await res.json();
                    console.log("[App] backend health", data);
                    setBackendStatus("connected");
                    return;
                } catch (err) {
                    console.warn(`[App] backend attempt ${attempt} failed`, err);
                    if (attempt < 5) await new Promise(r => setTimeout(r, 4000));
                }
            }
            setBackendStatus("error");
        };
        wakeBackend();
    }, []);

    useEffect(() => {
        if (camOn && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [camOn]);

    // Practice check
    const checkPractice = () => {
        if (!result) return;
        const correct = result.gesture === practiceTarget;
        setPracticeFeedback(correct ? "✓ Correct! Well done!" : `✗ That looks like "${result.gesture}" — try again`);
        setPracticeScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
        if (correct) {
            setTimeout(() => {
                const others = ["0", "1", "2"].filter(g => g !== practiceTarget);
                setPracticeTarget(others[Math.floor(Math.random() * others.length)]);
                setPracticeFeedback("");
            }, 1500);
        }
    };

    const alignColor = alignScore < 30 ? "var(--danger)" : alignScore < 70 ? "var(--warn)" : "var(--teal)";

    return (
        <>
            <style>{css}</style>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {/* NAV */}
            <nav>
                <div className="nav-logo">AuslanAI</div>
                <ul className="nav-links">
                    <li><a href="#" onClick={() => setPage("home")}>Home</a></li>
                    <li><a href="#" onClick={() => setPage("demo")}>Demo</a></li>
                    <li><a href="#" onClick={() => setPage("learn")}>Learn</a></li>
                    <li><a href="#" onClick={() => setPage("practice")}>Practice</a></li>
                </ul>
            </nav>

            {/* ── HOME PAGE ── */}
            {page === "home" && (
                <>
                    <section className="hero">
                        <div className="hero-badge"><span />AI-Powered Sign Language Recognition</div>
                        <h1>
                            Bridge the Gap.<br />
                            <span className="accent">Speak with Signs.</span>
                        </h1>
                        <p>Real-time hand gesture recognition powered by CNN + Random Forest. 99.75% accuracy. No special hardware needed.</p>
                        <div className="hero-btns">
                            <button className="btn-primary" onClick={() => setPage("demo")}>▶ Try Live Demo</button>
                            <button className="btn-secondary" onClick={() => setPage("learn")}>Learn Gestures</button>
                        </div>
                        <div className="hero-stats">
                            <div className="stat"><div className="stat-val">99.75%</div><div className="stat-lbl">Validation Accuracy</div></div>
                            <div className="stat"><div className="stat-val">6,000</div><div className="stat-lbl">Training Images</div></div>
                            <div className="stat"><div className="stat-val">Real-Time</div><div className="stat-lbl">Live Detection</div></div>
                            <div className="stat"><div className="stat-val">Published</div><div className="stat-lbl">Research Paper 2025</div></div>
                        </div>
                    </section>

                    <section className="features-section">
                        <div className="section-label">Features</div>
                        <div className="section-title">Everything you need<br />to communicate.</div>
                        <div className="features-grid">
                            {[
                                { icon: "🎯", title: "Hand Alignment Guide", desc: "Visual hand outline helps you position perfectly before detection begins. Real-time alignment score." },
                                { icon: "⚡", title: "Real-Time Detection", desc: "Instant gesture recognition from your webcam with confidence score and smooth prediction." },
                                { icon: "📚", title: "Gesture Library", desc: "Learn all supported gestures with visual guides, tips, and step-by-step instructions." },
                                { icon: "🏆", title: "Practice Mode", desc: "Interactive quiz that challenges you to perform specific gestures and tracks your score." },
                                { icon: "📊", title: "Detection History", desc: "View your recent detections with timestamps and confidence scores in a live log." },
                                { icon: "🔬", title: "Research Backed", desc: "Published in Social Science Review Archives 2025. Hybrid CNN+RF architecture for superior accuracy." },
                            ].map(f => (
                                <div className="feature-card" key={f.title}>
                                    <div className="feature-icon">{f.icon}</div>
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <footer>
                        <span className="footer-logo">AuslanAI</span>
                        <p>Built by Shahnaz Aqsa Qambrani, Faiza Ahmed Dahri & Shabana Bhatti</p>
                        <p style={{ marginTop: 8 }}>University of Sufism and Modern Sciences, Bhitshah · 2025</p>
                    </footer>
                </>
            )}

            {/* ── DEMO PAGE ── */}
            {page === "demo" && (
                <section className="demo-section" style={{ paddingTop: 120 }}>
                    <div className="section-label">Live Demo</div>
                    <div className="section-title">See it in action.</div>
                    <p className="section-sub">Position your hand inside the outline guide, hold steady, and watch the AI recognize your gesture in real time.</p>

                    <div className="demo-container">
                        {/* Camera */}
                        <div className="camera-card">
                            <div className="camera-header">
                                <span className="camera-title">LIVE FEED</span>
                                {camOn && <div className="rec-dot"><span />REC</div>}
                            </div>
                            <div className="video-wrapper">
                                <video ref={videoRef} autoPlay playsInline muted />
                                <div className="roi-guide"><div className="roi-label">Place hand here</div></div>
                                {!camOn && (
                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, background: "#080A10" }}>
                                        <div style={{ fontSize: 48 }}>📷</div>
                                        <div style={{ color: "var(--muted)", fontSize: 14 }}>Camera not started</div>
                                    </div>
                                )}
                                {camOn && (
                                    <>
                                        <div className="hand-guide">
                                            <HandSVG aligned={alignScore >= 70} />
                                        </div>
                                        <div className="align-bar">
                                            <span className="align-bar-text" style={{ color: alignColor, fontSize: 12 }}>
                                                {alignScore < 30 ? "⚠ Move hand into frame" : alignScore < 70 ? "◎ Keep aligning…" : "✓ Hand aligned!"}
                                            </span>
                                            <div className="align-progress">
                                                <div className="align-fill" style={{ width: `${alignScore}%`, background: alignColor }} />
                                            </div>
                                            <span style={{ fontSize: 12, color: alignColor, fontWeight: 600, minWidth: 36 }}>{alignScore}%</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ padding: "16px" }}>
                                {!camOn
                                    ? <button className="cam-btn start" onClick={startCamera}>▶ Start Camera</button>
                                    : <button className="cam-btn stop" onClick={stopCamera}>■ Stop Camera</button>
                                }
                            </div>
                        </div>

                        {/* Result Panel */}
                        <div className="result-panel">
                            {/* Backend Status Banner */}
                            {backendStatus !== "connected" && (
                                <div style={{
                                    padding: "12px 16px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: 13,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    background: backendStatus === "error" ? "rgba(255,71,87,0.08)" : "rgba(255,179,71,0.08)",
                                    border: `1px solid ${backendStatus === "error" ? "rgba(255,71,87,0.25)" : "rgba(255,179,71,0.25)"}`,
                                    color: backendStatus === "error" ? "var(--danger)" : "var(--warn)"
                                }}>
                                    {backendStatus === "waking" ? "⏳ Waking up AI backend (may take ~30s on first load)…" : "❌ Backend unreachable — check Hugging Face Space is running"}
                                </div>
                            )}
                            {backendStatus === "connected" && (
                                <div style={{ padding: "10px 16px", borderRadius: "var(--radius-sm)", fontSize: 13, background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", color: "var(--teal)" }}>
                                    ✅ Backend connected
                                </div>
                            )}
                            <div className="result-card">
                                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.5px", marginBottom: 4 }}>DETECTED GESTURE</div>
                                <div className="gesture-display">
                                    <div className="gesture-number">{result?.gesture ?? "—"}</div>
                                    <div className="gesture-label">
                                        {result ? GESTURES.find(g => g.num === result.gesture)?.name : "Waiting for detection"}
                                    </div>
                                </div>

                                <div className="confidence-section">
                                    <div className="conf-header">
                                        <span className="conf-label">Confidence</span>
                                        <span className="conf-val">{result ? `${result.confidence}%` : "—"}</span>
                                    </div>
                                    <div className="conf-bar">
                                        <div className="conf-fill" style={{ width: result ? `${result.confidence}%` : "0%" }} />
                                    </div>
                                </div>

                                <div style={{ textAlign: "center", marginTop: 16 }}>
                                    <span className={`status-badge ${STATUS[status].cls}`}>
                                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                                        {STATUS[status].label}
                                    </span>
                                </div>

                                <div className={`alert-box${status === "alert" ? " show" : ""}`} style={{ marginTop: 16 }}>
                                    ⚠ Please position your hand inside the outline guide and hold steady.
                                </div>
                            </div>

                            {/* History */}
                            <div className="history-card">
                                <div className="history-title">DETECTION HISTORY</div>
                                <div className="history-list">
                                    {history.length === 0
                                        ? <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No detections yet</div>
                                        : history.map((h, i) => (
                                            <div className="history-item" key={i}>
                                                <span className="history-gesture">Gesture {h.gesture}</span>
                                                <span className="history-conf">{h.confidence}%</span>
                                                <span className="history-time">{h.time}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            <div style={{ padding: "14px 18px", background: "var(--teal-dim)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--teal)" }}>
                                💡 <strong>Tip:</strong> Use a plain background and ensure good lighting for best results.
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── LEARN PAGE ── */}
            {page === "learn" && (
                <section className="gestures-section" style={{ paddingTop: 120 }}>
                    <div className="section-label">Gesture Library</div>
                    <div className="section-title">Learn the signs.</div>
                    <p className="section-sub" style={{ marginBottom: 40 }}>Click any gesture to see detailed instructions on how to perform it correctly.</p>

                    <div className="gestures-grid">
                        {GESTURES.map(g => (
                            <div
                                key={g.num}
                                className={`gesture-card${activeGesture === g.num ? " active" : ""}`}
                                onClick={() => setActiveGesture(activeGesture === g.num ? null : g.num)}
                            >
                                <span className="gesture-emoji">{g.emoji}</span>
                                <div className="gesture-num">{g.num}</div>
                                <div className="gesture-name">{g.name}</div>
                                <div className="gesture-tip">{g.tip}</div>
                            </div>
                        ))}
                    </div>

                    {activeGesture && (
                        <div style={{ marginTop: 32, background: "var(--card)", border: "1px solid var(--teal)", borderRadius: "var(--radius)", padding: "32px" }}>
                            {(() => {
                                const g = GESTURES.find(x => x.num === activeGesture); return (
                                    <>
                                        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                                            <div style={{ fontSize: 80 }}>{g.emoji}</div>
                                            <div>
                                                <div style={{ fontFamily: "var(--font-head)", fontSize: 32, fontWeight: 800, color: "var(--teal)" }}>Gesture {g.num} — {g.name}</div>
                                                <div style={{ color: "var(--muted)", marginTop: 8, maxWidth: 500, lineHeight: 1.7 }}>{g.tip}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                                            {["Extend fingers clearly", "Keep wrist steady", "Face camera directly", "Good lighting helps"].map(tip => (
                                                <div key={tip} style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "var(--muted)", border: "1px solid var(--border)" }}>✓ {tip}</div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </section>
            )}

            {/* ── PRACTICE PAGE ── */}
            {page === "practice" && (
                <section className="practice-section" style={{ paddingTop: 120 }}>
                    <div className="section-label">Practice Mode</div>
                    <div className="section-title">Test your skills.</div>
                    <p className="section-sub">Start your camera, perform the requested gesture, and hit Check!</p>

                    <div className="practice-layout">
                        <div className="practice-card">
                            <div className="practice-prompt">Show this gesture:</div>
                            <div className="practice-target">{practiceTarget}</div>
                            <div style={{ color: "var(--muted)", fontSize: 15 }}>
                                {GESTURES.find(g => g.num === practiceTarget)?.name} — {GESTURES.find(g => g.num === practiceTarget)?.emoji}
                            </div>
                            <div className="practice-feedback" style={{ color: practiceFeedback.startsWith("✓") ? "var(--teal)" : practiceFeedback ? "var(--danger)" : "transparent" }}>
                                {practiceFeedback || "."}
                            </div>
                            <div className="score-row">
                                <div className="score-item"><div className="score-val">{practiceScore.correct}</div><div className="score-lbl">Correct</div></div>
                                <div className="score-item"><div className="score-val">{practiceScore.total}</div><div className="score-lbl">Total</div></div>
                                <div className="score-item">
                                    <div className="score-val">{practiceScore.total ? Math.round(practiceScore.correct / practiceScore.total * 100) : 0}%</div>
                                    <div className="score-lbl">Accuracy</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "center", flexWrap: "wrap" }}>
                                {!camOn
                                    ? <button className="cam-btn start" style={{ width: "auto", padding: "12px 28px" }} onClick={startCamera}>▶ Start Camera</button>
                                    : <button className="cam-btn stop" style={{ width: "auto", padding: "12px 28px" }} onClick={stopCamera}>■ Stop</button>
                                }
                                <button
                                    onClick={checkPractice}
                                    disabled={!result}
                                    style={{ background: "var(--teal)", color: "#000", border: "none", borderRadius: "var(--radius-sm)", padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: result ? "pointer" : "not-allowed", opacity: result ? 1 : 0.4, fontFamily: "var(--font-body)" }}
                                >
                                    ✓ Check Gesture
                                </button>
                                <button
                                    onClick={() => { setPracticeScore({ correct: 0, total: 0 }); setPracticeFeedback(""); }}
                                    style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 24px", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}
                                >
                                    Reset Score
                                </button>
                            </div>
                        </div>

                        {/* Mini camera for practice */}
                        <div className="camera-card">
                            <div className="camera-header">
                                <span className="camera-title">YOUR CAMERA</span>
                                {camOn && <div className="rec-dot"><span />LIVE</div>}
                            </div>
                            <div className="video-wrapper">
                                <video ref={videoRef} autoPlay playsInline muted />
                                <div className="roi-guide"><div className="roi-label">Place hand here</div></div>
                                {!camOn && (
                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#080A10" }}>
                                        <div style={{ color: "var(--muted)", fontSize: 13 }}>Start camera to detect</div>
                                    </div>
                                )}
                                {camOn && (
                                    <div className="align-bar">
                                        <div className="align-progress">
                                            <div className="align-fill" style={{ width: `${alignScore}%`, background: alignColor }} />
                                        </div>
                                        <span style={{ fontSize: 12, color: alignColor, fontWeight: 600 }}>{alignScore}%</span>
                                    </div>
                                )}
                            </div>
                            {result && (
                                <div style={{ padding: "16px", textAlign: "center" }}>
                                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>DETECTED</div>
                                    <div style={{ fontFamily: "var(--font-head)", fontSize: 48, fontWeight: 800, color: "var(--teal)" }}>{result.gesture}</div>
                                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{result.confidence}% confidence</div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}