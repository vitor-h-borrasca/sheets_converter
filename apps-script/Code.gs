// ============================================================
// CONFIGURAÇÃO — ajuste o nome da planilha se necessário
// ============================================================
const SHEET_CANAIS      = 'Canais';
const SHEET_MAPEAMENTOS = 'Mapeamentos';
const SHEET_TEMPLATES   = 'Templates';
const SHEET_ANY_SCHEMA  = 'AnySchema';

// ============================================================
// ENTRY POINTS
// ============================================================

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'getCanais':       return respond(getCanais());
      case 'getMapeamentos':  return respond(getMapeamentos(e.parameter.canal_id));
      case 'getTemplate':     return respond(getTemplate(e.parameter.canal_id));
      case 'getAnySchema':    return respond(getAnySchema());
      default:                return respondError('Ação GET inválida: ' + action);
    }
  } catch (err) {
    return respondError(err.message);
  }
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const action  = payload.action;
  try {
    switch (action) {
      case 'createCanal':    createCanal(payload);              return respond(null);
      case 'saveTemplate':   saveTemplate(payload);             return respond(null);
      case 'saveMapeamento': saveMapeamento(payload);           return respond(null);
      case 'saveAnySchema':  saveAnySchema(payload);            return respond(null);
      case 'togglePar':      togglePar(payload);                return respond(null);
      case 'deleteCanal':    deleteCanal(payload.canal_id);     return respond(null);
      default:               return respondError('Ação POST inválida: ' + action);
    }
  } catch (err) {
    return respondError(err.message);
  }
}

// ============================================================
// GET — Canais
// ============================================================

function getCanais() {
  const sheet = getSheet(SHEET_CANAIS);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    canal_id:       r[0],
    nome:           r[1],
    formato_saida:  r[2],
    criado_em:      r[3],
  }));
}

// ============================================================
// GET — Mapeamentos
// ============================================================

function getMapeamentos(canal_id) {
  if (!canal_id) throw new Error('canal_id obrigatório');
  const sheet = getSheet(SHEET_MAPEAMENTOS);
  const rows  = sheet.getDataRange().getValues();
  return rows.slice(1)
    .filter(r => r[0] === canal_id)
    .map(r => ({
      canal_id:      r[0],
      posicao_any:   r[1],
      posicao_canal: r[2],
      ativo:         r[3] === true || r[3] === 'TRUE',
    }));
}

// ============================================================
// GET — Template do canal
// ============================================================

function getTemplate(canal_id) {
  if (!canal_id) throw new Error('canal_id obrigatório');
  const sheet = getSheet(SHEET_TEMPLATES);
  const rows  = sheet.getDataRange().getValues();
  return rows.slice(1)
    .filter(r => r[0] === canal_id)
    .map(r => ({
      canal_id:    r[0],
      posicao:     r[1],
      nome_coluna: r[2],
      obrigatorio: r[3] === true || r[3] === 'TRUE',
    }));
}

// ============================================================
// GET — Schema do ANYMARKET
// ============================================================

function getAnySchema() {
  const sheet = getSheet(SHEET_ANY_SCHEMA);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    posicao:     r[0],
    nome_coluna: r[1],
    obrigatorio: r[2] === true || r[2] === 'TRUE',
  }));
}

// ============================================================
// POST — Criar canal
// ============================================================

function createCanal(payload) {
  const { canal_id, nome, formato_saida } = payload;
  if (!canal_id || !nome || !formato_saida) throw new Error('Campos obrigatórios: canal_id, nome, formato_saida');

  const sheet = getSheet(SHEET_CANAIS);
  const rows  = sheet.getDataRange().getValues();
  const exists = rows.slice(1).some(r => r[0] === canal_id);
  if (exists) throw new Error('Canal já existe: ' + canal_id);

  sheet.appendRow([canal_id, nome, formato_saida, new Date()]);
}

// ============================================================
// POST — Salvar template do canal (substitui tudo do canal)
// ============================================================

