import { useState } from 'react'
import TriagePage from './TriagePage'
import Bilan from './Bilan'

export default function App() {
  const params  = new URLSearchParams(window.location.search)
  const urlMode = params.get('mode')
  const [mode, setMode] = useState(urlMode)

  const handleModeSelect = (m) => {
    history.pushState({}, '', `?mode=${m}`)
    setMode(m)
  }

  if (!mode) return <TriagePage onSelect={handleModeSelect} />
  if (mode === 'autonome' || mode === 'clinique') return <Bilan mode={mode} />

  return <TriagePage onSelect={handleModeSelect} />
}
