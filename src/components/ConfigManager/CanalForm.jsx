import { useState } from 'react'
import { driveService } from '../../services/driveService.js'
import './Form.css'

function toSlug(str) {
  return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export default function CanalForm({ onCriado }) {
  const [nome, setNome]             = useState('')
  const [formato, setFormato]       = useState('xlsx')
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState(null)
  const [sucesso, setSucesso]       = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome.trim()) return

    setSalvando(true)
    setErro(null)
    setSucesso(false)

    try {
      await driveService.createCanal({
        canal_id:      toSlug(nome),
        nome:          nome.trim(),
        formato_saida: formato,
      })
      setSucesso(true)
      setNome('')
      onCriado()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <h2 className="form-title">Novo Canal</h2>
      <form onSubmit={handleSubmit} className="form">
        <label className="form-label">
          Nome do canal
          <input
            className="form-input"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="ex: Shopee BR"
            required
          />
          {nome && <span className="form-hint">ID: {toSlug(nome)}</span>}
        </label>

        <label className="form-label">
          Formato de saída
          <select className="form-input" value={formato} onChange={e => setFormato(e.target.value)}>
            <option value="xlsx">XLSX</option>
            <option value="csv">CSV</option>
          </select>
        </label>

        {erro    && <p className="form-error">{erro}</p>}
        {sucesso && <p className="form-success">Canal criado com sucesso!</p>}

        <button className="btn-primary" type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Criar Canal'}
        </button>
      </form>
    </div>
  )
}
