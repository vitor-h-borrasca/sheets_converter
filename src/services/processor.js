function letterToIndex(letter) {
  let index = 0
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + letter.charCodeAt(i) - 64
  }
  return index - 1
}

export function convert({ sourceRows, mapeamentos, direcao, batchSize }) {
  const ativados = mapeamentos.filter(p => p.ativo)
  if (!ativados.length) throw new Error('Nenhum par de colunas ativo para este canal.')

  const linhas   = sourceRows.slice(0, batchSize)
  const skipped  = Math.max(0, sourceRows.length - batchSize)
  const erros    = []
  const rows     = []

  // descobre a maior coluna de destino para saber o tamanho da linha
  const maxDestIdx = ativados.reduce((max, par) => {
    const dest = direcao === 'any_to_canal' ? par.posicao_canal : par.posicao_any
    return Math.max(max, letterToIndex(dest))
  }, 0)

  linhas.forEach((srcRow, rowIdx) => {
    try {
      const destRow = new Array(maxDestIdx + 1).fill('')
      ativados.forEach(par => {
        const srcCol  = direcao === 'any_to_canal' ? par.posicao_any   : par.posicao_canal
        const destCol = direcao === 'any_to_canal' ? par.posicao_canal : par.posicao_any
        const valor   = srcRow[letterToIndex(srcCol)] ?? ''
        destRow[letterToIndex(destCol)] = valor
      })
      rows.push(destRow)
    } catch (err) {
      erros.push(`Linha ${rowIdx + 2}: ${err.message}`)
    }
  })

  return { rows, skipped, erros }
}
