import { useState } from 'react'

const NORMS = {
  '6mwt': {
    '50-59': { H: 690, F: 635 },
    '60-69': { H: 640, F: 580 },
    '70-75': { H: 585, F: 525 }
  },
  cs30: {
    '50-59': { H: 15, F: 13 },
    '60-69': { H: 14, F: 12 },
    '70-75': { H: 12, F: 10 }
  },
  sts5: {
    '50-59': 11,
    '60-69': 11.4,
    '70-75': 12.6
  },
  kasch: {
    '50-59': { H: { ex: 84, moy: 100 }, F: { ex: 88, moy: 104 } },
    '60-69': { H: { ex: 90, moy: 106 }, F: { ex: 94, moy: 110 } },
    '70-75': { H: { ex: 96, moy: 112 }, F: { ex: 100, moy: 116 } }
  }
}

const STEPS = [
  'intro', 'triage1', 'triage2', 'triage3',
  'redirect',
  't1', 't2t3', 't4t5', 't6t7',
  'resultats', 'lead', 'merci'
]

export default function App() {
  const [step, setStep] = useState('intro')
  const [profile, setProfile] = useState({ douleur: '', dx: '', age: '60-69', sex: 'H' })
  const [vals, setVals] = useState({
    v6mwt: '', vCS30: '', v5STS: '', vSLSo: '', vSLSf: '',
    stage4: 0, vTandem: '', vTandemErr: '', vKasch: ''
  })
  const [scores, setScores] = useState(null)
  const [lead, setLead] = useState({ nom: '', email: '', tel: '' })

  const go = (s) => { setStep(s); window.scrollTo(0, 0) }

  const setP = (k, v) => setProfile(p => ({ ...p, [k]: v }))
  const setV = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const routeTriage = () => {
    if (profile.douleur === 'oui') go('redirect')
    else go('t1')
  }

  const calcResults = () => {
    const a = profile.age, s = profile.sex
    let score = 0, total = 0
    let end = 0, force = 0, puis = 0, eq = 0, cardio = 0, dyn = 0
    const recos = []

    const v6 = parseFloat(vals.v6mwt) || 0
    const vCS = parseFloat(vals.vCS30) || 0
    const v5s = parseFloat(vals.v5STS) || 0
    const vSo = parseFloat(vals.vSLSo) || 0
    const vTd = parseFloat(vals.vTandem) || 0
    const vTe = parseFloat(vals.vTandemErr) || 0
    const vK = parseFloat(vals.vKasch) || 0

    if (v6 > 0) {
      total++
      const ref = NORMS['6mwt'][a][s]
      end = Math.min(100, Math.round((v6 / ref) * 100))
      if (v6 >= ref * 0.85) score++
      else recos.push({ color: 'amber', title: 'Endurance aérobie à améliorer', desc: 'Programme de marche ou course progressive 3×/semaine. Augmentez de 10% la distance chaque semaine.' })
    }

    if (vCS > 0) {
      total++
      const ref = NORMS.cs30[a][s]
      force = Math.min(100, Math.round((vCS / ref) * 100))
      if (vCS >= ref) score++
      else recos.push({ color: 'amber', title: 'Force des jambes — à renforcer', desc: 'Renforcement quadriceps et fessiers 2–3×/semaine, progressif selon votre tolérance.' })
    }

    if (v5s > 0) {
      total++
      const ref = NORMS.sts5[a]
      puis = v5s <= ref ? 100 : Math.min(100, Math.round((ref / v5s) * 100))
      if (v5s <= ref) score++
      else recos.push({ color: 'amber', title: 'Puissance explosive — à développer', desc: 'Exercices avec composante de vitesse : levers rapides, montées de marches, squats explosifs.' })
    }

    if (vSo > 0) {
      total++
      eq = Math.min(100, Math.round((vSo / 45) * 100))
      if (vSo >= 10) score++
      else recos.push({ color: 'amber', title: 'Équilibre statique — attention', desc: 'Moins de 10s yeux ouverts : consultation kiné recommandée. Exercices d\'équilibre quotidiens.' })
    }

    if (vals.stage4 > 0) {
      total++
      if (vals.stage4 >= 3) score++
    }

    if (vTd > 0) {
      total++
      dyn = vTd <= 28 && vTe <= 1 ? 100 : Math.min(100, Math.round((28 / vTd) * 80))
      if (vTd <= 28 && vTe <= 1) score++
      else recos.push({ color: 'amber', title: 'Équilibre dynamique — à travailler', desc: 'Marche en tandem, changements de direction, entraînement proprioceptif recommandés.' })
    }

    if (vK > 0) {
      total++
      const k = NORMS.kasch[a][s]
      if (vK < k.ex) { cardio = 100; score++ }
      else if (vK < k.moy) { cardio = 65; score++ }
      else { cardio = 30; recos.push({ color: 'amber', title: 'Récupération cardio — à améliorer', desc: 'FC de récupération élevée pour votre groupe d\'âge. Programme cardio progressif 3×/semaine.' }) }
    }

    if (recos.length === 0) recos.push({ color: 'green', title: 'Excellente condition fonctionnelle', desc: 'Maintenez votre programme. Refaites les tests dans 3 mois.' })

    setScores({ score, total, end, force, puis, eq, cardio, dyn, recos })
    go('resultats')
  }

  const n = NORMS
  const a = profile.age, s = profile.sex

  const OptionBtn = ({ label, selected, onClick }) => (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '14px 16px', marginBottom: 10,
      background: selected ? '#E1F5EE' : '#fff',
      border: selected ? '1.5px solid #1D9E75' : '1px solid #D3D1C7',
      borderRadius: 10, fontSize: 14, color: selected ? '#085041' : '#1a1a1a',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10
    }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', border: selected ? '5px solid #1D9E75' : '2px solid #B4B2A9', flexShrink: 0, display: 'inline-block' }} />
      {label}
    </button>
  )

  const AgeBtn = ({ val }) => (
    <button onClick={() => setP('age', val)} style={{
      padding: '10px 18px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
      background: profile.age === val ? '#E1F5EE' : '#fff',
      border: profile.age === val ? '1.5px solid #1D9E75' : '1px solid #D3D1C7',
      color: profile.age === val ? '#085041' : '#1a1a1a', marginRight: 8, marginBottom: 8
    }}>{val} ans</AgeBtn>
  )

  const SexBtn = ({ val, label }) => (
    <button onClick={() => setP('sex', val)} style={{
      padding: '10px 18px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
      background: profile.sex === val ? '#E1F5EE' : '#fff',
      border: profile.sex === val ? '1.5px solid #1D9E75' : '1px solid #D3D1C7',
      color: profile.sex === val ? '#085041' : '#1a1a1a', marginRight: 8
    }}>{label}</SexBtn>
  )

  const Input = ({ id, placeholder, step: st, unit }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <input type="number" value={vals[id]} onChange={e => setV(id, e.target.value)}
        placeholder={placeholder} step={st || 1}
        style={{ width: 100, padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 16, textAlign: 'center' }} />
      <span style={{ fontSize: 13, color: '#888780' }}>{unit}</span>
    </div>
  )

  const BtnPrimary = ({ label, onClick }) => (
    <button onClick={onClick} style={{
      width: '100%', padding: 14, background: '#D85A30', color: '#fff',
      border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
      cursor: 'pointer', marginTop: 8
    }}>{label} →</button>
  )

  const BtnSecondary = ({ label, onClick }) => (
    <button onClick={onClick} style={{
      width: '100%', padding: 12, background: 'transparent', color: '#5F5E5A',
      border: '1px solid #D3D1C7', borderRadius: 10, fontSize: 14,
      cursor: 'pointer', marginTop: 8
    }}>{label}</button>
  )

  const NormBox = ({ children }) => (
    <div style={{ background: '#E1F5EE', border: '1px solid #9FE1CB', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#085041' }}>
      {children}
    </div>
  )

  const ProtoBox = ({ steps }) => (
    <div style={{ background: '#F8F9FA', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', color: '#888780', marginBottom: 8 }}>PROTOCOLE</div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13, color: '#444441', lineHeight: 1.6 }}>
          <span style={{ color: '#1D9E75', fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
          <span>{s}</span>
        </div>
      ))}
    </div>
  )

  const TipBox = ({ text }) => (
    <div style={{ background: '#F1EFE8', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#444441' }}>
      ℹ️ {text}
    </div>
  )

  const TestCard = ({ num, title, domain, children }) => (
    <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0F6E56', flexShrink: 0 }}>{num}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#888780' }}>{domain}</div>
        </div>
      </div>
      {children}
    </div>
  )

  const wrap = { maxWidth: 480, margin: '0 auto', padding: '1.5rem 1rem 4rem', fontFamily: 'system-ui, sans-serif' }

  const ProgressBar = ({ pct }) => (
    <div style={{ height: 3, background: '#F1EFE8', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: '#1D9E75', borderRadius: 2, transition: 'width .4s' }} />
    </div>
  )

  const DomainBar = ({ label, pct }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 500, width: 140, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: '#F1EFE8', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(4, pct)}%`, borderRadius: 4, background: pct >= 70 ? '#1D9E75' : pct >= 50 ? '#BA7517' : '#D85A30', transition: 'width .8s' }} />
      </div>
      <div style={{ fontSize: 12, color: '#888780', width: 40, textAlign: 'right' }}>{pct}%</div>
    </div>
  )

  if (step === 'intro') return (
    <div style={wrap}>
      <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #D85A30', color: '#993C1D', background: '#FAECE7', marginBottom: 16 }}>Bilan fonctionnel longévité</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>Connaissez votre <em style={{ color: '#D85A30', fontStyle: 'normal' }}>vrai</em> niveau de forme</h1>
      <p style={{ fontSize: 15, color: '#5F5E5A', lineHeight: 1.7, marginBottom: 8 }}>7 tests validés scientifiquement pour évaluer votre force, votre équilibre et votre endurance. Comparez-vous aux normes de votre groupe d'âge.</p>
      <p style={{ fontSize: 13, color: '#888780', marginBottom: 24 }}>⏱ Environ 20–25 minutes</p>
      <div style={{ background: '#FFF8F5', border: '1px solid #F5C4B3', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: '#993C1D', marginBottom: 10 }}>CE DONT VOUS AUREZ BESOIN</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Couloir ou trottoir plat (≥20 m)', 'Chaise sans accoudoirs', 'Chronomètre (téléphone)', 'Mur pour appui sécuritaire', 'Marche d\'escalier (~18–20 cm)', 'Ruban à mesurer'].map(e => (
            <div key={e} style={{ fontSize: 13, color: '#5F5E5A' }}>• {e}</div>
          ))}
        </div>
      </div>
      <div style={{ background: '#1a2e28', borderRadius: 12, padding: '1.25rem', marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#9FE1CB', marginBottom: 4 }}>Les 7 tests que vous allez faire</div>
        <div style={{ fontSize: 12, color: '#5DCAA5', marginBottom: 12 }}>Standardisés, utilisés dans les programmes de prévention au Canada.</div>
        {[
          ['1', 'Marche ou course 6 minutes (6MWT)', 'Endurance cardio-respiratoire'],
          ['2', 'Lever de chaise 30 s (CS-30)', 'Force membres inférieurs'],
          ['3', 'Lever de chaise × 5 (5xSTS)', 'Puissance explosive'],
          ['4', 'Équilibre unipodal (SLS)', 'Équilibre statique · proprioception'],
          ['5', 'Équilibre 4 étapes (4-Stage)', 'Progression équilibre statique'],
          ['6', 'Marche en tandem', 'Équilibre dynamique · coordination'],
          ['7', 'Step Test 3 min (Kasch)', 'Condition cardio-vasculaire · FC récupération'],
        ].map(([num, name, desc]) => (
          <div key={num} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '.5px solid rgba(255,255,255,.08)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(29,158,117,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#5DCAA5', flexShrink: 0 }}>{num}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 12, color: '#5DCAA5' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
      <BtnPrimary label="Compris, commencer" onClick={() => go('triage1')} />
    </div>
  )

  if (step === 'triage1') return (
    <div style={wrap}>
      <ProgressBar pct={12} />
      <div style={{ fontSize: 12, color: '#888780', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><span>Triage 1/3</span><span>Étape 1/10</span></div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Avez-vous des douleurs au genou qui affectent votre quotidien ?</h2>
      <p style={{ fontSize: 14, color: '#888780', marginBottom: 20 }}>Montée d'escaliers, marche prolongée, lever du sol</p>
      <OptionBtn label="Oui, la douleur limite mes activités" selected={profile.douleur === 'oui'} onClick={() => { setP('douleur', 'oui'); go('triage2') }} />
      <OptionBtn label="Parfois, mais ça ne m'arrête pas vraiment" selected={profile.douleur === 'parfois'} onClick={() => { setP('douleur', 'parfois'); go('triage2') }} />
      <OptionBtn label="Non, pas de douleur significative" selected={profile.douleur === 'non'} onClick={() => { setP('douleur', 'non'); go('triage2') }} />
    </div>
  )

  if (step === 'triage2') return (
    <div style={wrap}>
      <ProgressBar pct={20} />
      <div style={{ fontSize: 12, color: '#888780', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><span>Triage 2/3</span><span>Étape 2/10</span></div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Avez-vous un diagnostic d'arthrose du genou ?</h2>
      <p style={{ fontSize: 14, color: '#888780', marginBottom: 20 }}>Confirmé par un médecin, un radiologue ou un spécialiste</p>
      <OptionBtn label="Oui, diagnostic confirmé" selected={profile.dx === 'oui'} onClick={() => { setP('dx', 'oui'); go('triage3') }} />
      <OptionBtn label="Non, pas de diagnostic" selected={profile.dx === 'non'} onClick={() => { setP('dx', 'non'); go('triage3') }} />
      <OptionBtn label="Je ne suis pas certain·e" selected={profile.dx === 'incertain'} onClick={() => { setP('dx', 'incertain'); go('triage3') }} />
    </div>
  )

  if (step === 'triage3') return (
    <div style={wrap}>
      <ProgressBar pct={28} />
      <div style={{ fontSize: 12, color: '#888780', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><span>Triage 3/3</span><span>Étape 3/10</span></div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Quelques informations sur vous</h2>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 8 }}>Groupe d'âge</div>
        <div><AgeBtn val="50-59" /><AgeBtn val="60-69" /><AgeBtn val="70-75" /></div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 8 }}>Sexe biologique</div>
        <div><SexBtn val="H" label="Homme" /><SexBtn val="F" label="Femme" /></div>
      </div>
      <BtnPrimary label="Voir mes tests" onClick={routeTriage} />
    </div>
  )

  if (step === 'redirect') return (
    <div style={wrap}>
      <div style={{ background: '#FAECE7', border: '1px solid #F5C4B3', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#993C1D', marginBottom: 8 }}>⚠️ Bilan clinique recommandé</div>
        <p style={{ fontSize: 14, color: '#712B13', lineHeight: 1.6 }}>Vos réponses indiquent une douleur qui affecte significativement votre quotidien. Le bilan clinique Kinoa est mieux adapté à votre situation.</p>
      </div>
      <BtnPrimary label="Accéder au bilan clinique" onClick={() => window.open('https://bilan.kinoa.ca', '_blank')} />
      <BtnSecondary label="Continuer quand même ce bilan" onClick={() => go('t1')} />
    </div>
  )

  if (step === 't1') return (
    <div style={wrap}>
      <ProgressBar pct={36} />
      <div style={{ fontSize: 12, color: '#888780', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><span>Test 1/7</span><span>Étape 4/10</span></div>
      <TestCard num="1" title="Marche ou course de 6 minutes (6MWT)" domain="Endurance cardio-respiratoire fonctionnelle">
        <TipBox text="Marchez si vous êtes moins actif·ve, courez si vous êtes à l'aise. Maintenez un effort soutenu pendant 6 minutes complètes." />
        <ProtoBox steps={[
          'Sur un parcours plat mesuré (couloir, trottoir, piste), marchez ou courez le plus loin possible en 6 minutes.',
          'Faites demi-tour à chaque bout — marquez les 20 ou 30 mètres avec un repère visible.',
          'Mesurez la distance totale parcourue en mètres. Répétez 2 fois, retenez le meilleur résultat.'
        ]} />
        <NormBox>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', color: '#0F6E56', marginBottom: 4 }}>DISTANCE ATTENDUE (Wickerson et al., 2011 — Canada)</div>
          Homme {a} : ≈ {n['6mwt'][a]['H']} m · Femme : ≈ {n['6mwt'][a]['F']} m
        </NormBox>
        <div style={{ fontSize: 14, color: '#5F5E5A', marginBottom: 6 }}>Distance parcourue</div>
        <Input id="v6mwt" placeholder="ex. 580" unit="mètres" />
      </TestCard>
      <BtnPrimary label="Test suivant" onClick={() => go('t2t3')} />
    </div>
  )

  if (step === 't2t3') return (
    <div style={wrap}>
      <ProgressBar pct={48} />
      <div style={{ fontSize: 12, color: '#888780', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><span>Tests 2 et 3/7</span><span>Étape 5/10</span></div>
      <TestCard num="2" title="Lever de chaise 30 s (CS-30)" domain="Force et endurance membres inférieurs">
        <ProtoBox steps={[
          'Assis·e sur une chaise droite sans appui-bras, bras croisés sur la poitrine.',
          'Levez-vous complètement et rasseyez-vous autant de fois que possible en 30 secondes.',
          'Comptez chaque lever complet — dos droit, genoux bien étendus en haut.'
        ]} />
        <NormBox>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>SEUIL — SOUS LA MOYENNE (Jones et al., 1999 ; ELCV Canada)</div>
          Sous la moyenne si moins de {n.cs30[a][s]} répétitions
        </NormBox>
        <div style={{ fontSize: 14, color: '#5F5E5A', marginBottom: 6 }}>Nombre de levers</div>
        <Input id="vCS30" placeholder="ex. 13" unit="répétitions" />
      </TestCard>
      <TestCard num="3" title="Lever de chaise × 5 (5xSTS)" domain="Puissance explosive">
        <ProtoBox steps={[
          'Assis·e sur une chaise droite, bras croisés sur la poitrine.',
          'Levez-vous et rasseyez-vous 5 fois le plus rapidement possible.',
          'Chronométrez de "partez" jusqu\'au moment où vous vous rasseyez pour la 5e fois.'
        ]} />
        <NormBox>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>SEUIL D'ALERTE (Bohannon 2006 ; SHARE 2025)</div>
          Lent si plus de {n.sts5[a]} secondes
        </NormBox>
        <div style={{ fontSize: 14, color: '#5F5E5A', marginBottom: 6 }}>Temps</div>
        <Input id="v5STS" placeholder="ex. 9.5" st={0.1} unit="secondes" />
      </TestCard>
      <BtnPrimary label="Test suivant" onClick={() => go('t4t5')} />
    </div>
  )

  if (step === 't4t5') return (
    <div style={wrap}>
      <ProgressBar pct={60} />
      <div style={{ fontSize: 12, color: '#888780', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><span>Tests 4 et 5/7</span><span>Étape 6/10</span></div>
      <TestCard num="4" title="Équilibre unipodal (SLS)" domain="Équilibre statique · proprioception">
        <ProtoBox steps={[
          'Debout près d\'un mur, levez un pied — bras le long du corps.',
          'Chronométrez combien de temps vous tenez, yeux ouverts d\'abord, puis yeux fermés.',
          'Cap à 60 secondes. Faites 2 essais, retenez le meilleur.'
        ]} />
        <div style={{ background: '#FAECE7', border: '1px solid #F5C4B3', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#712B13' }}>
          ⚠️ Seuil d'alerte : moins de 10 secondes yeux ouverts (Springer et al., 2007)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 4 }}>Yeux ouverts</div>
            <Input id="vSLSo" placeholder="ex. 35" unit="s" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 4 }}>Yeux fermés</div>
            <Input id="vSLSf" placeholder="ex. 4" unit="s" />
          </div>
        </div>
      </TestCard>
      <TestCard num="5" title="Équilibre 4 étapes (4-Stage Balance)" domain="Progression de l'équilibre statique">
        <ProtoBox steps={[
          'Tenez chaque position 10 secondes. Arrêtez à la première position non tenue.',
          'Étape 1 : pieds joints · Étape 2 : semi-tandem · Étape 3 : tandem complet · Étape 4 : unipodal'
        ]} />
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 10 }}>Dernière étape réussie (10 s complètes) :</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map(n => (
            <button key={n} onClick={() => setV('stage4', n)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              background: vals.stage4 === n ? '#E1F5EE' : '#fff',
              border: vals.stage4 === n ? '1.5px solid #1D9E75' : '1px solid #D3D1C7',
              color: vals.stage4 === n ? '#085041' : '#1a1a1a'
            }}>{n === 4 ? 'Étape 4 — toutes' : `Étape ${n}`}</button>
          ))}
        </div>
      </TestCard>
      <BtnPrimary label="Test suivant" onClick={() => go('t6t7')} />
    </div>
  )

  if (step === 't6t7') return (
    <div style={wrap}>
      <ProgressBar pct={72} />
      <div style={{ fontSize: 12, color: '#888780', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><span>Tests 6 et 7/7</span><span>Étape 7/10</span></div>
      <TestCard num="6" title="Marche en tandem" domain="Équilibre dynamique · coordination">
        <ProtoBox steps={[
          'Marchez talon contre orteil sur 3 mètres, faites demi-tour, revenez (total 6 mètres).',
          'Chronométrez le trajet complet aller-retour.',
          'Comptez les erreurs de pas : sortie de ligne, appui sur le mur, pas de côté.'
        ]} />
        <div style={{ fontSize: 14, color: '#5F5E5A', marginBottom: 6 }}>Temps aller-retour</div>
        <Input id="vTandem" placeholder="ex. 18" st={0.1} unit="secondes" />
        <div style={{ fontSize: 14, color: '#5F5E5A', marginBottom: 6 }}>Erreurs de pas</div>
        <Input id="vTandemErr" placeholder="0" unit="erreurs" />
      </TestCard>
      <TestCard num="7" title="Step Test 3 minutes (Kasch Pulse Recovery)" domain="Condition cardio-vasculaire · récupération FC">
        <TipBox text="Utilisez la première marche de votre escalier (~18–20 cm). Un step de gym ou une caisse solide de même hauteur fonctionnent aussi." />
        <ProtoBox steps={[
          'Montez et descendez la marche à un rythme de 24 cycles/minute — métronome réglé à 96 bpm (haut-haut-bas-bas).',
          'Maintenez ce rythme pendant 3 minutes complètes sans vous arrêter.',
          'Dès la fin des 3 minutes, asseyez-vous et comptez votre fréquence cardiaque pendant 1 minute complète (pouls au poignet ou appli).'
        ]} />
        <NormBox>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 8 }}>FC DE RÉCUPÉRATION — 1 MIN POST-EFFORT (Kasch, adultes {a} ans)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: '#E1F5EE', border: '1px solid #9FE1CB', borderRadius: 6, padding: '6px 10px', fontSize: 12, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#085041' }}>Excellente</div>
              <div style={{ color: '#0F6E56' }}>{'< '}{n.kasch[a][s].ex} bpm</div>
            </div>
            <div style={{ flex: 1, background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 6, padding: '6px 10px', fontSize: 12, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#633806' }}>Moyenne</div>
              <div style={{ color: '#854F0B' }}>{n.kasch[a][s].ex}–{n.kasch[a][s].moy} bpm</div>
            </div>
            <div style={{ flex: 1, background: '#FAECE7', border: '1px solid #F5C4B3', borderRadius: 6, padding: '6px 10px', fontSize: 12, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#4A1B0C' }}>À améliorer</div>
              <div style={{ color: '#993C1D' }}>{'> '}{n.kasch[a][s].moy} bpm</div>
            </div>
          </div>
        </NormBox>
        <div style={{ fontSize: 14, color: '#5F5E5A', marginBottom: 6 }}>FC de récupération</div>
        <Input id="vKasch" placeholder="ex. 88" unit="bpm" />
      </TestCard>
      <BtnPrimary label="Voir mes résultats" onClick={calcResults} />
    </div>
  )

  if (step === 'resultats' && scores) {
    const pct = scores.total > 0 ? Math.round((scores.score / scores.total) * 100) : 0
    const circleColor = pct >= 70 ? '#1D9E75' : pct >= 50 ? '#BA7517' : '#D85A30'
    const circleBg = pct >= 70 ? '#E1F5EE' : pct >= 50 ? '#FAEEDA' : '#FAECE7'
    return (
      <div style={wrap}>
        <ProgressBar pct={88} />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', border: `4px solid ${circleColor}`, background: circleBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: circleColor }}>{scores.score}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: circleColor }}>/ {scores.total} tests</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{pct >= 70 ? 'Bonne capacité fonctionnelle globale' : pct >= 50 ? 'Quelques domaines à renforcer' : 'Plusieurs domaines sous la norme'}</div>
          <div style={{ fontSize: 13, color: '#888780' }}>{scores.score} test{scores.score > 1 ? 's' : ''} dans la norme sur {scores.total} complété{scores.total > 1 ? 's' : ''}</div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Résultats par domaine</div>
          <DomainBar label="Endurance aérobie" pct={scores.end} />
          <DomainBar label="Récupération cardio" pct={scores.cardio} />
          <DomainBar label="Force membres inf." pct={scores.force} />
          <DomainBar label="Puissance explosive" pct={scores.puis} />
          <DomainBar label="Équilibre statique" pct={scores.eq} />
          <DomainBar label="Équilibre dynamique" pct={scores.dyn} />
        </div>
        <div style={{ marginBottom: 24 }}>
          {scores.recos.map((r, i) => (
            <div key={i} style={{ borderRadius: 10, padding: '12px 16px', marginBottom: 10, display: 'flex', gap: 12, background: r.color === 'green' ? '#E1F5EE' : '#FAEEDA', border: `1px solid ${r.color === 'green' ? '#9FE1CB' : '#FAC775'}` }}>
              <div style={{ fontSize: 20 }}>{r.color === 'green' ? '🏆' : '⚡'}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: '#5F5E5A', lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <BtnPrimary label="Recevoir mon rapport complet" onClick={() => go('lead')} />
        <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12 }}>⚠️ Ces résultats sont éducatifs. Kinoa Santé ne pose pas de diagnostic.</p>
      </div>
    )
  }

  if (step === 'lead') return (
    <div style={wrap}>
      <ProgressBar pct={95} />
      <div style={{ background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Recevez votre rapport personnalisé</h3>
        <p style={{ fontSize: 13, color: '#888780', marginBottom: 16 }}>Votre analyse complète par domaine + recommandations selon votre profil</p>
        {['Prénom et nom', 'Adresse courriel', 'Téléphone (optionnel)'].map(pl => (
          <input key={pl} type="text" placeholder={pl} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
        ))}
        <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 10 }}>Vous souhaitez :</div>
        {['Parler à un kinésiologue Kinoa', 'En savoir plus sur le programme 12 semaines', 'Recevoir les conseils Kinoa par courriel'].map(l => (
          <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5F5E5A', marginBottom: 8, cursor: 'pointer' }}>
            <input type="checkbox" /> {l}
          </label>
        ))}
      </div>
      <BtnPrimary label="Envoyer mon rapport" onClick={() => go('merci')} />
      <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Kinoa Santé ne pose pas de diagnostic. Pour toute décision de santé, consultez un professionnel qualifié.</p>
    </div>
  )

  if (step === 'merci') return (
    <div style={wrap}>
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Votre rapport est en route</h2>
        <p style={{ fontSize: 14, color: '#888780', lineHeight: 1.6, marginBottom: 24 }}>Vérifiez votre boîte de réception — votre analyse complète arrive dans les prochaines minutes.</p>
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '1.25rem', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#085041', marginBottom: 10 }}>Prochaines étapes recommandées</div>
          <div style={{ fontSize: 13, color: '#0F6E56', lineHeight: 2 }}>
            1. Lisez votre rapport et identifiez votre domaine le plus faible<br />
            2. Planifiez une consultation gratuite avec un kinésiologue Kinoa<br />
            3. Refaites les tests dans 12 semaines pour mesurer vos progrès
          </div>
        </div>
        <BtnPrimary label="Explorer les services Kinoa" onClick={() => window.open('https://kinoa.ca', '_blank')} />
      </div>
    </div>
  )

  return null
}