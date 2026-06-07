import { useState } from 'react'
import { AGE_OPTS, NORMS, wrap } from './constants'
import { calcScores, generateReport, submitLead, scoreColor } from './utils'
import {
  TimerWidget, BilanRadar, ProgressBar, BtnPrimary, BtnSecondary,
  NormBox, AlertBox, ProtoBox, TestHeader, NumInput, RessentiBLoc
} from './ui'

const INIT_VALS = {
  tugT: '', slsDroit: '', slsGauche: '', sts5T: '',
  tandemT: '', tandemE: '0', mwt6D: ''
}

const INIT_RESSENTI = {
  tug:    { rpe: '', commentaire: '' },
  sls:    { rpe: '', commentaire: '' },
  sts5:   { rpe: '', commentaire: '' },
  tandem: { rpe: '', commentaire: '' },
  mwt6:   { rpe: '', commentaire: '' },
}

export default function Bilan({ mode }) {
  const [step, setStep]       = useState('intro')
  const [profile, setProfile] = useState({ prenom: '', email: '', age: '60-64', sex: 'H' })
  const [vals, setVals]       = useState(INIT_VALS)
  const [ressenti, setRessenti] = useState(INIT_RESSENTI)
  const [scores, setScores]   = useState(null)
  const [rapport, setRapport] = useState('')
  const [loadingRapport, setLoadingRapport] = useState(false)
  const [lead, setLead]       = useState({ tel: '', consult: false, programme: false, newsletter: false })
  const [submitting, setSubmitting] = useState(false)

  const go   = s       => { setStep(s); window.scrollTo(0, 0) }
  const setP = (k, v)  => setProfile(p => ({ ...p, [k]: v }))
  const setV = (k, v)  => setVals(p => ({ ...p, [k]: v }))
  const setR = (t, k, v) => setRessenti(r => ({ ...r, [t]: { ...r[t], [k]: v } }))

  const goResultats = () => {
    setScores(calcScores(profile, vals))
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
    await submitLead(profile, vals, scores, { ...lead, mode }, ressenti)
    setSubmitting(false)
    go('merci')
  }

  const AgeBtn = ({ val }) => (
    <button onClick={() => setP('age', val)} style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginRight: 6, marginBottom: 8, background: profile.age === val ? '#E8F5F1' : '#fff', border: profile.age === val ? '1.5px solid #1D9E75' : '1px solid #D3D1C7', color: profile.age === val ? '#085041' : '#1a1a1a', fontWeight: profile.age === val ? 600 : 400 }}>{val} ans</button>
  )
  const SexBtn = ({ val, label }) => (
    <button onClick={() => setP('sex', val)} style={{ padding: '9px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', marginRight: 8, background: profile.sex === val ? '#E8F5F1' : '#fff', border: profile.sex === val ? '1.5px solid #1D9E75' : '1px solid #D3D1C7', color: profile.sex === val ? '#085041' : '#1a1a1a', fontWeight: profile.sex === val ? 600 : 400 }}>{label}</button>
  )

  const modeLabel = mode === 'autonome' ? 'Mode autonome' : 'Mode clinique'

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === 'intro') return (
    <div style={wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #D85A30', color: '#993C1D', background: '#FAECE7', letterSpacing: '.04em' }}>KINOA SANTÉ</div>
        <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: mode === 'autonome' ? '#E8F5F1' : '#FAECE7', color: mode === 'autonome' ? '#085041' : '#712B13', border: `1px solid ${mode === 'autonome' ? '#9FE1CB' : '#F5C4B3'}`, fontWeight: 600 }}>{modeLabel}</div>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 12, color: '#1a1a1a' }}>
        Bilan fonctionnel <em style={{ color: '#D85A30', fontStyle: 'normal' }}>longévité</em>
      </h1>
      <p style={{ fontSize: 15, color: '#5F5E5A', lineHeight: 1.7, marginBottom: 20 }}>
        5 tests cliniquement validés pour évaluer votre équilibre, votre force et votre endurance — comparés aux normes de votre groupe d'âge.
      </p>

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
          ['1', 'TUG — Timed Up and Go',           'Mobilité fonctionnelle · transferts'],
          ['2', 'SLS — Équilibre unipodal',          'Équilibre statique · jambe droite et gauche'],
          ['3', '5×STS — Lever de chaise ×5',        'Puissance explosive'],
          ['4', 'Tandem Walk — Marche en tandem',     'Équilibre dynamique · coordination'],
          ['5', '6MWT — Marche 6 minutes',            'Endurance aérobie · surface ≥ 20 m'],
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
        <span style={{ fontWeight: 700 }}>Ce dont vous aurez besoin :</span> chaise sans accoudoirs, couloir plat ≥ 3 m (TUG et Tandem), surface ≥ 20 m pour le 6MWT, chronomètre intégré, mur pour appui sécuritaire.
      </div>

      <BtnPrimary label="Commencer le bilan" onClick={() => go('t1')} disabled={!profile.prenom || !profile.email} />
      <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12 }}>Durée estimée : 15–20 minutes · Résultats immédiats</p>
    </div>
  )

  // ── TEST 1 — TUG ───────────────────────────────────────────────────────────
  if (step === 't1') {
    const ref = (NORMS.tug[profile.age] || NORMS.tug['60-64'])[profile.sex]
    return (
      <div style={wrap}>
        <TestHeader num={1} of={5} title="TUG — Timed Up and Go" domain="Mobilité fonctionnelle · transferts" pct={10} />

        <ProtoBox steps={[
          'Assis·e sur une chaise avec dossier, bras le long du corps.',
          'Au signal : levez-vous, marchez 3 m, faites demi-tour, revenez et rasseyez-vous.',
          'Chronométrez du signal jusqu\'au contact complet avec la chaise.',
          '1 essai d\'entraînement (sans chrono), puis 1 essai officiel.',
        ]} />

        <TimerWidget onCapture={v => setV('tugT', String(v))} label="Démarrer" />
        <NumInput value={vals.tugT} onChange={v => setV('tugT', v)} placeholder="ex. 11.2" unit="secondes" label="Temps TUG (essai officiel)" />

        {vals.tugT && parseFloat(vals.tugT) > ref.ok && (
          <AlertBox>⚠️ Temps supérieur au seuil pour votre groupe. Le TUG est un indicateur clé du risque de chute.</AlertBox>
        )}

        <NormBox>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>RÉFÉRENCE — Steffen et al., 2002</div>
          Groupe {profile.age} ans {profile.sex === 'H' ? 'hommes' : 'femmes'} : excellent ≤ {ref.good} s · acceptable ≤ {ref.ok} s
        </NormBox>

        <RessentiBLoc testKey="tug" ressenti={ressenti} setR={setR} />

        <BtnPrimary label="Test suivant" onClick={() => go('t2')} disabled={!vals.tugT} />
      </div>
    )
  }

  // ── TEST 2 — SLS BILATÉRAL ────────────────────────────────────────────────
  if (step === 't2') {
    const ref = (NORMS.sls[profile.age] || NORMS.sls['60-64'])[profile.sex]
    const droitDone  = !!vals.slsDroit
    const gaucheDone = !!vals.slsGauche
    const ecart = droitDone && gaucheDone
      ? Math.abs(parseFloat(vals.slsDroit) - parseFloat(vals.slsGauche)).toFixed(1)
      : null

    return (
      <div style={wrap}>
        <TestHeader num={2} of={5} title="SLS — Équilibre unipodal" domain="Équilibre statique · jambe droite et gauche" pct={28} />

        <ProtoBox steps={[
          'Debout près d\'un mur (sans vous appuyer), levez un pied à environ 30 cm du sol.',
          'Bras le long du corps, fixez un point stable devant vous.',
          'Chronométrez jusqu\'à perte d\'équilibre ou 60 secondes maximum.',
          '2 essais par jambe — retenez le meilleur pour chaque côté.',
        ]} />

        <AlertBox>⚠️ Résultat &lt; {Math.round(ref.ok * 0.4)} s : risque de chute élevé — un suivi professionnel est recommandé (Springer et al., 2007).</AlertBox>

        {/* Jambe droite */}
        <div style={{ background: '#F9F7F4', border: '1px solid #D3D1C7', borderRadius: 10, padding: '14px', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Jambe droite</span>
            {droitDone && <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600 }}>✓ {vals.slsDroit} s</span>}
          </div>
          <TimerWidget countdown={60} onCapture={v => setV('slsDroit', String(v))} label="Démarrer — jambe droite (max 60 s)" />
          <NumInput value={vals.slsDroit} onChange={v => setV('slsDroit', v)} placeholder="ex. 28" unit="secondes" label="Meilleur essai" />
        </div>

        {/* Jambe gauche — apparaît après que la droite est enregistrée */}
        <div style={{ background: '#F9F7F4', border: `1px solid ${droitDone ? '#D3D1C7' : '#E8E6DF'}`, borderRadius: 10, padding: '14px', marginBottom: 12, opacity: droitDone ? 1 : 0.45, transition: 'opacity .3s' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Jambe gauche</span>
            {gaucheDone && <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600 }}>✓ {vals.slsGauche} s</span>}
          </div>
          {droitDone ? (
            <>
              <TimerWidget countdown={60} onCapture={v => setV('slsGauche', String(v))} label="Démarrer — jambe gauche (max 60 s)" />
              <NumInput value={vals.slsGauche} onChange={v => setV('slsGauche', v)} placeholder="ex. 24" unit="secondes" label="Meilleur essai" />
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#B4B2A9', paddingBottom: 4 }}>Complétez d'abord la jambe droite.</div>
          )}
        </div>

        {ecart && parseFloat(ecart) >= 5 && (
          <AlertBox>⚠️ Asymétrie de {ecart} s entre les 2 côtés. Le côté le plus faible ({parseFloat(vals.slsDroit) < parseFloat(vals.slsGauche) ? 'droite' : 'gauche'}) sera utilisé pour le score.</AlertBox>
        )}

        <NormBox>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>RÉFÉRENCE — Springer et al., 2007</div>
          Groupe {profile.age} ans {profile.sex === 'H' ? 'hommes' : 'femmes'} : excellent ≥ {ref.good} s · acceptable ≥ {ref.ok} s
        </NormBox>

        <RessentiBLoc testKey="sls" ressenti={ressenti} setR={setR} />

        <BtnPrimary label="Test suivant" onClick={() => go('t3')} disabled={!vals.slsDroit || !vals.slsGauche} />
      </div>
    )
  }

  // ── TEST 3 — 5×STS ────────────────────────────────────────────────────────
  if (step === 't3') {
    const ref = (NORMS.sts5[profile.age] || NORMS.sts5['60-64'])[profile.sex]
    return (
      <div style={wrap}>
        <TestHeader num={3} of={5} title="5×STS — Lever de chaise ×5" domain="Puissance explosive des membres inférieurs" pct={46} />

        <ProtoBox steps={[
          'Assis·e sur une chaise droite sans accoudoirs, dos droit, bras croisés sur la poitrine.',
          'Au signal, levez-vous complètement et rasseyez-vous 5 fois le plus vite possible.',
          'Chronométrez de « partez » jusqu\'au moment où vous vous rasseyez la 5e fois.',
          'Assurez-vous de bien étendre les genoux à chaque lever.',
        ]} />

        <TimerWidget onCapture={v => setV('sts5T', String(v))} label="Démarrer" />
        <NumInput value={vals.sts5T} onChange={v => setV('sts5T', v)} placeholder="ex. 10.2" unit="secondes" label="Temps (5 levers)" />

        {vals.sts5T && parseFloat(vals.sts5T) > ref.ok && (
          <AlertBox>⚠️ Temps supérieur au seuil pour votre groupe d'âge. La puissance explosive est un indicateur clé de longévité fonctionnelle.</AlertBox>
        )}

        <NormBox>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>SEUIL D'ALERTE — Bohannon 2006 · SHARE 2025</div>
          Groupe {profile.age} ans {profile.sex === 'H' ? 'hommes' : 'femmes'} : excellent ≤ {ref.good} s · acceptable ≤ {ref.ok} s
        </NormBox>

        <RessentiBLoc testKey="sts5" ressenti={ressenti} setR={setR} />

        <BtnPrimary label="Test suivant" onClick={() => go('t4')} disabled={!vals.sts5T} />
      </div>
    )
  }

  // ── TEST 4 — TANDEM WALK ──────────────────────────────────────────────────
  if (step === 't4') return (
    <div style={wrap}>
      <TestHeader num={4} of={5} title="Tandem Walk — Marche en tandem" domain="Équilibre dynamique · coordination" pct={64} />

      <ProtoBox steps={[
        'Tracez une ligne droite de 3 mètres (ou marquez le sol avec du ruban).',
        'Marchez talon contre orteil, pied après pied, jusqu\'au bout (3 m), faites demi-tour et revenez (6 m total).',
        'Chronométrez le trajet complet aller-retour.',
        'Comptez les erreurs : sortie de ligne, appui latéral, pas de rattrapage.',
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

      <RessentiBLoc testKey="tandem" ressenti={ressenti} setR={setR} />

      <BtnPrimary label="Test suivant" onClick={() => go('t5')} disabled={!vals.tandemT} />
    </div>
  )

  // ── TEST 5 — 6MWT ─────────────────────────────────────────────────────────
  if (step === 't5') {
    const ref = (NORMS.mwt6[profile.age] || NORMS.mwt6['60-64'])[profile.sex]
    return (
      <div style={wrap}>
        <TestHeader num={5} of={5} title="6MWT — Marche 6 minutes" domain="Endurance aérobie" pct={82} />

        <div style={{ background: '#FAECE7', border: '1px solid #F5C4B3', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#712B13' }}>
          ⚠️ <strong>Ce test requiert une surface plane d'au moins 20 m.</strong> Préparez un couloir ou une allée extérieure. Faites des allers-retours sur la longueur disponible.
        </div>

        <ProtoBox steps={[
          'Marquez 2 points espacés d\'au moins 20 m sur une surface plane.',
          'Marchez aussi vite que possible sans courir pendant 6 minutes complètes.',
          'Faites des allers-retours entre les 2 points en vous déplaçant sans interruption.',
          'À la fin du timer, mesurez ou estimez la distance totale parcourue.',
        ]} />

        <TimerWidget countdown={360} onCapture={() => {}} label="Démarrer (6 minutes)" />
        <NumInput value={vals.mwt6D} onChange={v => setV('mwt6D', v)} placeholder="ex. 480" unit="mètres" label="Distance totale parcourue" />

        <NormBox>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>RÉFÉRENCE — Enright & Sherrill, 1998</div>
          Groupe {profile.age} ans {profile.sex === 'H' ? 'hommes' : 'femmes'} : excellent ≥ {ref.good} m · acceptable ≥ {ref.ok} m
        </NormBox>

        <RessentiBLoc testKey="mwt6" ressenti={ressenti} setR={setR} />

        <BtnPrimary label="Voir mes résultats" onClick={goResultats} disabled={!vals.mwt6D} />
      </div>
    )
  }

  // ── RÉSULTATS ─────────────────────────────────────────────────────────────
  if (step === 'resultats' && scores) {
    const vals5 = [scores.tugScore, scores.slsScore, scores.sts5Score, scores.tanScore, scores.mwt6Score]
    const avg     = Math.round(vals5.reduce((a, b) => a + b, 0) / 5)
    const color   = scoreColor(avg)
    const bgColor = avg >= 70 ? '#E8F5F1' : avg >= 50 ? '#FAEEDA' : '#FAECE7'
    const mention = avg >= 80 ? 'Excellent' : avg >= 70 ? 'Bien au-dessus de la norme' : avg >= 55 ? 'Dans la norme' : avg >= 40 ? 'Sous la norme' : 'Bien sous la norme'

    const domaines = [
      ['Mobilité fonctionnelle (TUG)',    scores.tugScore],
      ['Équilibre statique (SLS)',         scores.slsScore],
      ['Puissance explosive (5×STS)',      scores.sts5Score],
      ['Équilibre dynamique (Tandem)',     scores.tanScore],
      ['Endurance aérobie (6MWT)',         scores.mwt6Score],
    ]

    const slsDroit  = parseFloat(vals.slsDroit)  || 0
    const slsGauche = parseFloat(vals.slsGauche) || 0
    const coteLimit = slsDroit < slsGauche ? 'droite' : 'gauche'

    return (
      <div style={wrap}>
        <ProgressBar pct={90} />
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 104, height: 104, borderRadius: '50%', border: `4px solid ${color}`, background: bgColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color }}>{avg}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color }}>/100</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{mention}</div>
          <div style={{ fontSize: 13, color: '#888780' }}>Score moyen · {profile.age} ans · {profile.sex === 'H' ? 'Homme' : 'Femme'}</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Profil radar — 5 domaines</div>
          <BilanRadar scores={scores} coloredPoints={mode === 'autonome'} />
        </div>

        <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Résultats par domaine</div>
          {domaines.map(([label, pct]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 12, width: 185, flexShrink: 0, color: '#444441' }}>{label}</div>
              <div style={{ flex: 1, height: 8, background: '#F1EFE8', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(3, pct)}%`, background: scoreColor(pct), borderRadius: 4, transition: 'width .8s' }} />
              </div>
              <div style={{ fontSize: 12, color: '#888780', width: 38, textAlign: 'right' }}>{pct}/100</div>
            </div>
          ))}
          {slsDroit > 0 && slsGauche > 0 && (
            <div style={{ fontSize: 12, color: '#888780', marginTop: 6, paddingTop: 10, borderTop: '1px solid #F1EFE8' }}>
              SLS — Droite : {slsDroit} s · Gauche : {slsGauche} s
              {Math.abs(slsDroit - slsGauche) >= 5 && (
                <span style={{ color: '#BA7517', fontWeight: 600 }}> · Côté limitant : {coteLimit}</span>
              )}
            </div>
          )}
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

        {mode === 'autonome' ? (
          <>
            <div style={{ background: '#1a2e28', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9FE1CB', marginBottom: 8 }}>Programme Kinoa — 12 semaines</div>
              <p style={{ fontSize: 13, color: '#D4EFE6', lineHeight: 1.6, margin: 0 }}>
                Un plan d'entraînement personnalisé, guidé par un kinésiologue, pour améliorer vos points faibles et maintenir vos forces.
              </p>
            </div>
            <BtnPrimary label="Rejoindre le programme Kinoa" onClick={() => go('lead')} />
          </>
        ) : (
          <BtnPrimary label="Recevoir mon rapport personnalisé" onClick={goRapport} />
        )}

        <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Ces résultats sont éducatifs. Kinoa Santé ne pose pas de diagnostic médical.</p>
      </div>
    )
  }

  // ── RAPPORT GPT (mode clinique) ───────────────────────────────────────────
  if (step === 'rapport') return (
    <div style={wrap}>
      <ProgressBar pct={95} />
      <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.5rem', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: '#888780', marginBottom: 8 }}>
          RAPPORT PERSONNALISÉ — {(profile.prenom || 'VOTRE BILAN').toUpperCase()}
        </div>
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
              <strong style={{ color: '#1a1a1a' }}>Résumé — {profile.prenom}</strong><br /><br />
              {scores && (() => {
                const best  = Math.max(scores.tugScore, scores.slsScore, scores.sts5Score, scores.tanScore, scores.mwt6Score)
                const worst = Math.min(scores.tugScore, scores.slsScore, scores.sts5Score, scores.tanScore, scores.mwt6Score)
                const doms  = [['Mobilité fonctionnelle', scores.tugScore], ['Équilibre statique', scores.slsScore], ['Puissance explosive', scores.sts5Score], ['Équilibre dynamique', scores.tanScore], ['Endurance aérobie', scores.mwt6Score]]
                const bestDom  = doms.find(d => d[1] === best)
                const worstDom = doms.find(d => d[1] === worst)
                const avg = Math.round((scores.tugScore + scores.slsScore + scores.sts5Score + scores.tanScore + scores.mwt6Score) / 5)
                return `Score moyen : ${avg}/100. Point fort : ${bestDom[0]} (${best}/100). Axe prioritaire : ${worstDom[0]} (${worst}/100).`
              })()}
            </div>
            <div style={{ fontSize: 13, color: '#888780' }}>ℹ️ Rapport IA non disponible — configurez VITE_API_TOKEN pour activer cette fonctionnalité.</div>
          </div>
        )}
      </div>
      <BtnPrimary label="Enregistrer mon rapport" onClick={() => go('lead')} />
    </div>
  )

  // ── LEAD — AUTONOME ────────────────────────────────────────────────────────
  if (step === 'lead' && mode === 'autonome') return (
    <div style={wrap}>
      <ProgressBar pct={97} />
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: '#1a1a1a' }}>Recevoir votre plan personnalisé</h2>
      <p style={{ fontSize: 14, color: '#888780', marginBottom: 20, lineHeight: 1.6 }}>On envoie votre radar et vos recommandations à votre adresse courriel.</p>

      <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 4 }}>Prénom</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, padding: '8px 12px', background: '#F9F7F4', borderRadius: 8 }}>{profile.prenom}</div>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 4 }}>Courriel</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, padding: '8px 12px', background: '#F9F7F4', borderRadius: 8 }}>{profile.email}</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#5F5E5A', cursor: 'pointer' }}>
          <input type="checkbox" checked={lead.newsletter} onChange={e => setLead(l => ({ ...l, newsletter: e.target.checked }))} style={{ width: 18, height: 18, accentColor: '#1D9E75' }} />
          Recevoir les conseils Kinoa par courriel
        </label>
      </div>

      <BtnPrimary label={submitting ? 'Envoi…' : 'Recevoir mon plan'} onClick={handleSubmitLead} disabled={submitting} />
      <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Vos données sont protégées et ne seront pas partagées.</p>
    </div>
  )

  // ── LEAD — CLINIQUE ────────────────────────────────────────────────────────
  if (step === 'lead' && mode === 'clinique') return (
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
        <input type="tel" value={lead.tel} onChange={e => setLead(l => ({ ...l, tel: e.target.value }))} placeholder="514-XXX-XXXX"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: '#FAFAFA', marginBottom: 16 }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>Je souhaite :</div>
        {[
          ['consult',    'Parler à un kinésiologue Kinoa'],
          ['programme',  'En savoir plus sur le programme 12 semaines'],
          ['newsletter', 'Recevoir les conseils Kinoa par courriel'],
        ].map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#5F5E5A', marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={lead[key]} onChange={e => setLead(l => ({ ...l, [key]: e.target.checked }))} style={{ width: 18, height: 18, accentColor: '#1D9E75' }} />
            {label}
          </label>
        ))}
      </div>

      <BtnPrimary label={submitting ? 'Envoi…' : 'Envoyer et recevoir mon rapport'} onClick={handleSubmitLead} disabled={submitting} />
      <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Vos données sont protégées et ne seront pas partagées.</p>
    </div>
  )

  // ── MERCI ──────────────────────────────────────────────────────────────────
  if (step === 'merci') return (
    <div style={wrap}>
      <div style={{ textAlign: 'center', padding: '2.5rem 0 2rem' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8F5F1', border: '2px solid #1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>✓</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>Merci, {profile.prenom} !</h2>
        <p style={{ fontSize: 15, color: '#5F5E5A', lineHeight: 1.7, marginBottom: 28 }}>
          {mode === 'clinique'
            ? 'Votre rapport est en route — vérifiez votre boîte courriel dans les prochaines minutes.'
            : 'Vos résultats ont bien été enregistrés. On revient vers vous très bientôt.'}
        </p>
      </div>

      <div style={{ background: '#E8F5F1', border: '1px solid #9FE1CB', borderRadius: 12, padding: '1.25rem', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#085041', marginBottom: 10 }}>Prochaines étapes recommandées</div>
        <div style={{ fontSize: 14, color: '#0F6E56', lineHeight: 2 }}>
          1. {mode === 'clinique' ? 'Lisez votre rapport et identifiez votre domaine prioritaire' : 'Consultez votre radar et concentrez-vous sur votre point faible'}<br />
          2. Planifiez une consultation avec un kinésiologue Kinoa<br />
          3. Refaites ce bilan dans 12 semaines pour mesurer vos progrès
        </div>
      </div>

      <BtnPrimary label="Explorer les services Kinoa" onClick={() => window.open('https://kinoa.ca', '_blank')} />
      <BtnSecondary label="Recommencer le bilan" onClick={() => { setStep('intro'); setVals(INIT_VALS); setRessenti(INIT_RESSENTI); setScores(null); setRapport('') }} />
    </div>
  )

  return null
}
