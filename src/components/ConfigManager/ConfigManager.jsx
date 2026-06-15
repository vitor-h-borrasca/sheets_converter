import { useState, useEffect } from 'react'
import { driveService } from '../../services/driveService.js'
import CanalForm from './CanalForm.jsx'
import AnySchemaEditor from './AnySchemaEditor.jsx'
import TemplateUpload from './TemplateUpload.jsx'
import MappingEditor from './MappingEditor.jsx'
import './ConfigManager.css'

export default function ConfigManager() {
  const [canais, setCanais]         = useState([])
  const [canalSel, setCanalSel]     = useState(null)
  const [secao, setSecao]           = useState('canal') // canal | anyschema | template | mapping
  const [loading, setLoading]       = useState(true)
  const [erro, setErro]             = useState(null)

  useEffect(() => {
    carregarCanais()
  }, [])

  async function carregarCanais() {
    try {
      setLoading(true)
      const data = await driveService.getCanais()
      setCanais(data)
    } catch {
      setErro('Não foi possível conectar à configuração. Verifique a URL do Apps Script.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCanalCriado() {
    await carregarCanais()
  }

  async function handleDeletarCanal(canal_id) {
    if (!confirm(`Deletar canal "${canal_id}" e todos os dados associados?`)) return
    await driveService.deleteCanal(canal_id)
    setCanalSel(null)
    await carregarCanais()
  }

  if (erro) return <p className="error-msg">{erro}</p>
  if (loading) return <p className="loading-msg">Carregando...</p>

  return (
    <div className="config-manager">
      <aside className="config-sidebar">
        <nav className="config-nav">
          <button className={secao === 'canal' ? 'active' : ''} onClick={() => setSecao('canal')}>
            + Novo Canal
          </button>
          <button className={secao === 'anyschema' ? 'active' : ''} onClick={() => setSecao('anyschema')}>
            Schema ANYMARKET
          </button>
        </nav>

        {canais.length > 0 && (
          <>
            <p className="sidebar-label">Canais</p>
            <ul className="canal-list">
              {canais.map(c => (
                <li
                  key={c.canal_id}
                  className={canalSel?.canal_id === c.canal_id ? 'active' : ''}
                  onClick={() => { setCanalSel(c); setSecao('template') }}
                >
                  {c.nome}
                  <button
                    className="btn-delete-canal"
                    onClick={e => { e.stopPropagation(); handleDeletarCanal(c.canal_id) }}
                    title="Deletar canal"
                  >✕</button>
                </li>
              ))}
            </ul>

            {canalSel && (
              <nav className="canal-nav">
                <button className={secao === 'template' ? 'active' : ''} onClick={() => setSecao('template')}>
                  Template
                </button>
                <button className={secao === 'mapping' ? 'active' : ''} onClick={() => setSecao('mapping')}>
                  Mapeamento
                </button>
              </nav>
            )}
          </>
        )}
      </aside>

      <section className="config-body">
        {secao === 'canal'     && <CanalForm onCriado={handleCanalCriado} />}
        {secao === 'anyschema' && <AnySchemaEditor />}
        {secao === 'template'  && canalSel && <TemplateUpload canal={canalSel} />}
        {secao === 'mapping'   && canalSel && <MappingEditor canal={canalSel} />}
      </section>
    </div>
  )
}
