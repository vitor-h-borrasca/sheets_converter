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
  async parseFile(file) {
    validateExtension(file)
    const wb   = await readWorkbook(file)
    const ws   = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    if (!data.length || !data[0].length) {
      throw new Error('Nenhuma coluna encontrada. Verifique se a primeira linha contém os cabeçalhos.')
    }

    const headers = data[0].map((name, i) => ({ posicao: indexToLetter(i), nome: String(name) }))
    const rows    = data.slice(1).map(row => row.map(String))

    return { headers, rows }
  },

  async extractHeaders(file) {
    const { headers } = await sheetParser.parseFile(file)
    return headers
  },
}
