import { useState, useEffect } from 'react'
import { driveService } from '../../services/driveService.js'
import './Form.css'

function indexToLetter(i) {
  let letter = ''
  let n = i
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}

export default function AnySchemaEditor() {
  const [colunas, setColunas]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState(null)
  const [sucesso, setSucesso]   = useState(false)

  useEffect(() => {
    driveService.getAnySchema()
      .then(data => setColunas(data.length ? data : []))
      .catch(() => setErro('Erro ao carregar schema.'))
      .finally(() => setLoading(false))
  }, [])

  function handleNome(i, valor) {
    setColunas(prev => prev.map((c, idx) => idx === i ? { ...c, nome_coluna: valor } : c))
  }

  function handleObrigatorio(i) {
    setColunas(prev => prev.map((c, idx) => idx === i ? { ...c, obrigatorio: !c.obrigatorio } : c))
  }

  function addColuna() {
    const pos = indexToLetter(colunas.length)
    setColunas(prev => [...prev, { posicao: pos, nome_coluna: '', obrigatorio: false }])
  }

  function removeColuna(i) {
    const novas = colunas.filter((_, idx) => idx !== i)
      .map((c, idx) => ({ ...c, posicao: indexToLetter(idx) }))
    setColunas(novas)
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    setSucesso(false)
    try {
      await driveService.saveAnySchema(colunas)
      setSucesso(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <p className="loading-msg">Carregando...</p>

  return (
    <div>
      <h2 className="form-title">Schema do ANYMARKET</h2>
      <p className="form-hint" style={{ marginBottom: '1rem' }}>
        Define as colunas da planilha do ANYMARKET. A posição é calculada automaticamente pela ordem.
      </p>

      <table className="schema-table">
        <thead>
          <tr>
            <th>Posição</th>
            <th>Nome da Coluna</th>
            <th>Obrigatória</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {colunas.map((c, i) => (
            <tr key={i}>
              <td><span className="col-pos">{c.posicao}</span></td>
              <td>
                <input
                  className="form-input"
                  value={c.nome_coluna}
                  onChange={e => handleNome(i, e.target.value)}
                  placeholder="Nome da coluna"
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={c.obrigatorio}
                  onChange={() => handleObrigatorio(i)}
                />
              </td>
              <td>
                <button className="btn-remove" onClick={() => removeColuna(i)}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="form-actions">
        <button className="btn-secondary" onClick={addColuna}>+ Adicionar Coluna</button>
        <button className="btn-primary" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar Schema'}
        </button>
      </div>

      {erro    && <p className="form-error">{erro}</p>}
      {sucesso && <p className="form-success">Schema salvo com sucesso!</p>}
    </div>
  )
}
