import { NORMS } from './constants'

export function fmtTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ds = Math.floor((s * 10) % 10)
  if (m > 0) return `${m}:${sec.toString().padStart(2, '0')}.${ds}`
  return `${sec}.${ds}s`
}

export function scoreColor(s) {
  return s >= 70 ? '#1D9E75' : s >= 50 ? '#BA7517' : '#D85A30'
}

function normRef(table, age, sex) {
  return (table[age] || table['60-64'])[sex]
}

// lower-is-better scoring (TUG, 5×STS)
function scoreLow(val, ref) {
  if (!val) return 0
  if (val <= ref.good) return 100
  if (val <= ref.ok) return Math.round(50 + 50 * (ref.ok - val) / (ref.ok - ref.good))
  return Math.max(0, Math.round(50 * (1 - (val - ref.ok) / ref.ok)))
}

// higher-is-better scoring (SLS, 6MWT)
function scoreHigh(val, ref) {
  if (!val) return 0
  if (val >= ref.good) return 100
  if (val >= ref.ok) return Math.round(50 + 50 * (val - ref.ok) / (ref.good - ref.ok))
  return Math.max(0, Math.round(50 * val / ref.ok))
}

export function calcScores(profile, vals) {
  const { age: a, sex: sx } = profile
  const tugT    = parseFloat(vals.tugT)    || 0
  const slsDroit  = parseFloat(vals.slsDroit)  || 0
  const slsGauche = parseFloat(vals.slsGauche) || 0
  const slsO = slsDroit > 0 && slsGauche > 0
    ? Math.min(slsDroit, slsGauche)
    : (slsDroit || slsGauche)
  const sts5T = parseFloat(vals.sts5T)  || 0
  const tanT  = parseFloat(vals.tandemT)|| 0
  const tanE  = parseInt(vals.tandemE)  || 0
  const mwt6D = parseFloat(vals.mwt6D)  || 0

  const tugScore  = scoreLow(tugT,  normRef(NORMS.tug,  a, sx))
  const slsScore  = scoreHigh(slsO, normRef(NORMS.sls,  a, sx))
  const sts5Score = scoreLow(sts5T, normRef(NORMS.sts5, a, sx))
  const mwt6Score = scoreHigh(mwt6D,normRef(NORMS.mwt6, a, sx))

  let tanScore = 0
  if (tanT > 0) {
    tanScore = tanT <= NORMS.tandem.goodTime && tanE <= NORMS.tandem.maxErrors
      ? 100
      : Math.min(100, Math.max(0, Math.round((NORMS.tandem.goodTime / tanT) * 100 - tanE * 12)))
  }

  const recos = []
  const slsRef = normRef(NORMS.sls, a, sx)
  const tugRef = normRef(NORMS.tug, a, sx)

  if (slsO > 0 && slsO < slsRef.ok * 0.4)
    recos.push({ level: 'alert', title: 'Équilibre statique — seuil d\'alerte', desc: 'Résultat SLS très faible : risque de chute élevé. Consultation kinésiologue recommandée. Exercices d\'équilibre quotidiens.' })
  else if (slsScore < 65 && slsO > 0)
    recos.push({ level: 'warn', title: 'Équilibre statique — à améliorer', desc: 'Entraînement proprioceptif unilatéral 3×/semaine : équilibre sur coussin, yoga, tai-chi.' })

  if (tugT > 0 && tugT > tugRef.ok * 1.3)
    recos.push({ level: 'alert', title: 'Mobilité fonctionnelle — attention', desc: 'TUG élevé : risque de chute accru. Un kinésiologue peut vous proposer un programme de transferts et de renforcement adapté.' })
  else if (tugScore < 65 && tugT > 0)
    recos.push({ level: 'warn', title: 'Mobilité fonctionnelle — à améliorer', desc: 'Exercices de transfert assis-debout, renforcement des membres inférieurs, marche active quotidienne.' })

  if (tanScore < 65 && tanT > 0)
    recos.push({ level: 'warn', title: 'Équilibre dynamique — à travailler', desc: 'Marche en tandem, changements de direction, surfaces instables pour améliorer la coordination.' })

  if (sts5Score < 65 && sts5T > 0)
    recos.push({ level: 'warn', title: 'Puissance explosive — à développer', desc: 'Squats avec composante de vitesse, montées de marches rapides, vélo en intervalles.' })

  if (mwt6Score < 65 && mwt6D > 0)
    recos.push({ level: 'warn', title: 'Endurance aérobie — à améliorer', desc: 'Marche active 3×/semaine, progression 10 % par semaine. Objectif : 150 min/semaine d\'activité modérée.' })

  if (recos.length === 0)
    recos.push({ level: 'ok', title: 'Excellente condition fonctionnelle', desc: 'Tous les domaines dans la norme. Maintenez votre programme et refaites ce bilan dans 3 mois.' })

  return { tugScore, slsScore, sts5Score, tanScore, mwt6Score, recos }
}

