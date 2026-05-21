import { useState, useEffect, useRef } from 'react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip
} from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

// ─── NORMES ────────────────────────────────────────────────────────────────
const NORMS = {
  sls:    { alert: 10, good: 30 },
  tandem: { goodTime: 28, maxErrors: 1 },
  sts5: {
    '50-59': 11.0, '60-64': 11.4, '65-69': 11.4,
    '70-74': 12.6, '75+': 14.0
  },
  cs30: {
    '50-59': { H: 16, F: 14 }, '60-64': { H: 14, F: 12 },
    '65-69': { H: 12, F: 11 }, '70-74': { H: 12, F: 10 }, '75+': { H: 11, F: 10 }
  },
  mst2: { // BoneFit Canada — Rikli & Jones
    '50-59': { H: 91, F: 80 }, '60-64': { H: 87, F: 75 },
    '65-69': { H: 86, F: 73 }, '70-74': { H: 80, F: 68 }, '75+': { H: 73, F: 60 }
  }
}

const AGE_OPTS = ['50-59', '60-64', '65-69', '70-74', '75+']

// ─── UTILS ─────────────────────────────────────────────────────────────────
function fmtTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ds = Math.floor((s * 10) % 10)
  if (m > 0) return `${m}:${sec.toString().padStart(2, '0')}.${ds}`
  return `${sec}.${ds}s`
}

function calcScores(profile, vals) {
  const a = profile.age, sx = profile.sex
  const slsO  = parseFloat(vals.slsO)  || 0
  const tanT   = parseFloat(vals.tandemT) || 0
  const tanE   = parseInt(vals.tandemE) || 0
  const sts5T  = parseFloat(vals.sts5T) || 0
  const cs30R  = parseFloat(vals.cs30R) || 0
  const mst2R  = parseFloat(vals.mst2R) || 0

  const slsScore = slsO > 0 ? Math.min(100, Math.round((slsO / 45) * 100)) : 0
  let tanScore = 0
  if (tanT > 0) {
    tanScore = tanT <= NORMS.tandem.goodTime && tanE <= NORMS.tandem.maxErrors
      ? 100
      : Math.min(100, Math.max(0, Math.round((NORMS.tandem.goodTime / tanT) * 100 - tanE * 12)))
  }
  const sts5Ref = NORMS.sts5[a] || 11.4
  const sts5Score = sts5T > 0
    ? Math.min(100, Math.max(0, Math.round(sts5T <= sts5Ref ? 100 : (sts5Ref / sts5T) * 100)))
    : 0
  const cs30Ref = (NORMS.cs30[a] || NORMS.cs30['60-64'])[sx]
  const cs30Score = cs30R > 0 ? Math.min(100, Math.round((cs30R / cs30Ref) * 100)) : 0
  const mst2Ref = (NORMS.mst2[a] || NORMS.mst2['60-64'])[sx]
  const mst2Score = mst2R > 0 ? Math.min(100, Math.round((mst2R / mst2Ref) * 100)) : 0

  const recos = []
  if (slsO > 0 && slsO < NORMS.sls.alert)
    recos.push({ level: 'alert', title: 'Équilibre statique — seuil d\'alerte', desc: 'Moins de 10 s yeux ouverts : risque de chute élevé. Consultation kinésiologue recommandée. Exercices d\'équilibre quotidiens.' })
  else if (slsScore < 65 && slsO > 0)
    recos.push({ level: 'warn', title: 'Équilibre statique — à améliorer', desc: 'Entraînement proprioceptif unilatéral 3×/semaine : équilibre sur coussin, yoga, tai-chi.' })
  if (tanScore < 65 && tanT > 0)
    recos.push({ level: 'warn', title: 'Équilibre dynamique — à travailler', desc: 'Marche en tandem, changements de direction, surfaces instables pour améliorer la coordination.' })
  if (sts5Score < 65 && sts5T > 0)
    recos.push({ level: 'warn', title: 'Puissance explosive — à développer', desc: 'Squats avec composante de vitesse, montées de marches rapides, vélo en intervalles.' })
  if (cs30Score < 65 && cs30R > 0)
    recos.push({ level: 'warn', title: 'Force des membres inférieurs — à renforcer', desc: 'Renforcement quadriceps et fessiers 2–3×/semaine, progressif selon votre tolérance.' })
  if (mst2Score < 65 && mst2R > 0)
    recos.push({ level: 'warn', title: 'Endurance aérobie — à améliorer', desc: 'Marche active 3×/semaine, progression 10 % par semaine. Objectif : 150 min/semaine.' })
  if (recos.length === 0)
    recos.push({ level: 'ok', title: 'Excellente condition fonctionnelle', desc: 'Tous les domaines dans la norme. Maintenez votre programme et refaites ce bilan dans 3 mois.' })

  return { slsScore, tanScore, sts5Score, cs30Score, mst2Score, recos, slsAlert: slsO > 0 && slsO < NORMS.sls.alert }
}

