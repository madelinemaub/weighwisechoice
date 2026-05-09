import React, { useState, useRef } from 'react';
import storage from "./storage.js";
import { 
  Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, 
  ArrowRight, X, HelpCircle, Lightbulb, Trophy, Lock, SlidersHorizontal,
  ListChecks, Star, Minus, Check, Sparkles, Layers, Info, ImagePlus, Eye,
  Camera, Heart, Pencil, Clock, FolderOpen, RotateCcw
} from 'lucide-react';

const WEIGHT_LABELS = { 1:"Low", 2:"Minor", 3:"Moderate", 4:"Significant", 5:"High", 6:"Very high", 7:"Critical" };
const SCORE_LABELS = { 1:"Terrible", 2:"Poor", 3:"Below avg", 4:"Average", 5:"Good", 6:"Great", 7:"Perfect" };

// Helper: for factors where "less is better" (cost, risk, etc.), clarify what 1 and 7 mean
function getScoreDirection(factorName) {
  const lower = factorName.toLowerCase();
  const inversed = ['cost', 'price', 'expense', 'rent', 'mortgage', 'tuition', 'payment', 'tax', 'risk', 'debt', 'noise', 'commute', 'shedding', 'barking', 'maintenance', 'effort', 'complexity', 'volatility', 'wait time', 'move-in', 'grooming', 'budget'];
  if (inversed.some(w => lower.includes(w))) {
    return { left: '1 = WORST (high ' + factorName.toLowerCase() + ')', right: '7 = BEST (low ' + factorName.toLowerCase() + ')', hint: 'Lower ' + factorName.toLowerCase() + ' = higher score' };
  }
  return { left: '1 = WORST', right: '7 = BEST', hint: null };
}
const PAGES = { DASHBOARD:'DASHBOARD', START:'START', FACTORS:'FACTORS', CLASSIFY:'CLASSIFY', WEIGHT:'WEIGHT', LENS_SUMMARY:'LENS_SUMMARY', OPTIONS:'OPTIONS', SCORING:'SCORING', RESULTS:'RESULTS' };
const FALLBACK_FACTORS = ["Upfront cost","Monthly/ongoing cost","Quality","Location/convenience","Time commitment","Gut feeling","Long-term value","Ease of use","Reviews/reputation","Flexibility","Risk level","How it fits my life","Support if something goes wrong"];
const STEPS = [
  { num:1, label:"What matters" },
  { num:2, label:"Dealbreakers" },
  { num:3, label:"Priorities" },
  { num:4, label:"Review" },
  { num:5, label:"Your choices" },
  { num:6, label:"Rate them" },
];

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');

:root {
  --bg: #F7F7FA;
  --surface: #FFFFFF;
  --surface-2: #F1F1F6;
  --surface-3: #E8E8F0;
  --border: #E0E0EA;
  --border-hover: #CECED8;
  --text: #1A1A2E;
  --text-secondary: #4A4A64;
  --text-tertiary: #7A7A94;
  --accent: #0B5FE6;
  --accent-dark: #0A4FBF;
  --accent-glow: rgba(11,95,230,0.08);
  --accent-soft: rgba(11,95,230,0.06);
  --green: #6BBF04;
  --green-soft: rgba(107,191,4,0.1);
  --amber: #C4952A;
  --amber-soft: rgba(196,149,42,0.1);
  --red: #B83838;
  --red-soft: rgba(184,56,56,0.08);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.ww-root {
  min-height: 100vh; background: var(--bg); color: var(--text);
  font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased;
}
.serif { font-family: 'Fraunces', Georgia, serif; letter-spacing: -0.02em; }

::selection { background: rgba(11,95,230,0.1); color: var(--accent); }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 6px; }

input[type="range"] {
  -webkit-appearance: none; width: 100%; height: 6px;
  background: var(--surface-2); border-radius: 999px; outline: none;
  position: relative; z-index: 2;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 28px; height: 28px;
  background: var(--accent); border: 4px solid var(--surface);
  border-radius: 50%; cursor: pointer;
  box-shadow: 0 2px 8px rgba(11,95,230,0.15);
  transition: transform .15s ease;
  position: relative; z-index: 3;
}
input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.12); }

.slider-ticks {
  display: flex; justify-content: space-between;
  padding: 0 12px; margin-top: -4px; position: relative; z-index: 1;
}
.slider-tick {
  display: flex; flex-direction: column; align-items: center;
}
.slider-tick-mark {
  width: 1px; height: 8px; background: var(--border-hover); border-radius: 1px;
}
.slider-tick-label {
  font-size: 9px; color: var(--text-tertiary); text-align: center;
  margin-top: 4px; font-weight: 500;
}

@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
@keyframes popIn { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
@keyframes chipAdd { 0% { opacity:0; transform:scale(0.8) translateY(4px); } 60% { transform:scale(1.05) translateY(0); } 100% { opacity:1; transform:scale(1); } }
.anim-up { animation: fadeUp .5s cubic-bezier(.16,1,.3,1) forwards; opacity:0; }
.anim-in { animation: fadeIn .4s ease forwards; opacity:0; }
.anim-slide { animation: slideIn .4s cubic-bezier(.16,1,.3,1) forwards; opacity:0; }
.anim-pop { animation: popIn .3s cubic-bezier(.16,1,.3,1) forwards; opacity:0; }
.anim-chip { animation: chipAdd .35s cubic-bezier(.16,1,.3,1) forwards; opacity:0; }
.d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}

.glow-line { height:1px; background:var(--border); }

.glass {
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03), 0 0 0 0 transparent;
  transition: border-color .25s ease, box-shadow .25s ease, transform .25s ease;
}
.glass:hover { border-color: var(--border-hover); box-shadow: 0 4px 16px rgba(0,0,0,.05); }

.input-field {
  width:100%; padding:14px 16px; background:var(--surface-2);
  border:1px solid var(--border); border-radius:12px; color:var(--text);
  font-family:'DM Sans',sans-serif; font-size:15px; outline:none; transition:all .2s ease;
}
.input-field:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); }
.input-field::placeholder { color:var(--text-tertiary); }

.input-hero {
  width:100%; padding:20px 24px; background:transparent; border:none;
  border-bottom:2px solid var(--border); color:var(--text);
  font-family:'Instrument Serif',serif; font-size:28px; outline:none;
  transition:border-color .3s ease;
}
.input-hero:focus { border-color:var(--accent); }
.input-hero::placeholder { color:var(--text-tertiary); }

