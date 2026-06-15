import { useState } from 'react'
import ConfigManager from './components/ConfigManager/ConfigManager.jsx'
import Processor from './components/Processor/Processor.jsx'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('processor')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sheet Converter</h1>
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
        {tab === 'processor' ? <Processor /> : <ConfigManager />}
      </main>
    </div>
  )
}