function saveTemplate(payload) {
  const { canal_id, colunas } = payload;
  if (!canal_id) throw new Error('canal_id obrigatório');

  const sheet = getSheet(SHEET_TEMPLATES);
  deleteRowsByCanal(sheet, canal_id, 0);
  colunas.forEach(c => sheet.appendRow([canal_id, c.posicao, c.nome_coluna, c.obrigatorio]));
}

// ============================================================
// POST — Salvar mapeamento do canal (substitui tudo do canal)
// ============================================================

function saveMapeamento(payload) {
  const { canal_id, pares } = payload;
  if (!canal_id) throw new Error('canal_id obrigatório');

  const sheet = getSheet(SHEET_MAPEAMENTOS);
  deleteRowsByCanal(sheet, canal_id, 0);
  pares.forEach(p => sheet.appendRow([canal_id, p.posicao_any, p.posicao_canal, true]));
}

// ============================================================
// POST — Salvar schema do ANYMARKET (substitui tudo)
// ============================================================

function saveAnySchema(payload) {
  const { colunas } = payload;
  if (!colunas) throw new Error('colunas obrigatório');

  const sheet = getSheet(SHEET_ANY_SCHEMA);
  // mantém só o cabeçalho
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

  colunas.forEach(c => sheet.appendRow([c.posicao, c.nome_coluna, c.obrigatorio]));
}

// ============================================================
// POST — Toggle de par de mapeamento
// ============================================================

function togglePar(payload) {
  const { canal_id, posicao_any, posicao_canal, ativo } = payload;
  const sheet = getSheet(SHEET_MAPEAMENTOS);
  const rows  = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === canal_id && rows[i][1] === posicao_any && rows[i][2] === posicao_canal) {
      sheet.getRange(i + 1, 4).setValue(ativo);
      return;
    }
  }
  throw new Error('Par não encontrado');
}

// ============================================================
// POST — Deletar canal (remove canal + mapeamentos + template)
// ============================================================

function deleteCanal(canal_id) {
  if (!canal_id) throw new Error('canal_id obrigatório');

  deleteRowsByCanal(getSheet(SHEET_CANAIS),      canal_id, 0);
  deleteRowsByCanal(getSheet(SHEET_MAPEAMENTOS), canal_id, 0);
  deleteRowsByCanal(getSheet(SHEET_TEMPLATES),   canal_id, 0);
}

// ============================================================
// HELPERS
// ============================================================

function getSheet(name) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initSheetHeaders(sheet, name);
  }
  return sheet;
}

function initSheetHeaders(sheet, name) {
  const headers = {
    [SHEET_CANAIS]:      ['canal_id', 'nome', 'formato_saida', 'criado_em'],
    [SHEET_MAPEAMENTOS]: ['canal_id', 'posicao_any', 'posicao_canal', 'ativo'],
    [SHEET_TEMPLATES]:   ['canal_id', 'posicao', 'nome_coluna', 'obrigatorio'],
    [SHEET_ANY_SCHEMA]:  ['posicao', 'nome_coluna', 'obrigatorio'],
  };
  if (headers[name]) sheet.appendRow(headers[name]);
}

function deleteRowsByCanal(sheet, canal_id, colIndex) {
  const rows = sheet.getDataRange().getValues();
  // percorre de baixo para cima para não bagunçar os índices
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][colIndex] === canal_id) sheet.deleteRow(i + 1);
  }
}

