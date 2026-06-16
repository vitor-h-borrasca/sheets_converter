import { useState, useEffect } from 'react'
import { driveService } from '../../services/driveService.js'
import './Form.css'
import './MappingEditor.css'

export default function MappingEditor({ canal }) {
  const [anySchema, setAnySchema]   = useState([])
  const [template, setTemplate]     = useState([])
  const [pares, setPares]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState(null)
  const [sucesso, setSucesso]       = useState(false)
  const [selAny, setSelAny]         = useState(null)
  const [selCanal, setSelCanal]     = useState(null)
  const [buscaAny, setBuscaAny]     = useState('')
  const [buscaCanal, setBuscaCanal] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      driveService.getAnySchema(),
      driveService.getTemplate(canal.canal_id),
      driveService.getMapeamentos(canal.canal_id),
    ]).then(([any, tmpl, mapeamentos]) => {
      setAnySchema(any)
      setTemplate(tmpl)
      setPares(mapeamentos)
    }).catch(() => setErro('Erro ao carregar dados do canal.'))
      .finally(() => setLoading(false))
  }, [canal.canal_id])

  function conectar() {
    if (!selAny || !selCanal) return
    const jaExiste = pares.some(p => p.posicao_any === selAny && p.posicao_canal === selCanal)
    if (!jaExiste) {
      setPares(prev => [...prev, { posicao_any: selAny, posicao_canal: selCanal, ativo: true }])
    }
    setSelAny(null)
    setSelCanal(null)
  }

  function desconectar() {
    if (!selAny || !selCanal) return
    setPares(prev => prev.filter(p => !(p.posicao_any === selAny && p.posicao_canal === selCanal)))
    setSelAny(null)
    setSelCanal(null)
  }

  function removerPar(i) {
    setPares(prev => prev.filter((_, idx) => idx !== i))
  }

  function toggleAtivo(i) {
    setPares(prev => prev.map((p, idx) => idx === i ? { ...p, ativo: !p.ativo } : p))
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    setSucesso(false)
    try {
      await driveService.saveMapeamento(canal.canal_id, pares)
      setSucesso(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  function nomeAny(pos)   { return anySchema.find(c => c.posicao === pos)?.nome_coluna ?? pos }
  function nomeCanal(pos) { return template.find(c => c.posicao === pos)?.nome_coluna ?? pos }

  if (loading) return <p className="loading-msg">Carregando...</p>

  return (
    <div>
      <h2 className="form-title">Mapeamento — {canal.nome}</h2>

      <div className="mapping-panels">
        <div className="mapping-col">
          <p className="mapping-col-title">ANYMARKET</p>
          <input
            className="mapping-search"
            placeholder="Pesquisar..."
            value={buscaAny}
            onChange={e => setBuscaAny(e.target.value)}
          />
          <div className="mapping-scroll">
            {anySchema.length === 0 && <p className="form-hint">Schema do ANY não configurado.</p>}
            {anySchema
              .filter(c => c.nome_coluna.toLowerCase().includes(buscaAny.toLowerCase()) || c.posicao.toLowerCase().includes(buscaAny.toLowerCase()))
              .map(c => {
                const mapeado = pares.some(p => p.posicao_any === c.posicao && p.ativo)
                return (
                  <button
                    key={c.posicao}
                    className={`mapping-item ${selAny === c.posicao ? 'selected' : ''} ${mapeado ? 'mapped' : ''}`}
                    onClick={() => setSelAny(selAny === c.posicao ? null : c.posicao)}
                  >
                    <span className="col-pos">{c.posicao}</span> {c.nome_coluna}
                  </button>
                )
              })}
          </div>
        </div>

        <div className="mapping-actions-center">
          <button className="btn-connect" onClick={conectar} disabled={!selAny || !selCanal}>
            Conectar →
          </button>
          <button className="btn-disconnect" onClick={desconectar} disabled={!selAny || !selCanal || !pares.some(p => p.posicao_any === selAny && p.posicao_canal === selCanal)}>
            Desconectar ✕
          </button>
        </div>

        <div className="mapping-col">
          <p className="mapping-col-title">{canal.nome}</p>
          <input
            className="mapping-search"
            placeholder="Pesquisar..."
            value={buscaCanal}
            onChange={e => setBuscaCanal(e.target.value)}
          />
          <div className="mapping-scroll">
            {template.length === 0 && <p className="form-hint">Template não configurado.</p>}
            {template
              .filter(c => c.nome_coluna.toLowerCase().includes(buscaCanal.toLowerCase()) || c.posicao.toLowerCase().includes(buscaCanal.toLowerCase()))
              .map(c => {
                const par = pares.find(p => p.posicao_canal === c.posicao && p.ativo)
                return (
                  <button
                    key={c.posicao}
                    className={`mapping-item ${selCanal === c.posicao ? 'selected' : ''} ${par ? 'mapped' : ''}`}
                    onClick={() => setSelCanal(selCanal === c.posicao ? null : c.posicao)}
                  >
                    <span className="col-pos">{c.posicao}</span> {c.nome_coluna}
                    {par && <span className="mapping-badge">{par.posicao_any}</span>}
                  </button>
                )
              })}
          </div>
        </div>
      </div>

      {pares.length > 0 && (
        <table className="schema-table" style={{ marginTop: '1.5rem' }}>
          <thead>
            <tr>
              <th>ANY</th>
              <th>Canal</th>
              <th>Ativo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pares.map((p, i) => (
              <tr key={i} className={!p.ativo ? 'row-inativo' : ''}>
                <td>{p.posicao_any} — {nomeAny(p.posicao_any)}</td>
                <td>{p.posicao_canal} — {nomeCanal(p.posicao_canal)}</td>
                <td>
                  <input type="checkbox" checked={p.ativo} onChange={() => toggleAtivo(i)} />
                </td>
                <td>
                  <button className="btn-remove" onClick={() => removerPar(i)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="form-actions">
        <button className="btn-primary" onClick={salvar} disabled={salvando || pares.length === 0}>
          {salvando ? 'Salvando...' : 'Salvar Mapeamento'}
        </button>
      </div>

      {erro    && <p className="form-error">{erro}</p>}
      {sucesso && <p className="form-success">Mapeamento salvo com sucesso!</p>}
    </div>
  )
}
