import { useState } from 'react'
import ConfigManager from './components/ConfigManager/ConfigManager.jsx'
import Processor from './components/Processor/Processor.jsx'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('processor')

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="brand-any">ANY</span><span className="brand-market">MARKET</span>
          <span className="brand-sub">Sheet Converter</span>
        </div>
        <nav className="app-tabs">
          <button
            className={tab === 'processor' ? 'active' : ''}
            onClick={() => setTab('processor')}
          >
            Processor
          </button>
          <button
            className={tab === 'config' ? 'active' : ''}
            onClick={() => setTab('config')}
          >
            Config Manager
          </button>
        </nav>
      </header>

      <main className="app-content">
        {tab === 'processor'
          ? <Processor />
          : <ConfigManager onTabChange={setTab} />}
      </main>
    </div>
  )
}