export async function generateReport(profile, scores, vals) {
  const token = import.meta.env.VITE_API_TOKEN
  if (!token) return null

  const tugRef  = normRef(NORMS.tug,  profile.age, profile.sex)
  const slsRef  = normRef(NORMS.sls,  profile.age, profile.sex)
  const sts5Ref = normRef(NORMS.sts5, profile.age, profile.sex)
  const mwt6Ref = normRef(NORMS.mwt6, profile.age, profile.sex)
  const sexLabel = profile.sex === 'H' ? 'masculin' : 'féminin'

  const prompt = `Tu es kinésiologue expert en longévité fonctionnelle. Génère un rapport personnalisé en français (250-300 mots) pour ${profile.prenom || 'ce patient'}, ${profile.age} ans, sexe biologique ${sexLabel}.

Résultats du Bilan Fonctionnel Longévité Kinoa :
1. TUG (mobilité fonctionnelle) — ${vals.tugT || '—'} s (référence ≤ ${tugRef.good} s) | Score : ${scores.tugScore}/100
2. SLS (équilibre statique, yeux ouverts) — Droite : ${vals.slsDroit || '—'} s · Gauche : ${vals.slsGauche || '—'} s (référence ≥ ${slsRef.good} s · côté limitant utilisé pour le score) | Score : ${scores.slsScore}/100
3. 5×STS (puissance explosive) — ${vals.sts5T || '—'} s (référence ≤ ${sts5Ref.good} s) | Score : ${scores.sts5Score}/100
4. Tandem Walk (équilibre dynamique) — ${vals.tandemT || '—'} s, ${vals.tandemE || 0} erreur(s) | Score : ${scores.tanScore}/100
5. 6MWT (endurance aérobie) — ${vals.mwt6D || '—'} m (référence ≥ ${mwt6Ref.good} m) | Score : ${scores.mwt6Score}/100

Rédige :
- Une introduction personnalisée avec le prénom
- Une analyse de 2-3 points forts et 1-2 axes prioritaires
- 2-3 recommandations concrètes et motivantes
- Une conclusion encourageante invitant à consulter un kinésiologue Kinoa
Ton chaleureux, professionnel, sans diagnostic médical.`

  try {
    const resp = await fetch('https://kinoa-api-bridge.kinoa-sante.workers.dev/rapport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Token': token },
      body: JSON.stringify({ prompt })
    })
    const data = await resp.json()
    return data?.text || data?.content?.[0]?.text || null
  } catch {
    return null
  }
}

export async function submitLead(profile, vals, scores, extra, ressenti = {}) {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL
  if (!url) return
  const r = ressenti
  const payload = {
    source:              import.meta.env.VITE_BILAN_SOURCE || 'bilan_longevite',
    mode:                extra.mode || 'clinique',
    prenom:              profile.prenom,
    email:               profile.email,
    age:                 profile.age,
    sexe:                profile.sex,
    tel:                 extra.tel || '',
    consult:             extra.consult || false,
    programme:           extra.programme || false,
    newsletter:          extra.newsletter || false,
    tug_temps:           vals.tugT,
    sls_droit:           vals.slsDroit,
    sls_gauche:          vals.slsGauche,
    sts5_temps:          vals.sts5T,
    tandem_temps:        vals.tandemT,
    tandem_erreurs:      vals.tandemE,
    mwt6_metres:         vals.mwt6D,
    score_tug:           scores?.tugScore,
    score_sls:           scores?.slsScore,
    score_sts5:          scores?.sts5Score,
    score_tandem:        scores?.tanScore,
    score_mwt6:          scores?.mwt6Score,
    rpe_tug:             r.tug?.rpe || '',
    commentaire_tug:     r.tug?.commentaire || '',
    rpe_sls:             r.sls?.rpe || '',
    commentaire_sls:     r.sls?.commentaire || '',
    rpe_5sts:            r.sts5?.rpe || '',
    commentaire_5sts:    r.sts5?.commentaire || '',
    rpe_tandem:          r.tandem?.rpe || '',
    commentaire_tandem:  r.tandem?.commentaire || '',
    rpe_6mwt:            r.mwt6?.rpe || '',
    commentaire_6mwt:    r.mwt6?.commentaire || '',
    timestamp:           new Date().toISOString(),
  }
  await Promise.allSettled([
    fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
    fetch('https://www.kinoa.ca/_api/bilan/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prenom: payload.prenom, email: payload.email }) }),
  ])
}
