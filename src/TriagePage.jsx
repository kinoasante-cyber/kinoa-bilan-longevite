import { wrap } from './constants'

export default function TriagePage({ onSelect }) {
  return (
    <div style={wrap}>
      <div style={{ textAlign: 'center', paddingTop: '2rem', marginBottom: 32 }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #D85A30', color: '#993C1D', background: '#FAECE7', marginBottom: 20, letterSpacing: '.04em' }}>
          KINOA SANTÉ
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, marginBottom: 12, color: '#1a1a1a' }}>
          Bilan fonctionnel <em style={{ color: '#D85A30', fontStyle: 'normal' }}>longévité</em>
        </h1>
        <p style={{ fontSize: 15, color: '#5F5E5A', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 28px' }}>
          5 tests validés scientifiquement pour évaluer votre équilibre, votre force et votre endurance.
        </p>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.05em', color: '#888780', textAlign: 'center', marginBottom: 16 }}>
        CHOISISSEZ VOTRE MODE
      </div>

      <button
        onClick={() => onSelect('autonome')}
        style={{ display: 'block', width: '100%', marginBottom: 12, padding: '1.25rem', background: '#fff', border: '1.5px solid #D3D1C7', borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'border-color .15s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#D3D1C7'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#E8F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            🏠
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>Mode autonome</div>
            <div style={{ fontSize: 13, color: '#5F5E5A', lineHeight: 1.5 }}>Réalisez le bilan seul·e. Obtenez votre radar de condition physique et un plan personnalisé.</div>
          </div>
        </div>
      </button>

      <button
        onClick={() => onSelect('clinique')}
        style={{ display: 'block', width: '100%', marginBottom: 28, padding: '1.25rem', background: '#fff', border: '1.5px solid #D3D1C7', borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'border-color .15s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#D3D1C7'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FAECE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            🩺
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>Mode clinique</div>
            <div style={{ fontSize: 13, color: '#5F5E5A', lineHeight: 1.5 }}>Accompagné·e par un professionnel Kinoa. Rapport IA détaillé et suivi personnalisé.</div>
          </div>
        </div>
      </button>

      <div style={{ background: '#1a2e28', borderRadius: 12, padding: '1.25rem', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#9FE1CB', marginBottom: 12 }}>Batterie de 5 tests — identique dans les 2 modes</div>
        {[
          ['1', 'TUG — Timed Up and Go',           'Mobilité fonctionnelle · transferts'],
          ['2', 'SLS — Équilibre unipodal',          'Équilibre statique · proprioception'],
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

      <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', lineHeight: 1.6 }}>
        Durée estimée : 15–20 minutes · Résultats immédiats<br />
        Ces résultats sont éducatifs. Kinoa Santé ne pose pas de diagnostic médical.
      </p>
    </div>
  )
}
