import * as XLSX from 'xlsx'

function indexToLetter(i) {
  let letter = ''
  let n = i
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}

function readWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        resolve(wb)
      } catch {
        reject(new Error('Erro ao ler o arquivo.'))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'))
    reader.readAsArrayBuffer(file)
  })
}

function validateExtension(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!['xlsx', 'csv'].includes(ext)) {
    throw new Error('Formato não suportado. Use .xlsx ou .csv.')
  }
}

export const sheetParser = {
  async getSheetNames(file) {
    validateExtension(file)
    const wb = await readWorkbook(file)
    return wb.SheetNames
  },

  async getSheetRowCount(file, sheetName) {
    validateExtension(file)
    const wb   = await readWorkbook(file)
    const ws   = wb.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    return data.length
  },

  async extractHeaders(file, { sheetName, headerRow = 1 } = {}) {
    validateExtension(file)
    const wb      = await readWorkbook(file)
    const sheet   = sheetName ?? wb.SheetNames[0]
    const ws      = wb.Sheets[sheet]
    const data    = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    const rowIdx  = headerRow - 1

    if (!data[rowIdx] || !data[rowIdx].some(v => v !== '')) {
      throw new Error(`Linha ${headerRow} não contém cabeçalhos válidos.`)
    }

    return data[rowIdx].map((name, i) => ({ posicao: indexToLetter(i), nome: String(name) }))
  },

  async parseFile(file, { sheetName, headerRow = 1 } = {}) {
    validateExtension(file)
    const wb      = await readWorkbook(file)
    const sheet   = sheetName ?? wb.SheetNames[0]
    const ws      = wb.Sheets[sheet]
    const data    = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    const rowIdx  = headerRow - 1

    if (!data.length || !data[rowIdx]?.length) {
      throw new Error('Nenhuma coluna encontrada. Verifique a aba e a linha do cabeçalho.')
    }

    const headers = data[rowIdx].map((name, i) => ({ posicao: indexToLetter(i), nome: String(name) }))
    const rows    = data.slice(rowIdx + 1).map(row => row.map(String))

    return { headers, rows }
  },
}