async function generateReport(profile, scores, vals) {
  const token = import.meta.env.VITE_API_TOKEN
  if (!token) return null

  const cs30Ref = (NORMS.cs30[profile.age] || NORMS.cs30['60-64'])[profile.sex]
  const mst2Ref = (NORMS.mst2[profile.age] || NORMS.mst2['60-64'])[profile.sex]
  const sts5Ref = NORMS.sts5[profile.age] || 11.4

  const prompt = `Tu es kinésiologue expert en longévité fonctionnelle. Génère un rapport personnalisé en français (250-300 mots) pour ${profile.prenom || 'ce patient'}, ${profile.age} ans, sexe biologique ${profile.sex === 'H' ? 'masculin' : 'féminin'}.

Résultats du Bilan Fonctionnel Longévité Kinoa :
1. SLS (équilibre statique) — yeux ouverts : ${vals.slsO || '—'} s (seuil alerte : < 10 s) | Score : ${scores.slsScore}/100
2. Tandem Walk (équilibre dynamique) — ${vals.tandemT || '—'} s, ${vals.tandemE || 0} erreur(s) | Score : ${scores.tanScore}/100
3. 5×STS (puissance explosive) — ${vals.sts5T || '—'} s (seuil : ${sts5Ref} s) | Score : ${scores.sts5Score}/100
4. CS-30 (force endurance) — ${vals.cs30R || '—'} répétitions (norme : ${cs30Ref} rép) | Score : ${scores.cs30Score}/100
5. 2MST (endurance aérobie) — ${vals.mst2R || '—'} levées genou (norme BoneFit : ${mst2Ref}) | Score : ${scores.mst2Score}/100

Rédige :
- Une introduction personnalisée avec le prénom
- Une analyse de 2-3 points forts et 1-2 axes prioritaires
- 2-3 recommandations concrètes et motivantes
- Une conclusion encourageante invitant à consulter un kinésiologue Kinoa
Ton chaleureux, professionnel, sans diagnostic médical.`

  try {
    const resp = await fetch('https://kinoa-api-bridge.kinoa-sante.workers.dev/rapport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': token
      },
      body: JSON.stringify({ prompt })
    })
    const data = await resp.json()
    return data?.text || data?.content?.[0]?.text || null
  } catch {
    return null
  }
}

async function submitLead(profile, vals, scores, extra) {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL
  if (!url) return
  const payload = {
    source: import.meta.env.VITE_BILAN_SOURCE || 'bilan_longevite',
    prenom: profile.prenom,
    email: profile.email,
    age: profile.age,
    sexe: profile.sex,
    tel: extra.tel,
    consult: extra.consult,
    programme: extra.programme,
    newsletter: extra.newsletter,
    sls_ouvert: vals.slsO,
    sls_ferme: vals.slsF,
    tandem_temps: vals.tandemT,
    tandem_erreurs: vals.tandemE,
    sts5_temps: vals.sts5T,
    cs30_reps: vals.cs30R,
    mst2_reps: vals.mst2R,
    score_sls: scores?.slsScore,
    score_tandem: scores?.tanScore,
    score_sts5: scores?.sts5Score,
    score_cs30: scores?.cs30Score,
    score_mst2: scores?.mst2Score,
    timestamp: new Date().toISOString()
  }
  try {
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  } catch {}
}

