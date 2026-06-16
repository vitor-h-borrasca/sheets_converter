import './HelpPanel.css'

const CONTEUDO = {
  processor: {
    titulo: 'Como usar o Processor',
    passos: [
      { n: '1', texto: 'Selecione o **canal** de destino (ex: Mercado Livre). O canal precisa ter template e mapeamento configurados no Config Manager.' },
      { n: '2', texto: 'Escolha a **direção** da conversão: ANYMARKET → Canal para exportar produtos, ou Canal → ANYMARKET para importar.' },
      { n: '3', texto: 'Defina o **tamanho do lote** — quantas linhas serão processadas por vez. O padrão de 500 funciona bem para a maioria dos casos.' },
      { n: '4', texto: 'Faça upload da **planilha de dados** (.xlsx ou .csv). A primeira linha deve conter os cabeçalhos.' },
      { n: '5', texto: 'Clique em **Pré-visualizar** para conferir as primeiras 5 linhas convertidas antes de processar tudo.' },
      { n: '6', texto: 'Clique em **Processar e Baixar** para gerar e baixar o arquivo convertido.' },
    ],
    dica: 'Configure os canais primeiro no Config Manager antes de usar o Processor.',
  },
  canal: {
    titulo: 'Criando um novo canal',
    passos: [
      { n: '1', texto: 'Dê um **nome** para o canal (ex: Shopee BR, Mercado Livre).' },
      { n: '2', texto: 'Escolha o **formato de saída**: XLSX ou CSV.' },
      { n: '3', texto: 'Clique em **Criar Canal**. Depois disso, configure o Template e o Mapeamento.' },
    ],
    proximo: 'Próximo passo: selecione o canal criado e configure o Template.',
  },
  anyschema: {
    titulo: 'Schema ANYMARKET',
    passos: [
      { n: '1', texto: 'Defina aqui as **colunas do ANYMARKET** — a planilha padrão usada como origem ou destino.' },
      { n: '2', texto: 'Cada coluna tem uma **posição** (letra, ex: A, B, C) e um **nome**.' },
      { n: '3', texto: 'Este schema é **compartilhado entre todos os canais** — altere com cuidado.' },
      { n: '4', texto: 'Clique em **Salvar Schema** após as edições.' },
    ],
    dica: 'O schema do ANYMARKET é a base de todos os mapeamentos. Configure antes de criar os mapeamentos dos canais.',
  },
  template: {
    titulo: 'Template do canal',
    passos: [
      { n: '1', texto: 'Faça upload do arquivo de **template do canal** (.xlsx ou .csv) — a planilha com as colunas no formato esperado pelo marketplace.' },
      { n: '2', texto: 'O sistema detecta automaticamente as colunas e suas posições.' },
      { n: '3', texto: 'Clique em **Salvar Template** para registrar.' },
    ],
    proximo: 'Próximo passo: vá para Mapeamento e conecte as colunas do ANYMARKET com as do canal.',
  },
  mapping: {
    titulo: 'Mapeamento de colunas',
    passos: [
      { n: '1', texto: 'Selecione uma coluna do **ANYMARKET** (lado esquerdo) e uma do **canal** (lado direito).' },
      { n: '2', texto: 'Clique em **Conectar →** para criar o vínculo entre elas. Colunas conectadas ficam verdes.' },
      { n: '3', texto: 'Para remover um vínculo, selecione o par e clique em **Desconectar ✕**.' },
      { n: '4', texto: 'Na tabela abaixo, você pode **ativar ou desativar** pares individualmente sem removê-los.' },
      { n: '5', texto: 'Clique em **Salvar Mapeamento** para persistir as configurações.' },
    ],
    dica: 'Apenas pares ativos são usados na conversão. Use a pesquisa para encontrar colunas rapidamente.',
  },
}

export default function HelpPanel({ contexto }) {
  const conteudo = CONTEUDO[contexto] ?? CONTEUDO.processor

  return (
    <aside className="help-panel">
      <p className="help-label">Ajuda</p>
      <h3 className="help-title">{conteudo.titulo}</h3>
      <ol className="help-steps">
        {conteudo.passos.map(p => (
          <li key={p.n} className="help-step">
            <span className="help-step-n">{p.n}</span>
            <span className="help-step-text" dangerouslySetInnerHTML={{ __html: p.texto.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
          </li>
        ))}
      </ol>
      {conteudo.proximo && (
        <div className="help-next">
          <span className="help-next-icon">→</span> {conteudo.proximo}
        </div>
      )}
      {conteudo.dica && (
        <div className="help-tip">
          <span className="help-tip-icon">💡</span> {conteudo.dica}
        </div>
      )}
    </aside>
  )
}
