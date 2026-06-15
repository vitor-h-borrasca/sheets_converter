const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL

async function get(action, params = {}) {
  const url = new URL(BASE_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString())
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data
}

async function post(action, payload = {}) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    body: JSON.stringify({ action, ...payload }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data
}

export const driveService = {
  getCanais:       ()                    => get('getCanais'),
  getMapeamentos:  (canal_id)            => get('getMapeamentos', { canal_id }),
  getTemplate:     (canal_id)            => get('getTemplate', { canal_id }),
  getAnySchema:    ()                    => get('getAnySchema'),

  createCanal:     (payload)             => post('createCanal', payload),
  saveTemplate:    (canal_id, colunas)   => post('saveTemplate', { canal_id, colunas }),
  saveMapeamento:  (canal_id, pares)     => post('saveMapeamento', { canal_id, pares }),
  saveAnySchema:   (colunas)             => post('saveAnySchema', { colunas }),
  togglePar:       (canal_id, par, ativo) => post('togglePar', { canal_id, ...par, ativo }),
  deleteCanal:     (canal_id)            => post('deleteCanal', { canal_id }),
}
