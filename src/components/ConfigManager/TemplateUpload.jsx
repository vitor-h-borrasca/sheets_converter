import { useState } from 'react'
import { sheetParser } from '../../services/sheetParser.js'
import { driveService } from '../../services/driveService.js'
import './Form.css'

export default function TemplateUpload({ canal }) {
  const [file, setFile]           = useState(null)
  const [abas, setAbas]           = useState([])
  const [abaSel, setAbaSel]       = useState('')
  const [totalLinhas, setTotalLinhas] = useState(0)
  const [headerRow, setHeaderRow] = useState(1)
  const [colunas, setColunas]     = useState([])
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState(null)
  const [sucesso, setSucesso]     = useState(false)

  async function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setErro(null)
    setSucesso(false)
    setColunas([])
    setAbas([])
    setAbaSel('')
    setHeaderRow(1)
    setTotalLinhas(0)
    setFile(f)

    try {
      const nomes = await sheetParser.getSheetNames(f)
      setAbas(nomes)
      setAbaSel(nomes[0])
      const total = await sheetParser.getSheetRowCount(f, nomes[0])
      setTotalLinhas(total)
    } catch (err) {
      setErro(err.message)
    }
  }

  async function handleAbaChange(aba) {
    setAbaSel(aba)
    setColunas([])
    setHeaderRow(1)
    setErro(null)
    try {
      const total = await sheetParser.getSheetRowCount(file, aba)
      setTotalLinhas(total)
    } catch (err) {
      setErro(err.message)
    }
  }

  async function carregarColunas() {
    setErro(null)
    setColunas([])
    try {
      const headers = await sheetParser.extractHeaders(file, { sheetName: abaSel, headerRow })
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
        Faça upload do arquivo de template do canal. Depois selecione a aba e a linha do cabeçalho.
      </p>

      <label className="file-upload-label">
        <input type="file" accept=".xlsx,.csv" onChange={handleFile} />
        Escolher arquivo
      </label>

      {abas.length > 0 && (
        <div className="template-options">
          <label className="form-label">
            Aba com os dados
            <select
              className="form-select"
              value={abaSel}
              onChange={e => handleAbaChange(e.target.value)}
            >
              {abas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>

          <label className="form-label">
            Linha do cabeçalho
            <div className="header-row-input">
              <input
                type="number"
                className="form-input"
                min={1}
                max={totalLinhas || 100}
                value={headerRow}
                onChange={e => { setColunas([]); setHeaderRow(Math.max(1, Number(e.target.value))) }}
              />
              {totalLinhas > 0 && (
                <span className="form-hint">{totalLinhas} linha(s) nessa aba</span>
              )}
            </div>
          </label>

          <button className="btn-primary" style={{ alignSelf: 'flex-end' }} onClick={carregarColunas}>
            Carregar colunas
          </button>
        </div>
      )}

      {colunas.length > 0 && (
        <>
          <p className="form-hint" style={{ margin: '0.75rem 0 0.5rem' }}>
            {colunas.length} coluna(s) detectada(s) na linha {headerRow} da aba <strong>{abaSel}</strong>
          </p>
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