.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  padding:14px 28px; border-radius:12px; font-family:'DM Sans',sans-serif;
  font-size:14px; font-weight:600; border:none; cursor:pointer;
  transition:all .25s ease; white-space:nowrap; min-height:48px;
}
.btn:disabled { opacity:.35; cursor:not-allowed; }
.btn-primary { background:#0B5FE6; color:white; box-shadow:0 4px 14px rgba(11,95,230,0.25), 0 1px 3px rgba(11,95,230,0.15); font-weight:700; }
.btn-primary:hover:not(:disabled) { background:#0A4FBF; box-shadow:0 6px 20px rgba(11,95,230,.3); transform:translateY(-2px); }
.btn-primary:active:not(:disabled) { transform:translateY(0); box-shadow:0 2px 8px rgba(11,95,230,.2); }
.btn-secondary { background:var(--surface); color:var(--text); border:1.5px solid var(--border); }
.btn-secondary:hover:not(:disabled) { background:var(--surface-2); border-color:var(--border-hover); box-shadow:0 2px 8px rgba(0,0,0,.04); }
.btn-ghost { background:transparent; color:var(--text-secondary); padding:14px 20px; }
.btn-ghost:hover { color:var(--text); background:var(--surface-2); }

.pill {
  display:inline-flex; align-items:center; gap:4px; padding:4px 10px;
  border-radius:999px; font-size:11px; font-weight:700;
  text-transform:uppercase; letter-spacing:.05em;
}

.score-btn {
  flex:1; height:50px; border-radius:12px; border:1.5px solid var(--border);
  background:var(--surface); color:var(--text-tertiary); font-weight:700;
  font-size:14px; cursor:pointer; transition:all .2s ease;
  font-family:'DM Sans',sans-serif; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:1px; min-height:48px;
}
.score-btn:hover { border-color:var(--accent); color:var(--text-secondary); background:rgba(11,95,230,0.03); }
.score-btn.active { background:#0B5FE6; border-color:#0B5FE6; color:white; box-shadow:0 4px 14px rgba(11,95,230,.2); transform:scale(1.06); }
.score-btn .score-label { font-size:8px; font-weight:600; text-transform:uppercase; letter-spacing:.03em; opacity:.7; }

.toggle-group { display:flex; background:var(--surface-2); border-radius:10px; padding:3px; gap:2px; }
.toggle-item {
  padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600;
  color:var(--text-tertiary); cursor:pointer; transition:all .2s ease;
  border:none; background:transparent; font-family:'DM Sans',sans-serif;
}
.toggle-item.active { background:var(--surface); color:var(--text); box-shadow:0 2px 6px rgba(0,0,0,.08); border:1px solid var(--border); }

.sidebar-opt {
  width:100%; text-align:left; padding:12px 14px; border-radius:12px;
  border:1px solid var(--border); background:var(--surface);
  color:var(--text-secondary); cursor:pointer; transition:all .2s ease;
  font-family:'DM Sans',sans-serif;
}
.sidebar-opt:hover { border-color:var(--border-hover); }
.sidebar-opt.active { background:var(--accent); border-color:var(--accent); color:white; box-shadow:0 4px 16px rgba(11,95,230,.15); }

.nav-btn {
  font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  color:var(--text-tertiary); cursor:pointer; transition:color .2s;
  background:none; border:none; font-family:'DM Sans',sans-serif;
  padding:4px 0; position:relative;
}
.nav-btn:hover { color:var(--text-secondary); }
.nav-btn.active { color:var(--text); }
.nav-btn.active::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:1px; background:var(--accent); }

.result-card { position:relative; padding:32px 36px; border-radius:18px; background:var(--surface); border:1.5px solid var(--border); transition:all .3s ease; box-shadow:0 1px 4px rgba(0,0,0,.03); }
.result-card.winner { border-color:#0B5FE6; border-width:2px; box-shadow:0 20px 48px rgba(11,95,230,.08), 0 8px 20px rgba(0,0,0,.04); }

.weight-dots { display:flex; gap:4px; }
.weight-dot { width:8px; height:8px; border-radius:50%; background:var(--surface-3); transition:background .2s; }
.weight-dot.filled { background:var(--accent); }

.chip {
  padding:6px 14px; border-radius:999px; font-size:13px; font-weight:500;
  background:var(--surface-2); color:var(--text-secondary);
  border:1px solid var(--border); cursor:pointer; transition:all .2s ease;
  font-family:'DM Sans',sans-serif;
}
.chip:hover { background:var(--accent-soft); color:var(--accent); border-color:rgba(11,95,230,.15); }

.factor-item {
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 20px; background:var(--surface); border:1.5px solid var(--border);
  border-radius:14px; transition:all .25s ease; box-shadow:0 1px 3px rgba(0,0,0,.03);
}
.factor-item:hover { border-color:var(--border-hover); box-shadow:0 3px 12px rgba(0,0,0,.05); }

.hint-box {
  display:flex; gap:14px; padding:18px 22px; background:rgba(11,95,230,0.04);
  border:1px solid rgba(11,95,230,0.08); border-radius:12px; margin-bottom:32px;
}

.steps { display:flex; align-items:center; margin-bottom:40px; overflow-x:auto; padding-bottom:4px; }
.step-circle { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:50%; flex-shrink:0; font-size:12px; font-weight:700; transition:all .35s cubic-bezier(.16,1,.3,1); }
.step-circle.done { background:#0B5FE6; color:white; }
.step-circle.now { background:#0B5FE6; color:white; box-shadow:0 0 0 4px rgba(11,95,230,0.12); }
.step-circle.later { background:var(--surface); color:var(--text-tertiary); border:1.5px solid var(--border); }
.step-line { flex:1; height:2px; min-width:12px; background:var(--surface-3); }
.step-line.done { background:var(--accent); }
.step-text { font-size:9px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:.05em; text-align:center; margin-top:4px; white-space:nowrap; }
.step-text.on { color:var(--text-secondary); }

.tt { position:relative; display:inline-flex; align-items:center; cursor:help; }
.tt .tt-body { display:none; position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%); background:var(--surface-3); border:1px solid var(--border-hover); border-radius:10px; padding:10px 14px; font-size:12px; color:var(--text-secondary); line-height:1.5; width:240px; z-index:100; box-shadow:0 8px 32px rgba(0,0,0,.4); font-weight:400; text-transform:none; letter-spacing:0; }
.tt:hover .tt-body { display:block; }

.bar-track { width:100%; height:8px; background:var(--surface-3); border-radius:999px; overflow:hidden; }
.bar-fill { height:100%; border-radius:999px; transition:width .8s cubic-bezier(.16,1,.3,1); }

/* Photo upload */
.photo-upload {
  position:relative; width:100%; aspect-ratio:16/10; border-radius:12px;
  border:1.5px dashed var(--border); background:var(--surface-2);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  cursor:pointer; transition:all .2s ease; overflow:hidden;
  margin-bottom:12px;
}
.photo-upload:hover { border-color:var(--accent); background:var(--accent-soft); }
.photo-upload img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
.photo-upload .photo-overlay {
  position:absolute; inset:0; background:rgba(0,0,0,.5); display:flex;
  align-items:center; justify-content:center; opacity:0; transition:opacity .2s;
}
.photo-upload:hover .photo-overlay { opacity:1; }

/* Option card photo thumb */
.opt-thumb {
  width:56px; height:56px; border-radius:10px; background:var(--surface-2);
  border:1px solid var(--border); display:flex; align-items:center;
  justify-content:center; overflow:hidden; flex-shrink:0;
}
.opt-thumb img { width:100%; height:100%; object-fit:cover; }

/* Result photo */
.result-photo {
  width:64px; height:64px; border-radius:12px; background:var(--surface-2);
  border:1px solid var(--border); overflow:hidden; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
}
.result-photo img { width:100%; height:100%; object-fit:cover; }

/* Logo SVG inline */
.ww-logo { display:flex; align-items:center; gap:10px; cursor:pointer; }
.ww-logo svg { width:34px; height:34px; }

/* Loading animation */
@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
.loading-dots::after {
  content: '...';
  animation: dotPulse 1.4s infinite;
}

/* Dashboard card */
.decision-card {
  padding: 20px; border-radius: 16px; background: var(--surface);
  border: 1px solid var(--border); cursor: pointer;
  transition: all 0.2s ease; position: relative;
}
.decision-card:hover { border-color: var(--border-hover); box-shadow: 0 4px 20px rgba(0,0,0,.15); transform: translateY(-1px); }

/* Mobile responsive */
@media (max-width: 640px) {
  .options-grid { grid-template-columns: 1fr !important; }
  .scoring-layout { flex-direction: column !important; }
  .scoring-sidebar { width: 100% !important; }
  .scoring-sidebar-inner {
    display: flex !important;
    flex-direction: row !important;
    gap: 6px !important;
    overflow-x: auto !important;
    padding-bottom: 8px !important;
  }
  .scoring-sidebar-inner .sidebar-opt {
    min-width: 120px !important;
    flex-shrink: 0 !important;
  }
  .opt-card-actions { flex-direction: column; gap: 4px !important; }
  .score-btn { height: 42px !important; }
  .score-btn .score-label { display: none !important; }
}

`;

// --- Components ---
const StepProgress = ({ currentStep }) => (
  <div className="steps">
    {STEPS.map((s, i) => (
      <React.Fragment key={s.num}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div className={`step-circle ${s.num < currentStep ? 'done' : s.num === currentStep ? 'now' : 'later'}`}>
            {s.num < currentStep ? <Check size={14} /> : s.num}
          </div>
          <div className={`step-text ${s.num === currentStep ? 'on' : ''}`}>{s.label}</div>
        </div>
        {i < STEPS.length - 1 && <div className={`step-line ${s.num < currentStep ? 'done' : ''}`} />}
      </React.Fragment>
    ))}
  </div>
);

const Hint = ({ icon: Icon = Lightbulb, children }) => (
  <div className="hint-box anim-in">
    <Icon size={16} style={{ color:'var(--accent)', flexShrink:0, marginTop:2 }} />
    <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.55 }}>{children}</div>
  </div>
);

const SL = ({ children }) => (
  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{children}</div>
);

const Tt = ({ text, children }) => (
  <span className="tt">{children}<span className="tt-body">{text}</span></span>
);

// Logo matching the uploaded image (compass/balance W mark)
const Logo = ({ onClick }) => (
  <div className="ww-logo" onClick={onClick}>
    <svg viewBox="0 0 44 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width:36, height:26 }}>
      <defs>
        <linearGradient id="blueToGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B5FE6"/>
          <stop offset="45%" stopColor="#0B5FE6"/>
          <stop offset="100%" stopColor="#6BBF04"/>
        </linearGradient>
      </defs>
      {/* Left V of W - blue */}
      <path d="M2 4 L10 28 L18 10" stroke="#0B5FE6" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Middle down-stroke - blue transitioning to green in bottom half */}
      <path d="M18 10 L26 28" stroke="url(#blueToGreen)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Right leg as checkmark - green */}
      <path d="M26 28 L42 2" stroke="#6BBF04" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
    <div>
      <span style={{ fontWeight:800, fontSize:17, letterSpacing:'-0.02em', color:'#0B5FE6' }}>Weigh</span>
      <span style={{ fontWeight:800, fontSize:17, letterSpacing:'-0.02em', color:'#6BBF04' }}>Wise</span>
    </div>
  </div>
);

// Photo upload component
const PhotoUpload = ({ image, onUpload, onRemove, compact = false }) => {
  const inputRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(ev.target.result);
    reader.readAsDataURL(file);
  };

  if (compact) {
    return (
      <div className="opt-thumb" onClick={() => inputRef.current?.click()} style={{ cursor:'pointer' }}>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
        {image ? <img src={image} alt="" /> : <Camera size={18} style={{ color:'var(--text-tertiary)' }} />}
      </div>
    );
  }

  return (
    <div className="photo-upload" onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
      {image ? (
        <>
          <img src={image} alt="" />
          <div className="photo-overlay">
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ padding:'8px 14px', background:'rgba(255,255,255,.15)', borderRadius:8, color:'white', fontSize:12, fontWeight:600, backdropFilter:'blur(8px)' }}>
                Change photo
              </div>
              <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ padding:'8px 12px', background:'rgba(255,255,255,.15)', borderRadius:8, color:'white', border:'none', cursor:'pointer', backdropFilter:'blur(8px)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <ImagePlus size={24} style={{ color:'var(--text-tertiary)', marginBottom:6 }} />
          <span style={{ fontSize:12, color:'var(--text-tertiary)', fontWeight:500 }}>Add a photo</span>
          <span style={{ fontSize:10, color:'var(--text-tertiary)', opacity:.6, marginTop:2 }}>Optional. Helps you visualize</span>
        </>
      )}
    </div>
  );
};

// --- Pages ---

const DashboardPage = ({ decisions, onNewDecision, onLoadDecision, onDeleteDecision, loading }) => {
  if (loading) {
    return (
      <div style={{ maxWidth:640, margin:'0 auto', padding:'80px 20px', textAlign:'center' }}>
        <div className="anim-up">
          <div style={{ width:48, height:48, borderRadius:14, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <RotateCcw size={22} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }} />
          </div>
          <p style={{ color:'var(--text-secondary)' }}>Loading your decisions...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'60px 20px' }}>
      <div className="anim-up" style={{ marginBottom:40 }}>
        <h1 className="serif" style={{ fontSize:42, fontWeight:400, lineHeight:1.12 }}>
          Your<br/><span style={{ fontStyle:'italic', color:'var(--accent)' }}>decisions</span>
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:15, marginTop:12, lineHeight:1.65 }}>
          Pick up where you left off, or start something new.
        </p>
      </div>

      <button className="btn btn-primary anim-up d1" onClick={onNewDecision} style={{ width:'100%', padding:'16px 24px', fontSize:15, marginBottom:32 }}>
        <Plus size={18} /> Start a new decision
      </button>

      {decisions.length > 0 && (
        <div className="anim-up d2">
          <SL>Past decisions · {decisions.length}</SL>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {decisions.map((d, i) => {
              const optCount = d.options?.length || 0;
              const factorCount = d.factors?.length || 0;
              const readyCount = d.options?.filter(o => {
                if (!d.factors?.length) return false;
                const mp = d.factors.filter(f => f.type==='preference').filter(f => !d.scores?.[o.id]?.[f.id]).length;
                const mm = d.factors.filter(f => f.type==='must-have').filter(f => !d.mhChecks?.[o.id]?.[f.id]).length;
                return mp === 0 && mm === 0;
              }).length || 0;

              // Determine status
              let status, statusColor;
              if (factorCount === 0) { status = 'Just started'; statusColor = 'var(--text-tertiary)'; }
              else if (optCount === 0) { status = 'Needs options'; statusColor = 'var(--amber)'; }
              else if (readyCount < optCount) { status = `${readyCount}/${optCount} rated`; statusColor = 'var(--amber)'; }
              else { status = 'Complete'; statusColor = 'var(--green)'; }

              // Best score
              let bestOption = null;
              if (readyCount > 0 && d.factors?.length) {
                const prefs = d.factors.filter(f => f.type === 'preference');
                d.options.forEach(o => {
                  if (prefs.length === 0) return;
                  const fails = d.factors.filter(f => f.type==='must-have').some(f => d.mhChecks?.[o.id]?.[f.id]==='fail');
                  if (fails) return;
                  let tw=0, ws=0;
                  prefs.forEach(f => { ws += (d.scores?.[o.id]?.[f.id]||0)*f.weight; tw += f.weight*7; });
                  const sc = tw > 0 ? Math.round((ws/tw)*100) : 0;
                  if (!bestOption || sc > bestOption.score) bestOption = { name: o.name, score: sc };
                });
              }

              const timeAgo = (ts) => {
                const diff = Date.now() - ts;
                const mins = Math.floor(diff/60000);
                if (mins < 1) return 'Just now';
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins/60);
                if (hrs < 24) return `${hrs}h ago`;
                const days = Math.floor(hrs/24);
                if (days === 1) return 'Yesterday';
                if (days < 30) return `${days}d ago`;
                return new Date(ts).toLocaleDateString('en-US', { month:'short', day:'numeric' });
              };

              return (
                <div key={d.id} className="decision-card anim-slide" style={{ animationDelay:`${i*0.05}s` }} onClick={() => onLoadDecision(d.id)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:16, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap' }}>
                        <div className="pill" style={{ background: statusColor === 'var(--green)' ? 'var(--green-soft)' : statusColor === 'var(--amber)' ? 'var(--amber-soft)' : 'var(--surface-2)', color: statusColor }}>
                          {status}
                        </div>
                        {factorCount > 0 && <span style={{ fontSize:11, color:'var(--text-tertiary)' }}>{factorCount} factors</span>}
                        {optCount > 0 && <span style={{ fontSize:11, color:'var(--text-tertiary)' }}>{optCount} options</span>}
                      </div>
                      {bestOption && (
                        <div style={{ marginTop:8, fontSize:12, color:'var(--text-secondary)' }}>
                          <Trophy size={11} style={{ color:'var(--accent)', marginRight:4 }} />
                          {bestOption.name}: {bestOption.score}% fit
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                      <span style={{ fontSize:11, color:'var(--text-tertiary)' }}>{timeAgo(d.updatedAt)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteDecision(d.id); }}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', padding:4, borderRadius:6, transition:'color .15s' }}
                        title="Delete decision"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {decisions.length === 0 && (
        <div className="anim-up d2" style={{ textAlign:'center', padding:'48px 20px', border:'1px dashed var(--border)', borderRadius:16 }}>
          <FolderOpen size={36} style={{ color:'var(--text-tertiary)', margin:'0 auto 12px' }} />
          <p style={{ color:'var(--text-tertiary)', fontSize:14 }}>No decisions yet. Start your first one above.</p>
        </div>
      )}
    </div>
  );
};

const HeroVisual = () => {
  const C = { blue:'#2952CC', blue50:'#EEF2FF', blue100:'#D9E2FF', blue400:'#5B85F5', green:'#2E7D4F', greenBg:'#F0F9F3', greenBorder:'#C4E5D0', greenDot:'#3DA66A', gold:'#B8860B', goldBg:'#FFF9EB', goldBorder:'#F0DDA0', red:'#C9303E', redBg:'#FFF0F1', redBorder:'#FCCDD1', gray:'#7C8694', grayLight:'#F5F6F8', grayBorder:'#E4E7EC', grayDot:'#D0D5DD', mutedDot:'#C8CCD3', dark:'#1A2233', mid:'#4A5362', soft:'#8C95A3', white:'#FFF' };
  const Dots = ({filled,total,color,muted}) => <div style={{display:'flex',gap:4,justifyContent:'center'}}>{Array.from({length:total},(_,i)=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:i<filled?(muted?C.mutedDot:color):(muted?'#E8EAED':C.grayDot),opacity:muted?0.6:1}}/>)}</div>;
  const Tag = ({label,color,bg,border}) => <span style={{fontSize:11,fontWeight:600,color,background:bg,border:`1px solid ${border}`,padding:'3px 10px',borderRadius:6,whiteSpace:'nowrap'}}>{label}</span>;
  const Icon = ({bg,icon}) => <div style={{width:24,height:24,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,background:bg,flexShrink:0}}>{icon}</div>;

  const criteria = [
    {name:'Rent',icon:{bg:'#E8F5E9',i:'💰'},tag:{label:'Must-have',color:C.green,bg:C.greenBg,border:C.greenBorder}},
    {name:'Commute',icon:{bg:'#E3F2FD',i:'🚇'},tag:{label:'Very important',color:C.blue,bg:C.blue50,border:C.blue100}},
    {name:'Natural light',icon:{bg:'#FFF8E1',i:'☀️'},tag:{label:'Nice to have',color:C.gray,bg:C.grayLight,border:C.grayBorder}},
    {name:'Pet policy',icon:{bg:'#FFF3E0',i:'🐾'},tag:{label:'Dealbreaker',color:C.gold,bg:C.goldBg,border:C.goldBorder}},
  ];
  const apts = [{short:'Greenpoint 1BR',scores:[4,3,3],pet:true},{short:'UWS Studio',scores:[5,5,4],pet:true},{short:'Bushwick Loft',scores:[4,2,5],pet:false}];
  const dotC = [C.greenDot, C.blue400, '#B09AE0'];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10,fontSize:13}}>
      {/* Decision header */}
      <div style={{background:C.white,borderRadius:16,padding:'18px 22px',boxShadow:'0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',display:'flex',alignItems:'center',gap:14}}>
        <div style={{width:40,height:40,borderRadius:12,background:C.blue50,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🏠</div>
        <div style={{fontSize:18,fontWeight:700,color:C.dark,lineHeight:1.25}}>Which apartment should I rent?</div>
      </div>

      {/* What matters */}
      <div style={{background:C.white,borderRadius:16,padding:'16px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)'}}>
        <div style={{fontSize:12,fontWeight:700,color:C.dark,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.04em'}}>What matters</div>
        <div style={{display:'flex',flexDirection:'column',gap:9}}>
          {criteria.map((cr,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
              <Icon bg={cr.icon.bg} icon={cr.icon.i}/>
              <span style={{fontSize:14,fontWeight:500,color:C.mid,flex:1}}>{cr.name}</span>
              <Tag {...cr.tag}/>
            </div>
          ))}
        </div>
      </div>

      {/* Compare */}
      <div style={{background:C.white,borderRadius:16,padding:'16px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)'}}>
        <div style={{fontSize:12,fontWeight:700,color:C.dark,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.04em'}}>Compare options</div>
        <div style={{display:'grid',gridTemplateColumns:'90px 1fr 1fr 1fr',gap:0,marginBottom:10}}>
          <div/>
          {apts.map((a,i)=><div key={i} style={{textAlign:'center',fontSize:10,fontWeight:700,color:a.pet?C.mid:C.soft,opacity:a.pet?1:0.55,lineHeight:1.2}}>{a.short}</div>)}
        </div>
        {['Rent','Commute','Natural light'].map((name,ri)=>(
          <div key={ri} style={{display:'grid',gridTemplateColumns:'90px 1fr 1fr 1fr',alignItems:'center',padding:'7px 0',borderBottom:`1px solid ${C.grayBorder}`}}>
            <span style={{fontSize:12,fontWeight:500,color:C.mid}}>{name}</span>
            {apts.map((a,ai)=><div key={ai} style={{display:'flex',justifyContent:'center'}}><Dots filled={a.scores[ri]} total={5} color={dotC[ri]} muted={!a.pet}/></div>)}
          </div>
        ))}
        <div style={{display:'grid',gridTemplateColumns:'90px 1fr 1fr 1fr',alignItems:'center',padding:'8px 0'}}>
          <span style={{fontSize:12,fontWeight:500,color:C.mid}}>Pet policy</span>
          {apts.map((a,ai)=><div key={ai} style={{display:'flex',justifyContent:'center'}}>{a.pet?<span style={{fontSize:10,fontWeight:700,color:C.green,background:C.greenBg,padding:'2px 8px',borderRadius:4}}>✓ Pass</span>:<span style={{fontSize:10,fontWeight:700,color:C.red,background:C.redBg,padding:'2px 8px',borderRadius:4}}>✕ Fail</span>}</div>)}
        </div>
      </div>

      {/* Ranking */}
      <div style={{background:C.white,borderRadius:16,padding:'16px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)'}}>
        <div style={{fontSize:12,fontWeight:700,color:C.dark,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.04em'}}>Your ranking</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {/* Winner */}
          <div style={{background:'linear-gradient(135deg, #F0F9F3 0%, #EEF8F1 100%)',border:`1.5px solid ${C.greenBorder}`,borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:28,height:28,borderRadius:8,background:'#DCF0E3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>🏆</div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.dark}}>UWS Studio</div><div style={{fontSize:11,color:C.soft,fontWeight:500,marginTop:2,fontStyle:'italic'}}>Top scores on rent & commute</div></div>
            <div style={{textAlign:'right'}}><span style={{fontSize:22,fontWeight:700,color:C.green,lineHeight:1}}>91<span style={{fontSize:13,fontWeight:600}}>%</span></span><div style={{fontSize:9,fontWeight:600,color:C.soft,textTransform:'uppercase',letterSpacing:'0.06em'}}>fit</div></div>
          </div>
          {/* #2 */}
          <div style={{border:`1px solid ${C.grayBorder}`,borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:28,height:28,borderRadius:8,background:C.grayLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:C.soft,flexShrink:0}}>#2</div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.dark}}>Greenpoint 1BR</div><div style={{fontSize:11,color:C.soft,fontWeight:500,marginTop:2,fontStyle:'italic'}}>Good value, longer commute</div></div>
            <div style={{textAlign:'right'}}><span style={{fontSize:22,fontWeight:700,color:C.mid,lineHeight:1}}>74<span style={{fontSize:13,fontWeight:600}}>%</span></span><div style={{fontSize:9,fontWeight:600,color:C.soft,textTransform:'uppercase',letterSpacing:'0.06em'}}>fit</div></div>
          </div>
          {/* #3 eliminated */}
          <div style={{border:`1.5px solid ${C.redBorder}`,borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:12,opacity:0.7}}>
            <div style={{width:28,height:28,borderRadius:8,background:C.redBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:C.red,flexShrink:0}}>#3</div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.soft}}>Bushwick Loft</div><div style={{fontSize:11,color:C.red,fontWeight:500,marginTop:2}}>✕ Dealbreaker: Pet policy</div></div>
            <div style={{textAlign:'right'}}><span style={{fontSize:22,fontWeight:700,color:C.soft,lineHeight:1,textDecoration:'line-through',textDecorationColor:C.red}}>68<span style={{fontSize:13,fontWeight:600}}>%</span></span><div style={{fontSize:9,fontWeight:600,color:C.soft,textTransform:'uppercase',letterSpacing:'0.06em'}}>fit</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StartPage = ({ decisionTitle, setDecisionTitle, onNext, hasExistingDecisions, onViewDecisions }) => (
  <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 24px 48px' }}>
    {/* Two-column hero: copy + input left, visual right */}
    <div className="anim-up hero-row" style={{ display:'flex', gap:56, alignItems:'flex-start', marginBottom:40 }}>
      {/* Left: copy + input stacked */}
      <div style={{ flex:1, minWidth:0 }}>
        <h1 className="serif" style={{ fontSize:52, fontWeight:400, lineHeight:1.12, marginBottom:20 }}>
          A smarter pros and cons list <span style={{ fontStyle:'italic', color:'var(--accent)' }}>for </span><span style={{ fontStyle:'italic', color:'var(--accent)', textDecoration:'underline', textDecorationColor:'#6BBF04', textUnderlineOffset:'6px', textDecorationThickness:'3px' }}>big decisions</span><span style={{ fontStyle:'italic', color:'var(--accent)' }}>.</span> <span style={{ color:'#6BBF04', fontSize:'0.65em', verticalAlign:'middle' }}>✓</span>
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:19, lineHeight:1.7, maxWidth:520, marginBottom:36 }}>
          Define what matters, mark your dealbreakers, and rate each option against the same priorities, so your clearest choice is easier to see.
        </p>

        {/* Input section - directly under the copy, full width of left column */}
        <div className="glass" style={{ padding:28 }}>
          <label style={{ display:'block', fontSize:14, fontWeight:600, color:'var(--text-secondary)', marginBottom:8 }}>What are you deciding?</label>
          <input className="input-hero" placeholder="e.g. Which apartment should I rent?" value={decisionTitle} onChange={e => setDecisionTitle(e.target.value)} autoFocus style={{ fontSize:24 }} />
          <div style={{ marginTop:14, display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
            <span style={{ fontSize:11, color:'var(--text-tertiary)', marginRight:4 }}>Try one:</span>
            {["Which job offer should I accept?","What type of dog should I get?","Which project should I prioritize?","Which product idea should I build first?","What city should I move to?"].map(ex => (
              <button key={ex} className="chip" style={{ fontSize:12 }} onClick={() => setDecisionTitle(ex)}>{ex}</button>
            ))}
          </div>
          <button className="btn btn-primary" disabled={!decisionTitle.trim()} onClick={onNext} style={{ width:'100%', marginTop:20, padding:'16px 24px', fontSize:15 }}>
            Start my decision map <ArrowRight size={16} />
          </button>
        </div>
        {hasExistingDecisions && (
          <button onClick={onViewDecisions} className="btn btn-ghost anim-up d3" style={{ width:'100%', marginTop:12, justifyContent:'center' }}>
            <FolderOpen size={14} /> View my saved decisions
          </button>
        )}
      </div>
      {/* Right: visual */}
      <div className="anim-up d2 hero-visual" style={{ width:420, flexShrink:0 }}>
        <HeroVisual />
      </div>
    </div>

    {/* Mobile: stack */}
    <style>{`
      @media (max-width: 900px) {
        .hero-row {
          flex-direction: column !important;
          gap: 32px !important;
        }
        .hero-visual {
          width: 100% !important;
          flex-shrink: 1 !important;
        }
        .hero-row h1 {
          font-size: 36px !important;
        }
        .hero-row p {
          font-size: 16px !important;
        }
      }
    `}</style>
  </div>
);

const FactorsPage = ({ factors, addFactor, removeFactor, updateFactor, suggestions, suggestionsLoading, sugError, onRegenerate, onBack, onNext }) => {
  const [v, setV] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const add = () => { if (v.trim()) { addFactor(v); setV(""); } };

  const getPlaceholder = (name) => {
    return 'e.g. What does "' + name + '" mean to you in this decision?';
  };

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'48px 20px' }}>
      <StepProgress currentStep={1} />
      <div className="anim-up" style={{ marginBottom:24 }}>
        <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginTop:12 }}>What matters to you in this decision?</h1>
        <p style={{ color:'var(--text-secondary)', marginTop:8, lineHeight:1.6 }}>We came up with some suggestions based on your decision. Tap the ones that matter, edit them, or add your own.</p>
      </div>
      <Hint><strong>Tip:</strong> Think about what you'd compare between your options. What would make one choice better than another for <em>you</em>?</Hint>
      <div className="glass anim-up d1" style={{ padding:24, marginBottom:24 }}>
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          <input className="input-field" placeholder="Type something that matters to you..." value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key==='Enter' && add()} />
          <button className="btn btn-primary" onClick={add} style={{ padding:'12px 20px' }}><Plus size={16} /></button>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          <div style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:11, color:'var(--text-tertiary)' }}>
              {suggestionsLoading ? 'Generating suggestions...' : 'Suggested for your decision:'}
            </span>
            {!suggestionsLoading && (
              <button onClick={onRegenerate} style={{ fontSize:11, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontWeight:600 }}>
                <Sparkles size={10} style={{ marginRight:3 }} />Regenerate
              </button>
            )}
          </div>
          {suggestionsLoading ? (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="chip" style={{ opacity:.3, pointerEvents:'none', minWidth:80 }}>
                  <span style={{ visibility:'hidden' }}>Loading...</span>
                </div>
              ))}
            </div>
          ) : (
            suggestions.filter(s => !factors.find(f => f.name.toLowerCase()===s.toLowerCase())).map(s => (
              <button key={s} className="chip" onClick={() => addFactor(s)}>+ {s}</button>
            ))
          )}
          {sugError && (
            <div style={{ width:'100%', marginTop:8, padding:'8px 12px', background:'var(--red-soft)', borderRadius:8, fontSize:11, color:'var(--red)', wordBreak:'break-all' }}>
              Debug: {sugError}
            </div>
          )}
        </div>
      </div>
      {factors.length > 0 && (
        <div className="anim-in" style={{ marginBottom:40 }}>
          <SL>Added · {factors.length}</SL>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {factors.map((f,i) => (
              <div key={f.id} className="factor-item anim-slide" style={{ animationDelay:`${i*0.03}s`, flexDirection:'column', alignItems:'stretch', padding:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    <span style={{ fontWeight:600 }}>{f.name}</span>
                    {f.meaning && <span style={{ fontSize:11, color:'var(--text-tertiary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>({f.meaning})</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                    {!f.meaning && expandedId !== f.id && (
                      <button
                        onClick={() => setExpandedId(f.id)}
                        style={{ fontSize:11, color:'var(--accent)', background:'rgba(11,95,230,0.06)', border:'1px solid rgba(11,95,230,0.12)', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:999, transition:'all .2s' }}
                      >
                        <Pencil size={10} /> Define this
                      </button>
                    )}
                    {f.meaning && expandedId !== f.id && (
                      <button
                        onClick={() => setExpandedId(f.id)}
                        style={{ background:'rgba(11,95,230,0.04)', border:'1px solid rgba(11,95,230,0.08)', cursor:'pointer', color:'var(--text-tertiary)', padding:'5px 10px', borderRadius:999, display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:600, fontFamily:'DM Sans, sans-serif', transition:'all .2s' }}
                      >
                        <Pencil size={10} /> Edit
                      </button>
                    )}
                    <button onClick={() => removeFactor(f.id)} style={{ border:'none', background:'transparent', cursor:'pointer', color:'var(--text-tertiary)', padding:4, borderRadius:6 }}><X size={14} /></button>
                  </div>
                </div>
                {expandedId === f.id && (
                  <div style={{ padding:'0 18px 14px', borderTop:'1px solid var(--border)' }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-secondary)', marginTop:12, marginBottom:6 }}>
                      What does "{f.name}" mean to you in this decision?
                    </label>
                    <div style={{ display:'flex', gap:6 }}>
                      <input
                        className="input-field"
                        placeholder={getPlaceholder(f.name)}
                        value={f.meaning || ""}
                        onChange={e => updateFactor(f.id, { meaning: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && setExpandedId(null)}
                        style={{ fontSize:13 }}
                        autoFocus
                      />
                      <button className="btn btn-ghost" onClick={() => setExpandedId(null)} style={{ padding:'8px 12px', fontSize:12 }}>Done</button>
                    </div>
                    <p style={{ fontSize:10, color:'var(--text-tertiary)', marginTop:6, fontStyle:'italic' }}>Optional. Helps you score options more consistently later.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={16}/> Back</button>
        <button className="btn btn-primary" disabled={!factors.length} onClick={onNext}>Next: Dealbreakers <ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

const ClassifyPage = ({ factors, updateFactor, onBack, onNext }) => (
  <div style={{ maxWidth:720, margin:'0 auto', padding:'48px 20px' }}>
    <StepProgress currentStep={2} />
    <div className="anim-up" style={{ marginBottom:24 }}>
      <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginTop:12 }}>Are any of these dealbreakers?</h1>
      <p style={{ color:'var(--text-secondary)', marginTop:8, lineHeight:1.6 }}>
        A <strong style={{ color:'var(--text)' }}>dealbreaker</strong> eliminates any option that doesn't meet it.
        A <strong style={{ color:'var(--text)' }}>preference</strong> gets weighted and scored, but won't disqualify an option on its own.
      </p>
    </div>
    <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:40 }}>
      {factors.map((f,i) => (
        <div key={f.id} className="glass anim-up" style={{ padding:22, animationDelay:`${i*0.05}s`, borderColor: f.type==='must-have' ? 'rgba(196,149,42,0.3)' : undefined, borderLeft: f.type==='must-have' ? '4px solid #C4952A' : undefined }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div style={{ fontWeight:600, fontSize:16 }}>{f.name}</div>
            <div className="toggle-group">
              <button className={`toggle-item ${f.type==='must-have'?'active':''}`} onClick={() => updateFactor(f.id,{type:'must-have'})} style={f.type==='must-have'?{color:'#B8860B', background:'rgba(196,149,42,0.1)', border:'1px solid rgba(196,149,42,0.2)'}:{}}>
                <Lock size={12} style={{ marginRight:4 }} /> Dealbreaker
              </button>
              <button className={`toggle-item ${f.type==='preference'?'active':''}`} onClick={() => updateFactor(f.id,{type:'preference'})}>
                <SlidersHorizontal size={12} style={{ marginRight:4 }} /> Preference
              </button>
            </div>
          </div>
          {f.type==='must-have' && (
            <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:8 }}>
                What's your minimum? <span style={{ fontWeight:400, color:'var(--text-tertiary)' }}>(optional)</span>
              </label>
              <input className="input-field" placeholder='e.g. "At least $120k" or "Must be under $3,000/month"' value={f.passCondition||""} onChange={e => updateFactor(f.id,{passCondition:e.target.value})} style={{ fontSize:13 }} />
            </div>
          )}
        </div>
      ))}
    </div>
    <div style={{ display:'flex', justifyContent:'space-between' }}>
      <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={16}/> Back</button>
      <button className="btn btn-primary" onClick={onNext}>Next: Set priorities <ChevronRight size={16} /></button>
    </div>
  </div>
);

const WeightPage = ({ factors, updateFactor, onBack, onNext }) => {
  const prefs = factors.filter(f => f.type === 'preference');
  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'48px 20px' }}>
      <StepProgress currentStep={3} />
      <div className="anim-up" style={{ marginBottom:24 }}>
        <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginTop:12 }}>How much does each one influence your decision?</h1>
        <p style={{ color:'var(--text-secondary)', marginTop:8, lineHeight:1.6 }}>Not everything matters equally. Slide each factor to show how much weight it should carry in your final ranking.</p>
      </div>
      <Hint>If two options are close, the factors you rank highest here are the ones that break the tie.</Hint>
      {prefs.length===0 ? (
        <div className="glass" style={{ textAlign:'center', padding:48 }}>
          <Lock style={{ color:'var(--text-tertiary)', margin:'0 auto 16px' }} size={40} />
          <p style={{ color:'var(--text-secondary)' }}>All your factors are dealbreakers. Skip ahead!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:40 }}>
          {prefs.map((f,i) => (
            <div key={f.id} className="glass anim-up" style={{ padding:24, animationDelay:`${i*0.05}s` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <span style={{ fontWeight:600, fontSize:16 }}>{f.name}</span>
                  {f.meaning && <div style={{ fontSize:12, color:'var(--text-tertiary)', marginTop:3, fontStyle:'italic' }}>{f.meaning}</div>}
                </div>
                <div className="pill" style={{ background:'var(--accent-soft)', color:'var(--accent)', flexShrink:0 }}>{WEIGHT_LABELS[f.weight]}</div>
              </div>
              <input type="range" min="1" max="7" step="1" value={f.weight} onChange={e => updateFactor(f.id,{weight:parseInt(e.target.value)})} />
              <div className="slider-ticks">
                {[1,2,3,4,5,6,7].map(n => (
                  <div key={n} className="slider-tick">
                    <div className="slider-tick-mark" />
                    <div className="slider-tick-label">{n}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10, fontWeight:700, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'.04em' }}>
                <span>Doesn't move the needle much</span>
                <span>Major factor in my decision</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={16}/> Back</button>
        <button className="btn btn-primary" onClick={onNext}>Review my criteria <ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

const LensSummary = ({ decisionTitle, factors, onBack, onNext }) => {
  const mh = factors.filter(f => f.type==='must-have');
  const pr = factors.filter(f => f.type==='preference').sort((a,b) => b.weight-a.weight);
  return (
    <div style={{ maxWidth:620, margin:'0 auto', padding:'48px 20px' }}>
      <StepProgress currentStep={4} />
      <div className="anim-up" style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{ width:56, height:56, borderRadius:16, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><ListChecks size={28} style={{ color:'var(--accent)' }} /></div>
        <h1 className="serif" style={{ fontSize:36, fontWeight:400 }}>Here's what you care about</h1>
        <p style={{ color:'var(--text-secondary)', marginTop:8 }}>Every option will be measured against these criteria.</p>
      </div>
      <div className="glass anim-up d2" style={{ overflow:'hidden', padding:0, marginBottom:28 }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface-2)' }}>
          <div style={{ fontSize:11, color:'var(--text-tertiary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Your Decision</div>
          <div className="serif" style={{ fontSize:20 }}>{decisionTitle}</div>
        </div>
        <div style={{ padding:24 }}>
          {mh.length>0 && (
            <div style={{ marginBottom:24 }}>
              <SL><Tt text="If an option fails any of these, it's eliminated."><span style={{ display:'flex', alignItems:'center', gap:6 }}>Dealbreakers <HelpCircle size={11} style={{ color:'var(--text-tertiary)' }} /></span></Tt></SL>
              {mh.map(f => (
                <div key={f.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0' }}>
                  <Lock size={14} style={{ color:'var(--amber)', flexShrink:0 }} />
                  <span style={{ fontWeight:500 }}>{f.name}</span>
                  {f.passCondition && <span style={{ fontSize:13, color:'var(--text-tertiary)' }}>({f.passCondition})</span>}
                </div>
              ))}
            </div>
          )}
          {pr.length>0 && (
            <div>
              <SL><Tt text="More dots = higher priority. Options score more when they do well on high-priority items."><span style={{ display:'flex', alignItems:'center', gap:6 }}>Preferences (by priority) <HelpCircle size={11} style={{ color:'var(--text-tertiary)' }} /></span></Tt></SL>
              {pr.map(f => (
                <div key={f.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ minWidth:0 }}>
                    <span style={{ fontWeight:500 }}>{f.name}</span>
                    {f.meaning && <div style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:2, fontStyle:'italic' }}>{f.meaning}</div>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, color:'var(--text-tertiary)' }}>{WEIGHT_LABELS[f.weight]}</span>
                    <div className="weight-dots">{[...Array(7)].map((_,i) => <div key={i} className={`weight-dot ${i<f.weight?'filled':''}`} />)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Hint icon={CheckCircle2}><strong>Looking good?</strong> Next you'll add the options you're choosing between. You can come back and change this anytime.</Hint>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={16}/> Back</button>
        <button className="btn btn-primary" onClick={onNext}>Now add your options <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};

const OptionsPage = ({ options, addOption, removeOption, updateOptionImage, getOptionStatus, onBack, onNext, onScoreOption }) => {
  const [nm, setNm] = useState(""); const [nt, setNt] = useState(""); const [img, setImg] = useState(null);
  const [showForm, setShowForm] = useState(options.length === 0);
  const add = () => { if (nm.trim()) { addOption(nm, nt, img); setNm(""); setNt(""); setImg(null); setShowForm(false); } };
  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'48px 20px' }}>
      <StepProgress currentStep={5} />
      <div className="anim-up" style={{ marginBottom:24 }}>
        <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginTop:12 }}>What are your options?</h1>
        <p style={{ color:'var(--text-secondary)', marginTop:8, lineHeight:1.6 }}>Add the choices you're deciding between. You can upload photos to help you visualize each one.</p>
      </div>

      {/* Add form — collapsible on mobile after first option */}
      {showForm || options.length === 0 ? (
        <div className="glass anim-up d1" style={{ padding:20, marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontWeight:600, fontSize:14 }}>Add an option</div>
            {options.length > 0 && (
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', padding:4 }}><X size={16} /></button>
            )}
          </div>
          <PhotoUpload image={img} onUpload={setImg} onRemove={() => setImg(null)} />
          <input className="input-field" placeholder='e.g. "The Maple St house"' value={nm} onChange={e => setNm(e.target.value)} onKeyDown={e => e.key==='Enter'&&add()} style={{ marginBottom:8 }} />
          <textarea className="input-field" placeholder="Notes to yourself (optional)" value={nt} onChange={e => setNt(e.target.value)} style={{ height:56, resize:'none', marginBottom:12 }} />
          <button className="btn btn-primary" style={{ width:'100%' }} onClick={add}><Plus size={14} /> Add option</button>
        </div>
      ) : (
        <button className="btn btn-secondary anim-in" onClick={() => setShowForm(true)} style={{ marginBottom:24, width:'100%', padding:'14px 24px' }}>
          <Plus size={16} /> Add another option
        </button>
      )}

      {/* Options list */}
      {options.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:40 }}>
          {options.map((o,i) => {
            const st = getOptionStatus(o.id);
            const cfg = st==='Ready'?{bg:'var(--green-soft)',c:'var(--green)',l:'Scored'}:st==='Fails Must-Haves'?{bg:'var(--red-soft)',c:'var(--red)',l:'Fails a dealbreaker'}:{bg:'var(--amber-soft)',c:'var(--amber)',l:'Needs rating'};
            return (
              <div key={o.id} className="glass anim-slide" style={{ padding:'14px 18px', animationDelay:`${i*0.04}s` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                  <div style={{ display:'flex', gap:14, alignItems:'center', minWidth:0, flex:1 }}>
                    <PhotoUpload image={o.image} onUpload={(img) => updateOptionImage(o.id, img)} onRemove={() => updateOptionImage(o.id, null)} compact />
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.name}</div>
                      {o.notes && <div style={{ fontSize:12, color:'var(--text-tertiary)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.notes}</div>}
                      <div className="pill" style={{ marginTop:5, background:cfg.bg, color:cfg.c }}>{cfg.l}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                    <button className="btn btn-secondary" onClick={() => onScoreOption(o.id)} style={{ padding:'8px 16px', fontSize:12 }}>Rate it</button>
                    <button onClick={() => removeOption(o.id)} style={{ border:'none', cursor:'pointer', background:'transparent', color:'var(--text-tertiary)', padding:4, borderRadius:6 }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={16} /> Back</button>
        <button className="btn btn-primary" disabled={options.length<2} onClick={onNext}>
          {options.length<2?`Add ${2-options.length} more option${options.length===0?'s':''}`:'Rate your options'} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const ScoringPage = ({ options, factors, scores, setScore, mustHaveChecks, setMustHaveStatus, calculateFinalScore, getOptionStatus, onBack, onNext, initialSelectedOptionId }) => {
  const [selId, setSelId] = useState(initialSelectedOptionId||options[0]?.id);
  const sel = options.find(o => o.id===selId);
  if (!sel) return null;
  const mh = factors.filter(f => f.type==='must-have');
  const pf = factors.filter(f => f.type==='preference');
  const fs = calculateFinalScore(sel.id);
  const total = mh.length + pf.length;
  const done = mh.filter(f => mustHaveChecks[sel.id]?.[f.id]).length + pf.filter(f => scores[sel.id]?.[f.id]).length;

  return (
    <div style={{ maxWidth:1040, margin:'0 auto', padding:'48px 20px' }}>
      <StepProgress currentStep={6} />
      <div className="scoring-layout" style={{ display:'flex', gap:32 }}>
        <div className="scoring-sidebar" style={{ width:200, flexShrink:0 }}>
          <SL>Options</SL>
          <div className="scoring-sidebar-inner" style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {options.map(o => {
              const s = getOptionStatus(o.id);
              return (
                <button key={o.id} className={`sidebar-opt ${selId===o.id?'active':''}`} onClick={() => setSelId(o.id)}>
                  {o.image && <div style={{ width:'100%', height:48, borderRadius:8, overflow:'hidden', marginBottom:6 }}><img src={o.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /></div>}
                  <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.name}</div>
                  <div style={{ fontSize:10, fontWeight:600, marginTop:4, opacity:.7 }}>{s==='Ready'?'Done':s==='Fails Must-Haves'?'Eliminated':'In progress'}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="anim-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
            <div style={{ display:'flex', gap:16, alignItems:'center' }}>
              {sel.image && <div className="result-photo"><img src={sel.image} alt="" /></div>}
              <div>
                <h1 className="serif" style={{ fontSize:32, fontWeight:400 }}>{sel.name}</h1>
                <div style={{ fontSize:13, color:'var(--text-tertiary)', marginTop:4 }}>{done} of {total} rated</div>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'.05em' }}>
                <Tt text="Multiplies each rating by its priority weight, then averages. Higher = better fit."><span style={{ display:'flex', alignItems:'center', gap:4 }}>Overall fit <HelpCircle size={10} /></span></Tt>
              </div>
              <div className="serif" style={{ fontSize:42, color:'var(--accent)', lineHeight:1 }}>{fs}%</div>
            </div>
          </div>
          <div style={{ marginBottom:28 }}><div className="bar-track"><div className="bar-fill" style={{ width:`${total>0?(done/total)*100:0}%`, background:'linear-gradient(90deg,var(--accent),#6BBF04)' }} /></div></div>
          {mh.length>0 && (
            <div style={{ marginBottom:28 }}>
              <SL><Tt text="Does this option meet each dealbreaker? One 'No' and it's out."><span style={{ display:'flex', alignItems:'center', gap:6 }}><Lock size={12} /> Dealbreaker checks <HelpCircle size={10} style={{ color:'var(--text-tertiary)' }} /></span></Tt></SL>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {mh.map(f => (
                  <div key={f.id} className="glass" style={{ padding:18 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                      <div>
                        <div style={{ fontWeight:600 }}>{f.name}</div>
                        {f.passCondition&&<div style={{ fontSize:12, color:'var(--text-tertiary)', marginTop:2 }}>Rule: {f.passCondition}</div>}
                      </div>
                      <div className="toggle-group">
                        {[{id:'pass',label:'Yes',c:'var(--green)'},{id:'unsure',label:'Not sure',c:'var(--amber)'},{id:'fail',label:'No',c:'var(--red)'}].map(st => (
                          <button key={st.id} className={`toggle-item ${mustHaveChecks[sel.id]?.[f.id]===st.id?'active':''}`} onClick={() => setMustHaveStatus(sel.id,f.id,st.id)} style={mustHaveChecks[sel.id]?.[f.id]===st.id?{color:st.c}:{}}>{st.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom:28 }}>
            <SL><Tt text="How well does this option deliver? 1 = terrible, 7 = perfect. Priority weights apply automatically."><span style={{ display:'flex', alignItems:'center', gap:6 }}><Star size={12} /> Rate each preference <HelpCircle size={10} style={{ color:'var(--text-tertiary)' }} /></span></Tt></SL>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {pf.map(f => {
                const cs = scores[sel.id]?.[f.id];
                return (
                  <div key={f.id} className="glass" style={{ padding:24 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                      <div>
                        <div style={{ fontWeight:600 }}>{f.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:4 }}>Priority: {WEIGHT_LABELS[f.weight]}</div>
                        {f.meaning && <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:6, padding:'6px 10px', background:'var(--surface-2)', borderRadius:8, fontStyle:'italic', lineHeight:1.4 }}>"{f.meaning}"</div>}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        {cs?(<><div className="serif" style={{ fontSize:28, color:'var(--accent)', lineHeight:1 }}>{cs}</div><div style={{ fontSize:10, color:'var(--text-tertiary)', marginTop:2 }}>{SCORE_LABELS[cs]}</div></>):(<div style={{ fontSize:13, color:'var(--text-tertiary)', fontStyle:'italic' }}>Not rated</div>)}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      {[1,2,3,4,5,6,7].map(n => (
                        <button key={n} className={`score-btn ${cs===n?'active':''}`} onClick={() => setScore(sel.id,f.id,n)}>
                          {n}<span className="score-label">{SCORE_LABELS[n]}</span>
                        </button>
                      ))}
                    </div>
                    {(() => { const dir = getScoreDirection(f.name); return (
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                        <span style={{ fontSize:9, fontWeight:700, color:'var(--text-tertiary)', letterSpacing:'.04em' }}>{dir.left}</span>
                        <span style={{ fontSize:9, fontWeight:700, color:'var(--text-tertiary)', letterSpacing:'.04em' }}>{dir.right}</span>
                      </div>
                    ); })()}
                    {(() => { const dir = getScoreDirection(f.name); return dir.hint ? (
                      <div style={{ marginTop:6, fontSize:10, color:'var(--amber)', fontWeight:600, fontStyle:'italic' }}>
                        💡 {dir.hint}
                      </div>
                    ) : null; })()}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:24, borderTop:'1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={onBack}>Back to options</button>
            <button className="btn btn-primary" onClick={onNext} style={{ padding:'14px 32px' }}>See results <Eye size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultsPage = ({ decisionTitle, options, factors, scores, getOptionStatus, calculateFinalScore, onGoToFactors, onGoToOptions, onReset, onFinishScoringOption }) => {
  const ready = options.filter(o => getOptionStatus(o.id)==="Ready").sort((a,b) => calculateFinalScore(b.id)-calculateFinalScore(a.id));
  const incomplete = options.filter(o => getOptionStatus(o.id)!=="Ready");
  const prefs = factors.filter(f => f.type==='preference');
  return (
    <div style={{ maxWidth:800, margin:'0 auto', padding:'64px 20px' }}>
      <div className="anim-up" style={{ textAlign:'center', marginBottom:48 }}>
        <h1 className="serif" style={{ fontSize:42, fontWeight:400 }}>{decisionTitle}</h1>
        <p style={{ color:'var(--text-secondary)', marginTop:8, fontSize:15 }}>Here's the choice that best fits the priorities you entered.</p>
        <div className="glow-line" style={{ maxWidth:200, margin:'24px auto 0' }} />
      </div>
      {ready.length>0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:48 }}>
          {ready.map((o,idx) => {
            const sc = calculateFinalScore(o.id);
            return (
              <div key={o.id} className={`result-card ${idx===0?'winner':''} anim-up`} style={{ animationDelay:`${idx*0.08}s` }}>
                {idx===0 && <div className="pill" style={{ position:'absolute', top:-10, left:24, background:'var(--accent)', color:'var(--bg)', padding:'4px 12px', fontWeight:800 }}><Trophy size={10} /> Your clearest fit</div>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    {o.image ? (
                      <div className="result-photo"><img src={o.image} alt="" /></div>
                    ) : (
                      <div style={{ width:48, height:48, borderRadius:12, background:idx===0?'var(--accent-soft)':'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:idx===0?'var(--accent)':'var(--text-tertiary)' }}>{idx+1}</div>
                    )}
                    <div>
                      <div style={{ fontWeight:600, fontSize:20 }}>{o.name}</div>
                      {o.notes && <div style={{ color:'var(--text-tertiary)', fontSize:13, marginTop:2 }}>{o.notes}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', minWidth:80 }}>
                    <div className="serif" style={{ fontSize:40, color:idx===0?'var(--accent)':'var(--text)', lineHeight:1 }}>{sc}%</div>
                    <div style={{ fontSize:10, color:'var(--text-tertiary)', marginTop:2 }}>fit</div>
                  </div>
                </div>
                <div className="bar-track" style={{ marginBottom:12 }}>
                  <div className="bar-fill" style={{ width:`${sc}%`, background:idx===0?'linear-gradient(90deg,var(--accent),#6BBF04)':'var(--surface-3)' }} />
                </div>
                {prefs.length>0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {prefs.sort((a,b)=>b.weight-a.weight).slice(0,5).map(f => {
                      const s = scores[o.id]?.[f.id]||0;
                      return <div key={f.id} style={{ fontSize:11, color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ color:s>=5?'var(--green)':s>=3?'var(--amber)':'var(--red)', fontWeight:600 }}>{SCORE_LABELS[s]||'?'}</span> on {f.name}
                      </div>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass" style={{ textAlign:'center', padding:48, marginBottom:40 }}>
          <Info size={32} style={{ color:'var(--text-tertiary)', margin:'0 auto 12px' }} />
          <div style={{ fontWeight:600, fontSize:18, marginBottom:8 }}>No options fully rated yet</div>
          <p style={{ color:'var(--text-secondary)', fontSize:14 }}>Go back and rate each option on every factor.</p>
        </div>
      )}
      {incomplete.length>0 && (
        <div style={{ marginBottom:48 }}>
          <SL>Still needs rating</SL>
          {incomplete.map(o => {
            const st = getOptionStatus(o.id);
            return (
              <div key={o.id} className="glass" style={{ padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, opacity:.7, borderStyle:'dashed' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <AlertCircle size={16} style={{ color:st==='Fails Must-Haves'?'var(--red)':'var(--amber)' }} />
                  <div>
                    <div style={{ fontWeight:600 }}>{o.name}</div>
                    <div style={{ fontSize:11, color:st==='Fails Must-Haves'?'var(--red)':'var(--amber)', fontWeight:600 }}>{st==='Fails Must-Haves'?'Eliminated (fails a dealbreaker)':'Needs more ratings'}</div>
                  </div>
                </div>
                {st!=='Fails Must-Haves'&&<button className="btn btn-secondary" onClick={() => onFinishScoringOption(o.id)} style={{ padding:'8px 16px', fontSize:12 }}>Finish rating</button>}
              </div>
            );
          })}
        </div>
      )}
      {ready.length>=2 && (
        <Hint icon={Heart}>
          <strong>{ready[0].name}</strong> is your clearest fit at {calculateFinalScore(ready[0].id)}%
          {` / ${calculateFinalScore(ready[0].id)-calculateFinalScore(ready[1].id)} points ahead of ${ready[1].name}`}.
          {' '}If this result feels off, that may mean something important is missing or underweighted.
        </Hint>
      )}
      <div className="glow-line" style={{ marginBottom:28 }} />
      <p style={{ textAlign:'center', fontSize:12, color:'var(--text-tertiary)', marginBottom:20, fontStyle:'italic' }}>Based on the priorities you entered.</p>
      <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
        <button className="btn btn-secondary" onClick={onGoToFactors}>Change what matters</button>
        <button className="btn btn-secondary" onClick={onGoToOptions}>Add more options</button>
        <button className="btn btn-secondary" onClick={onReset}>New decision</button>
      </div>
    </div>
  );
};

// --- Storage helpers ---
const DECISIONS_INDEX_KEY = 'ww-decisions-index';
const decisionKey = (id) => `ww-decision:${id}`;

async function loadDecisionIndex() {
  try {
    const result = await storage.get(DECISIONS_INDEX_KEY);
    return result ? JSON.parse(result.value) : [];
  } catch { return []; }
}

async function saveDecisionIndex(index) {
  try { await storage.set(DECISIONS_INDEX_KEY, JSON.stringify(index)); } catch (e) { console.error('Save index failed:', e); }
}

async function loadDecision(id) {
  try {
    const result = await storage.get(decisionKey(id));
    return result ? JSON.parse(result.value) : null;
  } catch { return null; }
}

async function saveDecision(data) {
  try { await storage.set(decisionKey(data.id), JSON.stringify(data)); } catch (e) { console.error('Save decision failed:', e); }
}

async function deleteDecisionData(id) {
  try { await storage.delete(decisionKey(id)); } catch (e) { console.error('Delete decision failed:', e); }
}

// --- App ---
export default function App() {
  const [page, setPage] = useState(PAGES.DASHBOARD);
  const [title, setTitle] = useState("");
  const [factors, setFactors] = useState([]);
  const [options, setOptions] = useState([]);
  const [scores, setScores] = useState({});
  const [mhChecks, setMhChecks] = useState({});
  const [focusOpt, setFocusOpt] = useState(null);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [sugError, setSugError] = useState(null);
  const [lastGeneratedTitle, setLastGeneratedTitle] = useState("");

  // Decision management
  const [currentDecisionId, setCurrentDecisionId] = useState(null);
  const [decisionsIndex, setDecisionsIndex] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const saveTimerRef = useRef(null);

  // Load decisions index on mount — show hero on first visit, dashboard on return
  React.useEffect(() => {
    (async () => {
      const index = await loadDecisionIndex();
      index.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setDecisionsIndex(index);
      setDashboardLoading(false);
      // First-time visitor: show the hero start page
      // Returning user with saved decisions: show dashboard
      if (index.length === 0) {
        setPage(PAGES.START);
      }
    })();
  }, []);

  // Auto-save current decision whenever state changes (debounced)
  React.useEffect(() => {
    if (!currentDecisionId || !title.trim()) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const data = {
        id: currentDecisionId,
        title,
        factors,
        options: options.map(o => ({ ...o, image: o.image ? o.image.substring(0, 50000) : null })), // cap image size
        scores,
        mhChecks,
        updatedAt: Date.now(),
      };
      await saveDecision(data);

      // Update index
      setDecisionsIndex(prev => {
        const existing = prev.find(d => d.id === currentDecisionId);
        let newIndex;
        if (existing) {
          newIndex = prev.map(d => d.id === currentDecisionId ? { ...d, title, updatedAt: Date.now(), factors, options: data.options, scores, mhChecks } : d);
        } else {
          newIndex = [{ id: currentDecisionId, title, updatedAt: Date.now(), factors, options: data.options, scores, mhChecks }, ...prev];
        }
        newIndex.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        saveDecisionIndex(newIndex);
        return newIndex;
      });
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [currentDecisionId, title, factors, options, scores, mhChecks]);

  const go = (p) => { setPage(p); window.scrollTo?.({top:0,behavior:'smooth'}); };

  const handleNewDecision = () => {
    setCurrentDecisionId(null);
    setTitle("");
    setFactors([]);
    setOptions([]);
    setScores({});
    setMhChecks({});
    setSmartSuggestions([]);
    setLastGeneratedTitle("");
    setFocusOpt(null);
    go(PAGES.START);
  };

  const handleLoadDecision = async (id) => {
    const data = await loadDecision(id);
    if (!data) return;
    setCurrentDecisionId(id);
    setTitle(data.title || "");
    setFactors(data.factors || []);
    setOptions(data.options || []);
    setScores(data.scores || {});
    setMhChecks(data.mhChecks || {});
    setSmartSuggestions([]);
    setLastGeneratedTitle("");
    setFocusOpt(null);

    // Go to the most useful page based on progress
    const f = data.factors || [];
    const o = data.options || [];
    if (f.length === 0) go(PAGES.FACTORS);
    else if (o.length === 0) go(PAGES.OPTIONS);
    else go(PAGES.RESULTS);
  };

  const handleDeleteDecision = async (id) => {
    if (!confirm("Delete this decision? This can't be undone.")) return;
    await deleteDecisionData(id);
    const newIndex = decisionsIndex.filter(d => d.id !== id);
    setDecisionsIndex(newIndex);
    await saveDecisionIndex(newIndex);
    if (currentDecisionId === id) {
      setCurrentDecisionId(null);
      setTitle("");
      setFactors([]);
      setOptions([]);
      setScores({});
      setMhChecks({});
    }
  };

  // Smart local suggestion maps for common decisions
  const DECISION_SUGGESTIONS = {
    dog: ["Upfront cost", "Monthly care cost", "Size at full grown", "Shedding amount", "Activity level needed", "Good with kids", "Good with other pets", "Lifespan", "General breed health", "Trainability", "Barking tendency", "Hypoallergenic", "Grooming needs", "Apartment-friendly"],
    puppy: ["Upfront cost", "Monthly care cost", "Size at full grown", "Shedding amount", "Activity level needed", "Good with kids", "Good with other pets", "Lifespan", "General breed health", "Trainability", "Barking tendency", "Hypoallergenic", "Grooming needs", "Apartment-friendly"],
    breed: ["Upfront cost", "Monthly care cost", "Size at full grown", "Shedding amount", "Activity level needed", "Good with kids", "Good with other pets", "Lifespan", "General breed health", "Trainability", "Barking tendency", "Hypoallergenic", "Grooming needs", "Apartment-friendly"],
    pet: ["Upfront cost", "Monthly care cost", "Space needed", "Time commitment", "Good with kids", "Lifespan", "Noise level", "Allergy-friendly", "Affection level", "Ease of care", "Vet costs", "Travel-friendly"],
    apartment: ["Monthly rent", "Commute to work", "Natural light", "Noise level", "Laundry in unit", "Pet policy", "Neighborhood safety", "Kitchen size", "Closet/storage space", "Move-in cost", "Lease flexibility", "Outdoor space", "Grocery stores nearby", "Parking situation"],
    rent: ["Monthly rent", "Commute to work", "Natural light", "Noise level", "Laundry in unit", "Pet policy", "Neighborhood safety", "Kitchen size", "Closet/storage space", "Move-in cost", "Lease flexibility", "Outdoor space", "Grocery stores nearby", "Parking situation"],
    house: ["Purchase price", "Monthly mortgage", "Property taxes", "Location", "Square footage", "Yard size", "School district", "Commute to work", "Condition of home", "Renovation needed", "Neighborhood feel", "Future resale value", "Natural light", "Garage/parking"],
    home: ["Purchase price", "Monthly mortgage", "Property taxes", "Location", "Square footage", "Yard size", "School district", "Commute to work", "Condition of home", "Renovation needed", "Neighborhood feel", "Future resale value", "Natural light", "Garage/parking"],
    job: ["Total compensation", "Base salary", "Remote/hybrid policy", "Growth trajectory", "Team you'd join", "Manager quality", "Commute", "Benefits (health/401k)", "Work-life balance", "Learning opportunities", "Job security", "Company mission", "Day-to-day work", "Title and seniority"],
    offer: ["Total compensation", "Base salary", "Remote/hybrid policy", "Growth trajectory", "Team you'd join", "Manager quality", "Commute", "Benefits (health/401k)", "Work-life balance", "Learning opportunities", "Job security", "Company mission", "Day-to-day work", "Title and seniority"],
    career: ["Earning potential", "Daily enjoyment", "Growth ceiling", "Work-life balance", "Job market demand", "Location flexibility", "Skill transferability", "Impact/meaning", "Stability", "Lifestyle fit"],
    car: ["Purchase price", "Monthly payment", "Fuel cost", "Reliability history", "Safety ratings", "Cargo/trunk space", "Driving feel", "Maintenance cost", "Insurance cost", "Resale value", "Tech/infotainment", "Comfort on long drives", "Looks/style"],
    vehicle: ["Purchase price", "Monthly payment", "Fuel cost", "Reliability history", "Safety ratings", "Cargo/trunk space", "Driving feel", "Maintenance cost", "Insurance cost", "Resale value", "Tech/infotainment", "Comfort on long drives", "Looks/style"],
    school: ["Tuition cost", "Financial aid offered", "Academic reputation", "Program strength", "Location", "Campus feel", "Career placement rate", "Class size", "Social life", "Alumni network", "Diversity", "Housing situation"],
    college: ["Tuition cost", "Financial aid offered", "Academic reputation", "Program strength", "Location", "Campus feel", "Career placement rate", "Class size", "Social life", "Alumni network", "Diversity", "Housing situation"],
    university: ["Tuition cost", "Financial aid offered", "Academic reputation", "Program strength", "Location", "Campus feel", "Career placement rate", "Class size", "Social life", "Alumni network", "Diversity", "Housing situation"],
    laptop: ["Price", "Speed/performance", "Battery life", "Screen quality", "Weight to carry", "Build quality", "Keyboard feel", "Storage space", "Ports available", "Customer support", "Operating system", "How long it'll last"],
    phone: ["Price", "Camera quality", "Battery life", "Screen size/quality", "Speed", "Storage space", "Ecosystem (Apple/Android)", "Durability", "Size in hand", "How long it gets updates"],
    wedding: ["Total budget", "Guest capacity", "Location for guests", "Aesthetic/vibe", "Food quality", "Date availability", "Indoor/outdoor", "Parking", "Vendor restrictions", "Weather backup"],
    vacation: ["Total cost", "Flight/travel time", "Things to do", "Weather", "Food scene", "Safety", "Cultural experience", "Relaxation level", "Kid-friendliness", "How easy to plan"],
    trip: ["Total cost", "Flight/travel time", "Things to do", "Weather", "Food scene", "Safety", "Cultural experience", "Relaxation level", "Kid-friendliness", "How easy to plan"],
    move: ["Cost of living", "Job opportunities", "Weather year-round", "Distance from family", "Safety", "Lifestyle fit", "School quality", "Outdoor access", "Public transit", "Housing market"],
    city: ["Cost of living", "Job opportunities", "Weather year-round", "Distance from family", "Safety", "Lifestyle fit", "School quality", "Outdoor access", "Public transit", "Housing market"],
    contractor: ["Price estimate", "Online reviews", "Timeline/availability", "Communication style", "Past work quality", "Licensed and insured", "Warranty offered", "How close they are", "Professionalism", "References you can call"],
    doctor: ["Expertise", "Bedside manner", "Wait times", "Location", "Takes my insurance", "Online reviews", "Appointment availability", "Communication style", "Office experience", "Trusted referral"],
    daycare: ["Monthly cost", "Distance from home/work", "Hours of operation", "Staff-to-child ratio", "Teaching approach", "Cleanliness", "Parent reviews", "Outdoor play space", "Schedule flexibility", "Your gut feeling"],
    nanny: ["Hourly/weekly rate", "Experience level", "Availability", "References", "CPR/first aid certified", "Driving ability", "Personality fit", "Flexibility", "Background check", "Communication style"],
    therapist: ["Cost per session", "Insurance coverage", "Specialty/approach", "Availability", "Location/virtual option", "Personality fit", "Reviews/referrals", "Session length", "Waitlist time", "Communication between sessions"],
    restaurant: ["Food quality", "Price range", "Location", "Ambiance/vibe", "Service quality", "Menu variety", "Wait time", "Dietary options", "Noise level", "Reservation ease"],
    sofa: ["Price", "Comfort", "Size/fit in room", "Material/fabric", "Durability", "Style/look", "Delivery timeline", "Return policy", "Pet-friendly material", "Easy to clean"],
    mattress: ["Price", "Comfort/firmness", "Size", "Durability", "Trial period", "Warranty", "Temperature regulation", "Edge support", "Motion isolation", "Delivery/setup"],
  };

  function getLocalSuggestions(decisionText) {
    var lower = decisionText.toLowerCase();
    var keys = Object.keys(DECISION_SUGGESTIONS);
    for (var i = 0; i < keys.length; i++) {
      if (lower.includes(keys[i])) {
        return DECISION_SUGGESTIONS[keys[i]];
      }
    }
    return null;
  }

  const generateSuggestions = async (decisionText) => {
    setSuggestionsLoading(true);
    setSmartSuggestions([]);
    setSugError(null);

    // First try local smart matching
    var local = getLocalSuggestions(decisionText);
    if (local) {
      setSmartSuggestions(local);
      setLastGeneratedTitle(decisionText);
      setSuggestionsLoading(false);
      // Also try API in background to potentially upgrade suggestions
      try {
        var response = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: decisionText })
        });
        var data = await response.json();
        if (data.factors && Array.isArray(data.factors) && data.factors.length > 0) {
          setSmartSuggestions(data.factors);
          setLastGeneratedTitle(decisionText);
        }
      } catch (e) {
        // API failed silently, local suggestions already showing
      }
      return;
    }

    // No local match — try API
    try {
      var response2 = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: decisionText })
      });
      var data2 = await response2.json();
      if (data2.factors && Array.isArray(data2.factors) && data2.factors.length > 0) {
        setSmartSuggestions(data2.factors);
        setLastGeneratedTitle(decisionText);
        setSuggestionsLoading(false);
        return;
      }
    } catch (e2) {
      // API failed
    }

    // Everything failed — use generic fallback
    setSmartSuggestions([...FALLBACK_FACTORS]);
    setSuggestionsLoading(false);
  };


  const handleStartNext = () => {
    // Create a new decision ID if we don't have one
    if (!currentDecisionId) {
      setCurrentDecisionId(Math.random().toString(36).substr(2, 12));
    }
    // Navigate immediately — suggestions load on the factors page
    go(PAGES.FACTORS);
    // Fire off suggestion generation in the background
    if (title.trim() !== lastGeneratedTitle) {
      generateSuggestions(title.trim());
    }
  };

  const handleRegenerate = () => {
    generateSuggestions(title.trim());
  };

  const addFactor = (n) => { if(!n.trim()||factors.find(f=>f.name.toLowerCase()===n.trim().toLowerCase())) return; setFactors([...factors,{id:Math.random().toString(36).substr(2,9),name:n.trim(),type:'preference',weight:4,passCondition:'',meaning:''}]); };
  const removeFactor = (id) => setFactors(factors.filter(f=>f.id!==id));
  const updateFactor = (id,u) => setFactors(factors.map(f=>f.id===id?{...f,...u}:f));
  const addOption = (n,nt="",img=null) => { if(!n.trim()) return; setOptions([...options,{id:Math.random().toString(36).substr(2,9),name:n.trim(),notes:nt,image:img}]); };
  const removeOption = (id) => setOptions(options.filter(o=>o.id!==id));
  const updateOptionImage = (id, img) => setOptions(options.map(o => o.id===id ? {...o, image:img} : o));
  const setScoreVal = (o,f,v) => setScores(p=>({...p,[o]:{...p[o],[f]:v}}));
  const setMH = (o,f,s) => setMhChecks(p=>({...p,[o]:{...p[o],[f]:s}}));
  const getSt = (oId) => { if(!factors.length) return "No factors"; const mp=factors.filter(f=>f.type==='preference').filter(f=>!scores[oId]?.[f.id]).length; const mm=factors.filter(f=>f.type==='must-have').filter(f=>!mhChecks[oId]?.[f.id]).length; const fm=factors.filter(f=>f.type==='must-have').filter(f=>mhChecks[oId]?.[f.id]==='fail').length; if(fm>0) return "Fails Must-Haves"; if(mp>0||mm>0) return "Needs Scoring"; return "Ready"; };
  const calc = (oId) => { const pr=factors.filter(f=>f.type==='preference'); if(!pr.length) return 100; if(factors.filter(f=>f.type==='must-have').some(f=>mhChecks[oId]?.[f.id]==='fail')) return 0; let tw=0,ws=0; pr.forEach(f=>{ws+=(scores[oId]?.[f.id]||0)*f.weight;tw+=f.weight*7}); return tw>0?Math.round((ws/tw)*100):0; };
  const reset = () => { handleNewDecision(); };

  const navItems = [
    {p:PAGES.FACTORS,l:'Criteria',ps:[PAGES.FACTORS,PAGES.CLASSIFY,PAGES.WEIGHT,PAGES.LENS_SUMMARY]},
    {p:PAGES.OPTIONS,l:'Options',ps:[PAGES.OPTIONS]},
    {p:PAGES.SCORING,l:'Ratings',ps:[PAGES.SCORING]},
    {p:PAGES.RESULTS,l:'Results',ps:[PAGES.RESULTS]}
  ];

  const isInDecision = ![PAGES.DASHBOARD, PAGES.START].includes(page);

  const renderPage = () => {
    switch(page) {
      case PAGES.DASHBOARD: return <DashboardPage decisions={decisionsIndex} onNewDecision={handleNewDecision} onLoadDecision={handleLoadDecision} onDeleteDecision={handleDeleteDecision} loading={dashboardLoading} />;
      case PAGES.START: return <StartPage decisionTitle={title} setDecisionTitle={setTitle} onNext={handleStartNext} hasExistingDecisions={decisionsIndex.length > 0} onViewDecisions={() => go(PAGES.DASHBOARD)} />;
      case PAGES.FACTORS: return <FactorsPage factors={factors} addFactor={addFactor} removeFactor={removeFactor} updateFactor={updateFactor} suggestions={smartSuggestions.length > 0 ? smartSuggestions : FALLBACK_FACTORS} suggestionsLoading={suggestionsLoading} sugError={sugError} onRegenerate={handleRegenerate} onBack={()=>go(PAGES.START)} onNext={()=>go(PAGES.CLASSIFY)} />;
      case PAGES.CLASSIFY: return <ClassifyPage factors={factors} updateFactor={updateFactor} onBack={()=>go(PAGES.FACTORS)} onNext={()=>go(PAGES.WEIGHT)} />;
      case PAGES.WEIGHT: return <WeightPage factors={factors} updateFactor={updateFactor} onBack={()=>go(PAGES.CLASSIFY)} onNext={()=>go(PAGES.LENS_SUMMARY)} />;
      case PAGES.LENS_SUMMARY: return <LensSummary decisionTitle={title} factors={factors} onBack={()=>go(PAGES.WEIGHT)} onNext={()=>go(PAGES.OPTIONS)} />;
      case PAGES.OPTIONS: return <OptionsPage options={options} addOption={addOption} removeOption={removeOption} updateOptionImage={updateOptionImage} getOptionStatus={getSt} onBack={()=>go(PAGES.LENS_SUMMARY)} onNext={()=>{setFocusOpt(null);go(PAGES.SCORING);}} onScoreOption={id=>{setFocusOpt(id);go(PAGES.SCORING);}} />;
      case PAGES.SCORING: return <ScoringPage options={options} factors={factors} scores={scores} setScore={setScoreVal} mustHaveChecks={mhChecks} setMustHaveStatus={setMH} calculateFinalScore={calc} getOptionStatus={getSt} onBack={()=>go(PAGES.OPTIONS)} onNext={()=>go(PAGES.RESULTS)} initialSelectedOptionId={focusOpt} />;
      case PAGES.RESULTS: return <ResultsPage decisionTitle={title} options={options} factors={factors} scores={scores} getOptionStatus={getSt} calculateFinalScore={calc} onGoToFactors={()=>go(PAGES.FACTORS)} onGoToOptions={()=>go(PAGES.OPTIONS)} onReset={reset} onFinishScoringOption={id=>{setFocusOpt(id);go(PAGES.SCORING);}} />;
      default: return null;
    }
  };

  return (
    <><style>{styles}</style>
    <div className="ww-root">
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(247,247,250,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 20px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Logo onClick={() => go(decisionsIndex.length > 0 ? PAGES.DASHBOARD : PAGES.START)} />
          {isInDecision && (
            <div style={{ display:'flex', gap:24, alignItems:'center' }}>
              {navItems.map(n => <button key={n.l} className={`nav-btn ${n.ps.includes(page)?'active':''}`} onClick={()=>go(n.p)}>{n.l}</button>)}
              <button className="nav-btn" onClick={() => go(PAGES.DASHBOARD)} style={{ marginLeft:8, opacity:.6 }} title="All decisions">
                <FolderOpen size={14} />
              </button>
            </div>
          )}
          <div style={{ width:120 }} />
        </div>
      </nav>
      <main style={{ minHeight:'calc(100vh - 56px)' }}>{renderPage()}</main>
      <footer style={{ padding:'48px 20px 32px', textAlign:'center' }}>
        <div className="glow-line" style={{ maxWidth:60, margin:'0 auto 16px' }} />
        <p style={{ color:'var(--text-tertiary)', fontSize:12, fontWeight:500, fontStyle:'italic' }}>See clearly. Decide confidently.</p>
      </footer>
    </div></>
  );
}
