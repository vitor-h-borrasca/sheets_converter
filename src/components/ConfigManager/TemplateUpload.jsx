import { useState } from 'react'
import { sheetParser } from '../../services/sheetParser.js'
import { driveService } from '../../services/driveService.js'
import './Form.css'

export default function TemplateUpload({ canal }) {
  const [colunas, setColunas]   = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState(null)
  const [sucesso, setSucesso]   = useState(false)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setErro(null)
    setSucesso(false)
    try {
      const headers = await sheetParser.extractHeaders(file)
      setColunas(headers.map(h => ({ ...h, nome_coluna: h.nome, obrigatorio: false })))
    } catch (err) {
      setErro(err.message)
    }
  }

  function toggleObrigatorio(i) {
    setColunas(prev => prev.map((c, idx) => idx === i ? { ...c, obrigatorio: !c.obrigatorio } : c))
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    setSucesso(false)
    try {
      await driveService.saveTemplate(canal.canal_id, colunas)
      setSucesso(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <h2 className="form-title">Template — {canal.nome}</h2>
      <p className="form-hint" style={{ marginBottom: '1rem' }}>
        Faça upload de um arquivo <strong>.xlsx</strong> ou <strong>.csv</strong> contendo apenas o cabeçalho do canal.
      </p>

      <label className="file-upload-label">
        <input type="file" accept=".xlsx,.csv" onChange={handleFile} />
        Escolher arquivo
      </label>

      {colunas.length > 0 && (
        <>
          <table className="schema-table">
            <thead>
              <tr>
                <th>Posição</th>
                <th>Nome da Coluna</th>
                <th>Obrigatória</th>
              </tr>
            </thead>
            <tbody>
              {colunas.map((c, i) => (
                <tr key={i}>
                  <td><span className="col-pos">{c.posicao}</span></td>
                  <td>{c.nome_coluna}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={c.obrigatorio}
                      onChange={() => toggleObrigatorio(i)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="form-actions">
            <button className="btn-primary" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Template'}
            </button>
          </div>
        </>
      )}

      {erro    && <p className="form-error">{erro}</p>}
      {sucesso && <p className="form-success">Template salvo com sucesso!</p>}
    </div>
  )
}