function seedAnySchema() {
  const colunas = [
    ['A','AGRUPADOR'],['B','STATUS'],['C','TÍTULO'],['D','CÓDIGO FORNECEDOR / SKU INTERNO'],
    ['E','EAN'],['F','NBM'],['G','ORIGEM'],['H','TÍTULO SKU'],['I','DESCRICAO TÉCNICA'],
    ['J','CATEGORIA'],['K','MARCA'],['L','CÓDIGO INTERNO'],['M','MODELO'],['N','PESO'],
    ['O','PROFUNDIDADE'],['P','LARGURA'],['Q','ALTURA'],['R','TEMPO DE GARANTIA'],
    ['S','TEXTO DE GARANTIA'],['T','VÍDEO'],['U','CÁLCULO DE PREÇO'],['V','CUSTO'],
    ['W','MARKUP'],['X','PREÇO DE'],['Y','PREÇO POR'],['Z','QTD'],['AA','PRAZO ADICIONAL'],
    ['AB','IMAGEM 1'],['AC','IMAGEM 2'],['AD','IMAGEM 3'],['AE','IMAGEM 4'],['AF','IMAGEM 5'],
    ['AG','IMAGEM 6'],['AH','IMAGEM 7'],['AI','IMAGEM 8'],['AJ','IMAGEM 9'],['AK','IMAGEM 10'],
    ['AL','NOME VARIAÇÃO 1'],['AM','VALOR VARIAÇÃO 1'],['AN','NOME VARIAÇÃO 2'],['AO','VALOR VARIAÇÃO 2'],
    ['AP','NOME VARIAÇÃO 3'],['AQ','VALOR VARIAÇÃO 3'],['AR','GÊNERO'],
    ['AS','PERMITIR ANÚNCIOS AUTOMÁTICOS'],['AT','ID DO SKU'],
    ['AU','NOME 1'],['AV','VALOR 1'],['AW','NOME 2'],['AX','VALOR 2'],['AY','NOME 3'],['AZ','VALOR 3'],
    ['BA','NOME 4'],['BB','VALOR 4'],['BC','NOME 5'],['BD','VALOR 5'],['BE','NOME 6'],['BF','VALOR 6'],
    ['BG','NOME 7'],['BH','VALOR 7'],['BI','NOME 8'],['BJ','VALOR 8'],['BK','NOME 9'],['BL','VALOR 9'],
    ['BM','NOME 10'],['BN','VALOR 10'],['BO','NOME 11'],['BP','VALOR 11'],['BQ','NOME 12'],['BR','VALOR 12'],
    ['BS','NOME 13'],['BT','VALOR 13'],['BU','NOME 14'],['BV','VALOR 14'],['BW','NOME 15'],['BX','VALOR 15'],
    ['BY','NOME 16'],['BZ','VALOR 16'],['CA','NOME 17'],['CB','VALOR 17'],['CC','NOME 18'],['CD','VALOR 18'],
    ['CE','NOME 19'],['CF','VALOR 19'],['CG','NOME 20'],['CH','VALOR 20'],['CI','NOME 21'],['CJ','VALOR 21'],
    ['CK','NOME 22'],['CL','VALOR 22'],['CM','NOME 23'],['CN','VALOR 23'],['CO','NOME 24'],['CP','VALOR 24'],
    ['CQ','NOME 25'],['CR','VALOR 25'],['CS','NOME 26'],['CT','VALOR 26'],['CU','NOME 27'],['CV','VALOR 27'],
    ['CW','NOME 28'],['CX','VALOR 28'],['CY','NOME 29'],['CZ','VALOR 29'],['DA','NOME 30'],['DB','VALOR 30'],
    ['DC','NOME 31'],['DD','VALOR 31'],['DE','NOME 32'],['DF','VALOR 32'],['DG','NOME 33'],['DH','VALOR 33'],
    ['DI','NOME 34'],['DJ','VALOR 34'],['DK','NOME 35'],['DL','VALOR 35'],['DM','NOME 36'],['DN','VALOR 36'],
    ['DO','NOME 37'],['DP','VALOR 37'],['DQ','NOME 38'],['DR','VALOR 38'],['DS','NOME 39'],['DT','VALOR 39'],
    ['DU','NOME 40'],['DV','VALOR 40'],['DW','NOME 41'],['DX','VALOR 41'],['DY','NOME 42'],['DZ','VALOR 42'],
    ['EA','NOME 43'],['EB','VALOR 43'],['EC','NOME 44'],['ED','VALOR 44'],['EE','NOME 45'],['EF','VALOR 45'],
    ['EG','NOME 46'],['EH','VALOR 46'],['EI','NOME 47'],['EJ','VALOR 47'],['EK','NOME 48'],['EL','VALOR 48'],
    ['EM','NOME 49'],['EN','VALOR 49'],['EO','NOME 50'],['EP','VALOR 50'],['EQ','NOME 51'],['ER','VALOR 51'],
    ['ES','NOME 52'],['ET','VALOR 52'],['EU','NOME 53'],['EV','VALOR 53'],['EW','NOME 54'],['EX','VALOR 54'],
    ['EY','NOME 55'],['EZ','VALOR 55'],['FA','NOME 56'],['FB','VALOR 56'],['FC','NOME 57'],['FD','VALOR 57'],
    ['FE','NOME 58'],['FF','VALOR 58'],['FG','NOME 59'],['FH','VALOR 59'],['FI','NOME 60'],['FJ','VALOR 60'],
    ['FK','NOME 61'],['FL','VALOR 61'],['FM','NOME 62'],['FN','VALOR 62'],['FO','NOME 63'],['FP','VALOR 63'],
    ['FQ','NOME 64'],['FR','VALOR 64'],['FS','NOME 65'],['FT','VALOR 65'],['FU','NOME 66'],['FV','VALOR 66'],
    ['FW','NOME 67'],['FX','VALOR 67'],['FY','NOME 68'],['FZ','VALOR 68'],['GA','NOME 69'],['GB','VALOR 69'],
    ['GC','NOME 70'],['GD','VALOR 70'],['GE','NOME 71'],['GF','VALOR 71'],['GG','NOME 72'],['GH','VALOR 72'],
    ['GI','NOME 73'],['GJ','VALOR 73'],['GK','NOME 74'],['GL','VALOR 74'],['GM','NOME 75'],['GN','VALOR 75'],
    ['GO','NOME 76'],['GP','VALOR 76'],['GQ','NOME 77'],['GR','VALOR 77'],['GS','NOME 78'],['GT','VALOR 78'],
    ['GU','NOME 79'],['GV','VALOR 79'],['GW','NOME 80'],['GX','VALOR 80'],['GY','NOME 81'],['GZ','VALOR 81'],
    ['HA','NOME 82'],['HB','VALOR 82'],['HC','NOME 83'],['HD','VALOR 83'],['HE','NOME 84'],['HF','VALOR 84'],
    ['HG','NOME 85'],['HH','VALOR 85'],['HI','NOME 86'],['HJ','VALOR 86'],['HK','NOME 87'],['HL','VALOR 87'],
    ['HM','NOME 88'],['HN','VALOR 88'],['HO','NOME 89'],['HP','VALOR 89'],['HQ','NOME 90'],['HR','VALOR 90'],
    ['HS','NOME 91'],['HT','VALOR 91'],['HU','NOME 92'],['HV','VALOR 92'],['HW','NOME 93'],['HX','VALOR 93'],
    ['HY','NOME 94'],['HZ','VALOR 94'],['IA','NOME 95'],['IB','VALOR 95'],['IC','NOME 96'],['ID','VALOR 96'],
    ['IE','NOME 97'],['IF','VALOR 97'],['IG','NOME 98'],['IH','VALOR 98'],['II','NOME 99'],['IJ','VALOR 99'],
  ];

  const sheet = getSheet(SHEET_ANY_SCHEMA);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

  colunas.forEach(([posicao, nome_coluna]) => {
    sheet.appendRow([posicao, nome_coluna, false]);
  });

  Logger.log('AnySchema populado com ' + colunas.length + ' colunas.');
}

function respond(data) {
  const output = ContentService.createTextOutput(
    JSON.stringify({ success: true, data: data })
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function respondError(message) {
  const output = ContentService.createTextOutput(
    JSON.stringify({ success: false, error: message })
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