// ─── TIMER WIDGET ──────────────────────────────────────────────────────────
function TimerWidget({ countdown = null, onCapture, label = 'Démarrer', resetLabel = 'Refaire' }) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const iRef = useRef(null)
  const t0Ref = useRef(null)
  const e0Ref = useRef(0)

  const display = countdown !== null ? Math.max(0, countdown - elapsed) : elapsed

  const startTimer = () => {
    if (running) return
    setRunning(true); setDone(false)
    e0Ref.current = elapsed; t0Ref.current = Date.now()
    iRef.current = setInterval(() => {
      const newE = e0Ref.current + (Date.now() - t0Ref.current) / 1000
      if (countdown !== null && newE >= countdown) {
        setElapsed(countdown); setRunning(false); setDone(true)
        clearInterval(iRef.current)
        onCapture && onCapture(parseFloat(countdown.toFixed(1)))
      } else setElapsed(newE)
    }, 50)
  }

  const stopTimer = () => {
    if (!running) return
    clearInterval(iRef.current); setRunning(false)
    const val = parseFloat(elapsed.toFixed(1))
    onCapture && onCapture(val)
  }

  const resetTimer = () => {
    clearInterval(iRef.current); setRunning(false); setElapsed(0); setDone(false)
  }

  useEffect(() => () => clearInterval(iRef.current), [])

  const isPct = countdown !== null
  const pct = isPct ? Math.max(0, Math.min(100, ((countdown - display) / countdown) * 100)) : 0

  return (
    <div style={{ background: '#F1EFE8', borderRadius: 12, padding: '16px', marginBottom: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1, color: running ? '#D85A30' : done ? '#1D9E75' : '#1a1a1a', fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
        {fmtTime(display)}
      </div>
      {isPct && (
        <div style={{ height: 4, background: '#D3D1C7', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: done ? '#1D9E75' : '#D85A30', borderRadius: 2, transition: 'width .1s' }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {!running && !done && (
          <button onClick={startTimer} style={{ padding: '10px 24px', borderRadius: 8, background: '#1D9E75', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
        )}
        {running && !countdown && (
          <button onClick={stopTimer} style={{ padding: '10px 24px', borderRadius: 8, background: '#D85A30', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Arrêter</button>
        )}
        {(done || (!running && elapsed > 0)) && (
          <button onClick={resetTimer} style={{ padding: '10px 20px', borderRadius: 8, background: 'transparent', color: '#5F5E5A', border: '1px solid #D3D1C7', fontSize: 14, cursor: 'pointer' }}>{resetLabel}</button>
        )}
      </div>
      {done && <div style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600, marginTop: 8 }}>Temps enregistré — entrez votre score ci-dessous</div>}
    </div>
  )
}

// ─── RADAR ─────────────────────────────────────────────────────────────────
function BilanRadar({ scores }) {
  const data = {
    labels: ['Équilibre\nstatique', 'Équilibre\ndynamique', 'Puissance\nexplosive', 'Force &\nendurance', 'Endurance\naérobie'],
    datasets: [{
      data: [scores.slsScore, scores.tanScore, scores.sts5Score, scores.cs30Score, scores.mst2Score],
      backgroundColor: 'rgba(29,158,117,0.15)',
      borderColor: '#1D9E75',
      borderWidth: 2,
      pointBackgroundColor: '#1D9E75',
      pointRadius: 4
    }]
  }
  const opts = {
    responsive: true, maintainAspectRatio: true,
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { stepSize: 25, font: { size: 10 }, color: '#888780', backdropColor: 'transparent' },
        grid: { color: '#D3D1C7' },
        angleLines: { color: '#D3D1C7' },
        pointLabels: { font: { size: 11, weight: '600' }, color: '#1a1a1a' }
      }
    },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw}/100` } } }
  }
  return <Radar data={data} options={opts} />
}

// ─── UI ATOMS ──────────────────────────────────────────────────────────────
const wrap = { maxWidth: 480, margin: '0 auto', padding: '1.5rem 1rem 5rem', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F9F7F4', minHeight: '100vh' }

function ProgressBar({ pct }) {
  return (
    <div style={{ height: 3, background: '#E8E6DF', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: '#1D9E75', borderRadius: 2, transition: 'width .4s' }} />
    </div>
  )
}

function BtnPrimary({ label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: 14, background: disabled ? '#D3D1C7' : '#D85A30', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', marginTop: 8 }}>
      {label} →
    </button>
  )
}

function BtnSecondary({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: 12, background: 'transparent', color: '#5F5E5A', border: '1px solid #D3D1C7', borderRadius: 10, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
      {label}
    </button>
  )
}

function NormBox({ children }) {
  return <div style={{ background: '#E8F5F1', border: '1px solid #9FE1CB', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#085041' }}>{children}</div>
}

function AlertBox({ children }) {
  return <div style={{ background: '#FAECE7', border: '1px solid #F5C4B3', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#712B13' }}>{children}</div>
}

function ProtoBox({ steps }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: '#888780', marginBottom: 8 }}>PROTOCOLE</div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#444441', lineHeight: 1.6 }}>
          <span style={{ color: '#1D9E75', fontWeight: 700, minWidth: 16, flexShrink: 0 }}>{i + 1}.</span>
          <span>{s}</span>
        </div>
      ))}
    </div>
  )
}

function TestHeader({ num, of, title, domain, pct }) {
  return (
    <>
      <ProgressBar pct={pct} />
      <div style={{ fontSize: 12, color: '#888780', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span>Test {num}/{of}</span>
        <span style={{ color: '#1D9E75', fontWeight: 600 }}>{num * 20}% complété</span>
      </div>
      <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E8F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0F6E56', flexShrink: 0 }}>{num}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#888780' }}>{domain}</div>
          </div>
        </div>
      </div>
    </>
  )
}

function NumInput({ value, onChange, placeholder, unit, label }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 6 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} step="0.1"
          style={{ width: 100, padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 18, textAlign: 'center', fontWeight: 600, background: '#fff' }} />
        <span style={{ fontSize: 13, color: '#888780' }}>{unit}</span>
      </div>
    </div>
  )
}

// ─── APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState('intro')
  const [profile, setProfile] = useState({ prenom: '', email: '', age: '60-64', sex: 'H' })
  const [vals, setVals] = useState({ slsO: '', slsF: '', tandemT: '', tandemE: '0', sts5T: '', cs30R: '', mst2R: '' })
  const [scores, setScores] = useState(null)
  const [rapport, setRapport] = useState('')
  const [loadingRapport, setLoadingRapport] = useState(false)
  const [lead, setLead] = useState({ tel: '', consult: false, programme: false, newsletter: false })
  const [submitting, setSubmitting] = useState(false)

  const go = s => { setStep(s); window.scrollTo(0, 0) }
  const setP = (k, v) => setProfile(p => ({ ...p, [k]: v }))
  const setV = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const goResultats = () => {
    const s = calcScores(profile, vals)
    setScores(s)
    go('resultats')
  }

  const goRapport = async () => {
    go('rapport')
    setLoadingRapport(true)
    const text = await generateReport(profile, scores, vals)
    setRapport(text || '')
    setLoadingRapport(false)
  }

  const handleSubmitLead = async () => {
    setSubmitting(true)
    await submitLead(profile, vals, scores, lead)
    setSubmitting(false)
    go('merci')
  }

  const AgeBtn = ({ val }) => (
    <button onClick={() => setP('age', val)} style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginRight: 6, marginBottom: 8, background: profile.age === val ? '#E8F5F1' : '#fff', border: profile.age === val ? '1.5px solid #1D9E75' : '1px solid #D3D1C7', color: profile.age === val ? '#085041' : '#1a1a1a', fontWeight: profile.age === val ? 600 : 400 }}>{val} ans</button>
  )
  const SexBtn = ({ val, label }) => (
    <button onClick={() => setP('sex', val)} style={{ padding: '9px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', marginRight: 8, background: profile.sex === val ? '#E8F5F1' : '#fff', border: profile.sex === val ? '1.5px solid #1D9E75' : '1px solid #D3D1C7', color: profile.sex === val ? '#085041' : '#1a1a1a', fontWeight: profile.sex === val ? 600 : 400 }}>{label}</button>
  )

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (step === 'intro') return (
    <div style={wrap}>
      <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #D85A30', color: '#993C1D', background: '#FAECE7', marginBottom: 16, letterSpacing: '.04em' }}>KINOA SANTÉ</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 12, color: '#1a1a1a' }}>Bilan fonctionnel <em style={{ color: '#D85A30', fontStyle: 'normal' }}>longévité</em></h1>
      <p style={{ fontSize: 15, color: '#5F5E5A', lineHeight: 1.7, marginBottom: 20 }}>5 tests cliniquement validés pour évaluer votre équilibre, votre force et votre endurance — comparés aux normes de votre groupe d'âge.</p>

      <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.04em', color: '#1a1a1a', marginBottom: 14 }}>VOS INFORMATIONS</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 6 }}>Prénom</div>
          <input type="text" value={profile.prenom} onChange={e => setP('prenom', e.target.value)} placeholder="ex. Marie" style={{ width: '100%', padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: '#FAFAFA' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 6 }}>Courriel</div>
          <input type="email" value={profile.email} onChange={e => setP('email', e.target.value)} placeholder="marie@exemple.com" style={{ width: '100%', padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: '#FAFAFA' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 8 }}>Groupe d'âge</div>
          <div>{AGE_OPTS.map(v => <AgeBtn key={v} val={v} />)}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 8 }}>Sexe biologique</div>
          <div><SexBtn val="H" label="Homme" /><SexBtn val="F" label="Femme" /></div>
        </div>
      </div>

      <div style={{ background: '#1a2e28', borderRadius: 12, padding: '1.25rem', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#9FE1CB', marginBottom: 12 }}>Les 5 tests du bilan</div>
        {[
          ['1', 'SLS — Équilibre unipodal', 'Équilibre statique · yeux ouverts et fermés'],
          ['2', 'Tandem Walk — Marche en tandem', 'Équilibre dynamique · coordination'],
          ['3', '5×STS — Lever de chaise ×5', 'Puissance explosive'],
          ['4', 'CS-30 — Lever de chaise 30 s', 'Force & endurance membres inférieurs'],
          ['5', '2MST — Step test 2 minutes', 'Endurance aérobie · normes BoneFit Canada'],
        ].map(([n, name, desc]) => (
          <div key={n} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '.5px solid rgba(255,255,255,.08)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(29,158,117,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#5DCAA5', flexShrink: 0 }}>{n}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 1 }}>{name}</div>
              <div style={{ fontSize: 11, color: '#5DCAA5' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#FFF8F5', border: '1px solid #F5C4B3', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#712B13' }}>
        <span style={{ fontWeight: 700 }}>Ce dont vous aurez besoin :</span> chaise sans accoudoirs, couloir plat (≥ 6 m), chronomètre (intégré), mur pour appui sécuritaire.
      </div>

      <BtnPrimary label="Commencer le bilan" onClick={() => go('t1')} disabled={!profile.prenom || !profile.email} />
      <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12 }}>Durée estimée : 15–20 minutes · Résultats immédiats</p>
    </div>
  )

  // ── TEST 1 — SLS ─────────────────────────────────────────────────────────
  if (step === 't1') return (
    <div style={wrap}>
      <TestHeader num={1} of={5} title="SLS — Équilibre unipodal" domain="Équilibre statique · proprioception" pct={10} />

      <ProtoBox steps={[
        'Debout près d\'un mur (sans vous appuyer), levez un pied à environ 30 cm du sol.',
        'Bras le long du corps, fixez un point stable devant vous.',
        'Chronométrez jusqu\'à perte d\'équilibre ou 60 s maximum.',
        'Faites yeux ouverts d\'abord, puis yeux fermés. 2 essais chacun — retenez le meilleur.'
      ]} />

      <AlertBox>⚠️ Seuil d'alerte : moins de 10 s yeux ouverts indique un risque de chute élevé (Springer et al., 2007).</AlertBox>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>Yeux ouverts</div>
        <TimerWidget onCapture={v => setV('slsO', String(v))} label="Démarrer — yeux ouverts" />
        <NumInput value={vals.slsO} onChange={v => setV('slsO', v)} placeholder="ex. 28" unit="secondes" label="Durée tenue (meilleur essai)" />
        {vals.slsO && parseFloat(vals.slsO) < 10 && (
          <AlertBox>⚠️ Résultat sous le seuil d'alerte de 10 s. Un suivi professionnel est recommandé.</AlertBox>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>Yeux fermés</div>
        <TimerWidget onCapture={v => setV('slsF', String(v))} label="Démarrer — yeux fermés" />
        <NumInput value={vals.slsF} onChange={v => setV('slsF', v)} placeholder="ex. 8" unit="secondes" label="Durée tenue (meilleur essai)" />
      </div>

      <NormBox>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>RÉFÉRENCE (Springer et al., 2007)</div>
        Adultes 60–69 ans : ≈ 28–30 s yeux ouverts · ≈ 4–5 s yeux fermés
      </NormBox>

      <BtnPrimary label="Test suivant" onClick={() => go('t2')} disabled={!vals.slsO} />
    </div>
  )

  // ── TEST 2 — TANDEM WALK ─────────────────────────────────────────────────
  if (step === 't2') return (
    <div style={wrap}>
      <TestHeader num={2} of={5} title="Tandem Walk — Marche en tandem" domain="Équilibre dynamique · coordination" pct={28} />

      <ProtoBox steps={[
        'Tracez une ligne droite de 3 mètres (ou marquez le sol avec du ruban).',
        'Marchez talon contre orteil, pied après pied, jusqu\'au bout (3 m), puis faites demi-tour et revenez (total 6 m).',
        'Chronométrez le trajet complet aller-retour.',
        'Comptez les erreurs : sortie de ligne, appui sur une surface, pas de côté ou de rattrapage.'
      ]} />

      <TimerWidget onCapture={v => setV('tandemT', String(v))} label="Démarrer le chrono" />

      <NumInput value={vals.tandemT} onChange={v => setV('tandemT', v)} placeholder="ex. 22" unit="secondes" label="Temps aller-retour (6 m)" />

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 8 }}>Erreurs de pas</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setV('tandemE', String(n))} style={{ width: 40, height: 40, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: vals.tandemE === String(n) ? '#E8F5F1' : '#fff', border: vals.tandemE === String(n) ? '1.5px solid #1D9E75' : '1px solid #D3D1C7', color: vals.tandemE === String(n) ? '#085041' : '#1a1a1a' }}>{n}</button>
          ))}
          <button onClick={() => setV('tandemE', '6+')} style={{ padding: '0 12px', height: 40, borderRadius: 8, fontSize: 13, cursor: 'pointer', background: vals.tandemE === '6+' ? '#FAECE7' : '#fff', border: vals.tandemE === '6+' ? '1.5px solid #D85A30' : '1px solid #D3D1C7', color: vals.tandemE === '6+' ? '#993C1D' : '#1a1a1a' }}>6+</button>
        </div>
      </div>

      <NormBox>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>RÉFÉRENCE</div>
        Bon résultat : ≤ 28 s avec ≤ 1 erreur · Au-delà : risque de chute à surveiller
      </NormBox>

      <BtnPrimary label="Test suivant" onClick={() => go('t3')} disabled={!vals.tandemT} />
    </div>
  )

  // ── TEST 3 — 5×STS ───────────────────────────────────────────────────────
  if (step === 't3') return (
    <div style={wrap}>
      <TestHeader num={3} of={5} title="5×STS — Lever de chaise ×5" domain="Puissance explosive des membres inférieurs" pct={46} />

      <ProtoBox steps={[
        'Assis·e sur une chaise droite sans accoudoirs, dos droit, bras croisés sur la poitrine.',
        'Au signal, levez-vous complètement et rasseyez-vous 5 fois le plus vite possible.',
        'Chronométrez de « partez » jusqu\'au moment où vous vous rasseyez la 5e fois.',
        'Assurez-vous de bien étendre les genoux à chaque lever.'
      ]} />

      <TimerWidget onCapture={v => setV('sts5T', String(v))} label="Démarrer" />

      <NumInput value={vals.sts5T} onChange={v => setV('sts5T', v)} placeholder="ex. 10.2" unit="secondes" label="Temps (5 levers)" />

      <NormBox>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>SEUIL D'ALERTE (Bohannon 2006 ; SHARE 2025)</div>
        Votre groupe {profile.age} ans : &gt; {NORMS.sts5[profile.age] || 11.4} s = puissance à améliorer
      </NormBox>

      {vals.sts5T && parseFloat(vals.sts5T) > (NORMS.sts5[profile.age] || 11.4) && (
        <AlertBox>⚠️ Temps supérieur au seuil pour votre groupe d'âge. La puissance explosive est un indicateur clé de longévité fonctionnelle.</AlertBox>
      )}

      <BtnPrimary label="Test suivant" onClick={() => go('t4')} disabled={!vals.sts5T} />
    </div>
  )

  // ── TEST 4 — CS-30 ───────────────────────────────────────────────────────
  if (step === 't4') return (
    <div style={wrap}>
      <TestHeader num={4} of={5} title="CS-30 — Lever de chaise 30 s" domain="Force & endurance membres inférieurs" pct={64} />

      <ProtoBox steps={[
        'Assis·e sur une chaise droite sans accoudoirs, bras croisés sur la poitrine.',
        'Au départ du chrono (30 secondes), levez-vous et rasseyez-vous autant de fois que possible.',
        'Comptez chaque lever complet — dos droit, genoux bien étendus.',
        'Le chrono s\'arrête automatiquement à 30 s. Entrez le nombre de répétitions.'
      ]} />

      <TimerWidget countdown={30} onCapture={() => {}} label="Démarrer le comptage (30 s)" />

      <NumInput value={vals.cs30R} onChange={v => setV('cs30R', v)} placeholder="ex. 13" unit="répétitions" label="Nombre de levers complets" />

      <NormBox>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>SEUIL SOUS LA MOYENNE (Jones et al., 1999 · ELCV Canada)</div>
        Groupe {profile.age} ans {profile.sex === 'H' ? 'hommes' : 'femmes'} : sous la moyenne si &lt; {(NORMS.cs30[profile.age] || NORMS.cs30['60-64'])[profile.sex]} répétitions
      </NormBox>

      <BtnPrimary label="Test suivant" onClick={() => go('t5')} disabled={!vals.cs30R} />
    </div>
  )

  // ── TEST 5 — 2MST ────────────────────────────────────────────────────────
  if (step === 't5') return (
    <div style={wrap}>
      <TestHeader num={5} of={5} title="2MST — Step Test 2 minutes" domain="Endurance aérobie · normes BoneFit Canada" pct={82} />

      <ProtoBox steps={[
        'Trouvez la hauteur cible du genou : à mi-chemin entre le haut de la rotule et l\'épine iliaque antéro-supérieure (milieu de la cuisse).',
        'Marquez cette hauteur sur le mur ou un bâton.',
        'Au signal, marchez en levant alternativement chaque genou jusqu\'à la cible, pendant 2 minutes complètes.',
        'Comptez uniquement les levées du genou droit atteignant la cible. Respirez normalement.'
      ]} />

      <div style={{ background: '#FFF8F5', border: '1px solid #F5C4B3', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#712B13' }}>
        ℹ️ Si vous avez des douleurs articulaires, ralentissez le rythme — l'objectif est de compléter les 2 minutes, pas la vitesse.
      </div>

      <TimerWidget countdown={120} onCapture={() => {}} label="Démarrer (2 minutes)" />

      <NumInput value={vals.mst2R} onChange={v => setV('mst2R', v)} placeholder="ex. 68" unit="levées genou droit" label="Nombre de levées du genou droit" />

      <NormBox>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>NORMES BONEFIT CANADA — RIKLI & JONES</div>
        Groupe {profile.age} ans {profile.sex === 'H' ? 'hommes' : 'femmes'} : norme ≥ {(NORMS.mst2[profile.age] || NORMS.mst2['60-64'])[profile.sex]} levées
      </NormBox>

      <BtnPrimary label="Voir mes résultats" onClick={goResultats} disabled={!vals.mst2R} />
    </div>
  )

  // ── RÉSULTATS ────────────────────────────────────────────────────────────
  if (step === 'resultats' && scores) {
    const total = scores.slsScore + scores.tanScore + scores.sts5Score + scores.cs30Score + scores.mst2Score
    const avg = Math.round(total / 5)
    const color = avg >= 70 ? '#1D9E75' : avg >= 50 ? '#BA7517' : '#D85A30'
    const bgColor = avg >= 70 ? '#E8F5F1' : avg >= 50 ? '#FAEEDA' : '#FAECE7'
    const mention = avg >= 80 ? 'Excellent' : avg >= 70 ? 'Bien au-dessus de la norme' : avg >= 55 ? 'Dans la norme' : avg >= 40 ? 'Sous la norme' : 'Bien sous la norme'

    return (
      <div style={wrap}>
        <ProgressBar pct={90} />
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 104, height: 104, borderRadius: '50%', border: `4px solid ${color}`, background: bgColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color }}>{avg}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color }}>/100</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{mention}</div>
          <div style={{ fontSize: 13, color: '#888780' }}>Score moyen sur 5 domaines · {profile.age} ans · {profile.sex === 'H' ? 'Homme' : 'Femme'}</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Profil radar — 5 domaines</div>
          <BilanRadar scores={scores} />
        </div>

        <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Résultats par domaine</div>
          {[
            ['Équilibre statique (SLS)', scores.slsScore],
            ['Équilibre dynamique (Tandem)', scores.tanScore],
            ['Puissance explosive (5×STS)', scores.sts5Score],
            ['Force & endurance (CS-30)', scores.cs30Score],
            ['Endurance aérobie (2MST)', scores.mst2Score]
          ].map(([label, pct]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 12, width: 170, flexShrink: 0, color: '#444441' }}>{label}</div>
              <div style={{ flex: 1, height: 8, background: '#F1EFE8', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(3, pct)}%`, background: pct >= 70 ? '#1D9E75' : pct >= 50 ? '#BA7517' : '#D85A30', borderRadius: 4, transition: 'width .8s' }} />
              </div>
              <div style={{ fontSize: 12, color: '#888780', width: 38, textAlign: 'right' }}>{pct}/100</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          {scores.recos.map((r, i) => (
            <div key={i} style={{ borderRadius: 10, padding: '12px 16px', marginBottom: 10, display: 'flex', gap: 12, background: r.level === 'ok' ? '#E8F5F1' : r.level === 'alert' ? '#FAECE7' : '#FAEEDA', border: `1px solid ${r.level === 'ok' ? '#9FE1CB' : r.level === 'alert' ? '#F5C4B3' : '#FAC775'}` }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{r.level === 'ok' ? '🏆' : r.level === 'alert' ? '⚠️' : '⚡'}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: '#5F5E5A', lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <BtnPrimary label="Recevoir mon rapport personnalisé" onClick={goRapport} />
        <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Ces résultats sont éducatifs. Kinoa Santé ne pose pas de diagnostic médical.</p>
      </div>
    )
  }

  // ── RAPPORT GPT ──────────────────────────────────────────────────────────
  if (step === 'rapport') return (
    <div style={wrap}>
      <ProgressBar pct={95} />
      <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.5rem', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: '#888780', marginBottom: 8 }}>RAPPORT PERSONNALISÉ — {(profile.prenom || 'VOTRE BILAN').toUpperCase()}</div>
        {loadingRapport ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #E8E6DF', borderTopColor: '#1D9E75', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 14, color: '#888780' }}>Analyse en cours…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : rapport ? (
          <div style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{rapport}</div>
        ) : (
          <div>
            <div style={{ fontSize: 14, color: '#5F5E5A', lineHeight: 1.7, marginBottom: 12 }}>
              <strong style={{ color: '#1a1a1a' }}>Résumé de votre bilan — {profile.prenom}</strong><br /><br />
              {scores && (() => {
                const avg = Math.round((scores.slsScore + scores.tanScore + scores.sts5Score + scores.cs30Score + scores.mst2Score) / 5)
                const best = Math.max(scores.slsScore, scores.tanScore, scores.sts5Score, scores.cs30Score, scores.mst2Score)
                const worst = Math.min(scores.slsScore, scores.tanScore, scores.sts5Score, scores.cs30Score, scores.mst2Score)
                const domains = [
                  ['Équilibre statique', scores.slsScore],
                  ['Équilibre dynamique', scores.tanScore],
                  ['Puissance explosive', scores.sts5Score],
                  ['Force & endurance', scores.cs30Score],
                  ['Endurance aérobie', scores.mst2Score]
                ]
                const bestDomain = domains.find(d => d[1] === best)
                const worstDomain = domains.find(d => d[1] === worst)
                return `Votre score moyen est de ${avg}/100. Votre point fort est ${bestDomain[0]} (${best}/100). Votre axe prioritaire est ${worstDomain[0]} (${worst}/100). ${scores.recos.length > 0 ? scores.recos[0].desc : ''}`
              })()}
            </div>
            <div style={{ fontSize: 13, color: '#888780' }}>ℹ️ Rapport détaillé non disponible — configurez VITE_API_TOKEN pour activer le rapport IA.</div>
          </div>
        )}
      </div>
      <BtnPrimary label="Enregistrer mon rapport" onClick={() => go('lead')} />
    </div>
  )

  // ── LEAD ─────────────────────────────────────────────────────────────────
  if (step === 'lead') return (
    <div style={wrap}>
      <ProgressBar pct={98} />
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: '#1a1a1a' }}>Enregistrer votre rapport</h2>
      <p style={{ fontSize: 14, color: '#888780', marginBottom: 20, lineHeight: 1.6 }}>Recevez votre analyse complète par courriel et choisissez comment aller plus loin.</p>

      <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 4 }}>Prénom</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, padding: '8px 12px', background: '#F9F7F4', borderRadius: 8 }}>{profile.prenom}</div>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 4 }}>Courriel</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, padding: '8px 12px', background: '#F9F7F4', borderRadius: 8 }}>{profile.email}</div>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 6 }}>Téléphone (optionnel)</div>
        <input type="tel" value={lead.tel} onChange={e => setLead(l => ({ ...l, tel: e.target.value }))} placeholder="514-XXX-XXXX" style={{ width: '100%', padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: '#FAFAFA', marginBottom: 16 }} />

        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>Je souhaite :</div>
        {[
          ['consult', 'Parler à un kinésiologue Kinoa'],
          ['programme', 'En savoir plus sur le programme 12 semaines'],
          ['newsletter', 'Recevoir les conseils Kinoa par courriel']
        ].map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#5F5E5A', marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={lead[key]} onChange={e => setLead(l => ({ ...l, [key]: e.target.checked }))}
              style={{ width: 18, height: 18, accentColor: '#1D9E75' }} />
            {label}
          </label>
        ))}
      </div>

      <BtnPrimary label={submitting ? 'Envoi…' : 'Envoyer et recevoir mon rapport'} onClick={handleSubmitLead} disabled={submitting} />
      <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Kinoa Santé ne pose pas de diagnostic. Vos données sont protégées et ne seront pas partagées.</p>
    </div>
  )

  // ── MERCI ─────────────────────────────────────────────────────────────────
  if (step === 'merci') return (
    <div style={wrap}>
      <div style={{ textAlign: 'center', padding: '2.5rem 0 2rem' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8F5F1', border: '2px solid #1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>✓</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>Merci, {profile.prenom} !</h2>
        <p style={{ fontSize: 15, color: '#5F5E5A', lineHeight: 1.7, marginBottom: 28 }}>Votre rapport est en route — vérifiez votre boîte courriel dans les prochaines minutes.</p>
      </div>

      <div style={{ background: '#E8F5F1', border: '1px solid #9FE1CB', borderRadius: 12, padding: '1.25rem', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#085041', marginBottom: 10 }}>Prochaines étapes recommandées</div>
        <div style={{ fontSize: 14, color: '#0F6E56', lineHeight: 2 }}>
          1. Lisez votre rapport et identifiez votre domaine prioritaire<br />
          2. Planifiez une consultation avec un kinésiologue Kinoa<br />
          3. Refaites ce bilan dans 12 semaines pour mesurer vos progrès
        </div>
      </div>

      <BtnPrimary label="Explorer les services Kinoa" onClick={() => window.open('https://kinoa.ca', '_blank')} />
      <BtnSecondary label="Recommencer le bilan" onClick={() => { setStep('intro'); setVals({ slsO: '', slsF: '', tandemT: '', tandemE: '0', sts5T: '', cs30R: '', mst2R: '' }); setScores(null); setRapport('') }} />
    </div>
  )

  return null
}
