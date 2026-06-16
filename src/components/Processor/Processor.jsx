import { useState, useEffect } from 'react'
import { driveService } from '../../services/driveService.js'
import { sheetParser } from '../../services/sheetParser.js'
import { convert } from '../../services/processor.js'
import HelpPanel from '../HelpPanel/HelpPanel.jsx'
import * as XLSX from 'xlsx'
import './Processor.css'

export default function Processor() {
  const [canais, setCanais]         = useState([])
  const [canalId, setCanalId]       = useState('')
  const [direcao, setDirecao]       = useState('any_to_canal')
  const [batchSize, setBatchSize]   = useState(500)
  const [arquivo, setArquivo]       = useState(null)
  const [parsed, setParsed]         = useState(null)   // { headers, rows }
  const [mapeamentos, setMapeamentos] = useState([])
  const [anySchema, setAnySchema]   = useState([])
  const [template, setTemplate]     = useState([])
  const [preview, setPreview]       = useState(null)
  const [relatorio, setRelatorio]   = useState(null)
  const [erro, setErro]             = useState(null)
  const [loadingCanais, setLoadingCanais] = useState(true)

  useEffect(() => {
    driveService.getCanais()
      .then(setCanais)
      .catch(() => setErro('Não foi possível conectar à configuração. Verifique a URL do Apps Script.'))
      .finally(() => setLoadingCanais(false))
  }, [])

  async function handleCanalChange(id) {
    setCanalId(id)
    setMapeamentos([])
    setAnySchema([])
    setTemplate([])
    setParsed(null)
    setPreview(null)
    setRelatorio(null)
    setErro(null)

    if (!id) return

    try {
      const [maps, any, tmpl] = await Promise.all([
        driveService.getMapeamentos(id),
        driveService.getAnySchema(),
        driveService.getTemplate(id),
      ])
      if (!maps.length) {
        setErro('Este canal não possui mapeamento configurado.')
        return
      }
      const ativos = maps.filter(p => p.ativo)
      if (!ativos.length) {
        setErro('Nenhum par de colunas ativo para este canal.')
        return
      }
      setMapeamentos(maps)
      setAnySchema(any)
      setTemplate(tmpl)
    } catch {
      setErro('Erro ao carregar dados do canal.')
    }
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setArquivo(file)
    setParsed(null)
    setPreview(null)
    setRelatorio(null)
    setErro(null)

    try {
      const data = await sheetParser.parseFile(file)
      if (!data.rows.length) {
        setErro('A planilha não contém linhas de dados após o cabeçalho.')
        return
      }
      setParsed(data)
    } catch (err) {
      setErro(err.message)
    }
  }

  function gerarPreview() {
    if (!parsed || !mapeamentos.length) return
    try {
      const { rows } = convert({
        sourceRows: parsed.rows.slice(0, 5),
        mapeamentos,
        direcao,
        batchSize: 5,
      })
      const cabecalho = buildCabecalho()
      setPreview({ cabecalho, rows })
    } catch (err) {
      setErro(err.message)
    }
  }

  function buildCabecalho() {
    const origem = direcao === 'any_to_canal' ? template : anySchema
    return origem.map(c => c.nome_coluna)
  }

  function processar() {
    if (!parsed || !mapeamentos.length) return
    setRelatorio(null)

    try {
      const { rows, skipped, erros } = convert({
        sourceRows: parsed.rows,
        mapeamentos,
        direcao,
        batchSize,
      })

      const canal = canais.find(c => c.canal_id === canalId)
      const formato = canal?.formato_saida ?? 'xlsx'
      const cabecalho = buildCabecalho()
      const dados = [cabecalho, ...rows]
      const ws = XLSX.utils.aoa_to_sheet(dados)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

      const nomeArquivo = `${canalId}_convertido.${formato}`
      if (formato === 'csv') {
        XLSX.writeFile(wb, nomeArquivo, { bookType: 'csv' })
      } else {
        XLSX.writeFile(wb, nomeArquivo)
      }

      setRelatorio({ convertidas: rows.length, skipped, erros })
    } catch (err) {
      setErro(err.message)
    }
  }

  if (loadingCanais) return <p className="proc-msg">Carregando canais...</p>

  return (
    <div className="processor-layout">
    <div className="processor">
      <h2 className="proc-title">Processor</h2>

      {erro && <p className="proc-error">{erro}</p>}

      <div className="proc-form">
        <label className="proc-label">
          Canal
          <select className="proc-select" value={canalId} onChange={e => handleCanalChange(e.target.value)}>
            <option value="">Selecione um canal...</option>
            {canais.map(c => <option key={c.canal_id} value={c.canal_id}>{c.nome}</option>)}
          </select>
        </label>

        <label className="proc-label">
          Direção
          <select className="proc-select" value={direcao} onChange={e => setDirecao(e.target.value)}>
            <option value="any_to_canal">ANYMARKET → Canal</option>
            <option value="canal_to_any">Canal → ANYMARKET</option>
          </select>
        </label>

        <label className="proc-label">
          Tamanho do lote
          <input
            className="proc-input"
            type="number"
            min={1}
            max={1000}
            value={batchSize}
            onChange={e => setBatchSize(Math.min(1000, Math.max(1, Number(e.target.value))))}
          />
        </label>

        <label className="proc-label">
          Planilha de dados
          <input type="file" accept=".xlsx,.csv" onChange={handleFile} />
          {parsed && (
            <span className="proc-hint">{parsed.rows.length} linha(s) detectada(s)</span>
          )}
        </label>
      </div>

      {parsed && mapeamentos.length > 0 && (
        <div className="proc-actions">
          <button className="btn-secondary-proc" onClick={gerarPreview}>Pré-visualizar</button>
          <button className="btn-primary-proc" onClick={processar}>Processar e Baixar</button>
        </div>
      )}

      {preview && (
        <div className="proc-preview">
          <p className="proc-section-title">Preview (primeiras 5 linhas)</p>
          <div className="table-scroll">
            <table className="proc-table">
              <thead>
                <tr>{preview.cabecalho.map((h, i) => <th key={i}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {relatorio && (
        <div className="proc-relatorio">
          <p className="proc-section-title">Relatório</p>
          <p>✅ {relatorio.convertidas} linha(s) convertida(s)</p>
          {relatorio.skipped > 0 && <p>⚠️ {relatorio.skipped} linha(s) ignorada(s) por exceder o lote</p>}
          {relatorio.erros.length > 0 && (
            <ul className="proc-erros">
              {relatorio.erros.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
    <HelpPanel contexto="processor" />
    </div>
  )
}
