import { useState, useEffect, useRef } from 'react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip
} from 'chart.js'
import { fmtTime, scoreColor } from './utils'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

// ─── TIMER ─────────────────────────────────────────────────────────────────
export function TimerWidget({ countdown = null, onCapture, label = 'Démarrer', resetLabel = 'Refaire' }) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const iRef  = useRef(null)
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
    <div style={{ background: '#F1EFE8', borderRadius: 12, padding: 16, marginBottom: 12, textAlign: 'center' }}>
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
      {done && <div style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600, marginTop: 8 }}>Temps enregistré</div>}
    </div>
  )
}

// ─── RADAR ─────────────────────────────────────────────────────────────────
export function BilanRadar({ scores, coloredPoints = false }) {
  const vals = [scores.tugScore, scores.slsScore, scores.sts5Score, scores.tanScore, scores.mwt6Score]
  const ptColors = coloredPoints ? vals.map(scoreColor) : Array(5).fill('#1D9E75')

  const data = {
    labels: ['Mobilité\nfonctionnelle', 'Équilibre\nstatique', 'Puissance\nexplosive', 'Équilibre\ndynamique', 'Endurance\naérobie'],
    datasets: [{
      data: vals,
      backgroundColor: 'rgba(29,158,117,0.15)',
      borderColor: '#1D9E75',
      borderWidth: 2,
      pointBackgroundColor: ptColors,
      pointBorderColor: ptColors,
      pointRadius: 5,
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
export function ProgressBar({ pct }) {
  return (
    <div style={{ height: 3, background: '#E8E6DF', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: '#1D9E75', borderRadius: 2, transition: 'width .4s' }} />
    </div>
  )
}

export function BtnPrimary({ label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: 14, background: disabled ? '#D3D1C7' : '#D85A30', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', marginTop: 8 }}>
      {label} →
    </button>
  )
}

export function BtnSecondary({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: 12, background: 'transparent', color: '#5F5E5A', border: '1px solid #D3D1C7', borderRadius: 10, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
      {label}
    </button>
  )
}

export function NormBox({ children }) {
  return <div style={{ background: '#E8F5F1', border: '1px solid #9FE1CB', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#085041' }}>{children}</div>
}

export function AlertBox({ children }) {
  return <div style={{ background: '#FAECE7', border: '1px solid #F5C4B3', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#712B13' }}>{children}</div>
}

export function ProtoBox({ steps }) {
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

export function TestHeader({ num, of, title, domain, pct }) {
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

export function NumInput({ value, onChange, placeholder, unit, label }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 6 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} step="0.1"
          style={{ width: 110, padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 18, textAlign: 'center', fontWeight: 600, background: '#fff' }} />
        <span style={{ fontSize: 13, color: '#888780' }}>{unit}</span>
      </div>
    </div>
  )
}

// ─── RESSENTI ───────────────────────────────────────────────────────────────
export function RessentiBLoc({ testKey, ressenti, setR }) {
  const { rpe, commentaire } = ressenti[testKey]
  const rpeNum = parseInt(rpe) || 0

  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: '#888780', marginBottom: 12 }}>VOTRE RESSENTI <span style={{ fontWeight: 400, letterSpacing: 0 }}>(optionnel)</span></div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 2 }}>Comment avez-vous trouvé ce test ?</div>
        <div style={{ fontSize: 11, color: '#B4B2A9', marginBottom: 8 }}>1 = très facile · 10 = effort maximal</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => {
            const selected = rpeNum === n
            const col = n <= 3 ? { bg: '#E8F5F1', border: '#1D9E75', text: '#085041' }
                      : n <= 6 ? { bg: '#FAEEDA', border: '#BA7517', text: '#7A4A0A' }
                      :          { bg: '#FAECE7', border: '#D85A30', text: '#712B13' }
            return (
              <button key={n} onClick={() => setR(testKey, 'rpe', rpeNum === n ? '' : String(n))}
                style={{ width: 36, height: 36, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: selected ? col.bg : '#F9F7F4',
                  border: `${selected ? 1.5 : 1}px solid ${selected ? col.border : '#E8E6DF'}`,
                  color: selected ? col.text : '#888780' }}>
                {n}
              </button>
            )
          })}
        </div>
      </div>

      <textarea value={commentaire} onChange={e => setR(testKey, 'commentaire', e.target.value)}
        placeholder="Ex : douleur au genou droit, manque d'équilibre, essoufflement…"
        rows={2}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 13, color: '#1a1a1a', background: '#FAFAFA', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}
      />
    </div>
  )
}
