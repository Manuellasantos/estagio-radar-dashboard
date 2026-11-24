export const STATUS = [
  ['nao_visualizada', 'Não visualizada'],
  ['visualizada', 'Visualizada'],
  ['salva', 'Salva'],
  ['pretendo', 'Pretendo me candidatar'],
  ['candidatura_realizada', 'Candidatura realizada'],
  ['teste_tecnico', 'Teste técnico'],
  ['entrevista', 'Entrevista'],
  ['aguardando', 'Aguardando retorno'],
  ['aprovada', 'Aprovada'],
  ['reprovada', 'Reprovada'],
  ['descartada', 'Descartada'],
]
export const STATUS_LABEL = Object.fromEntries(STATUS)
export const APPLIED = new Set(['candidatura_realizada', 'teste_tecnico', 'entrevista', 'aguardando', 'aprovada', 'reprovada'])
export const DISPONIBILIDADE = { disponivel: 'Disponível', possivelmente_expirada: 'Possivelmente expirada', expirada: 'Expirada' }
export const MODALIDADE = { remoto: 'Remoto', hibrido: 'Híbrido', presencial: 'Presencial' }
export const FONTES = { gupy: 'Gupy', greenhouse: 'Greenhouse', lever: 'Lever', remotive: 'Remotive' }

const TZ = 'America/Sao_Paulo'
export const dayKey = (iso) => (iso ? new Date(iso).toLocaleDateString('sv-SE', { timeZone: TZ }) : '')
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ }) : '—')
export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }) : '—'
export const daysAgo = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 86400000 : Infinity)

export const scoreClass = (s) => (s >= 85 ? 'mt-alta' : s >= 70 ? 'alta' : s >= 50 ? 'moderada' : s >= 30 ? 'baixa' : 'mt-baixa')
export const local = (v) => [v.cidade, v.estado].filter(Boolean).join(' – ') || v.localizacao_texto || 'Não informada'
export const statusOf = (cand, uid) => cand[uid]?.status || 'nao_visualizada'

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function applyFilters(vagas, cand, f) {
  const q = norm(f.q)
  const out = vagas.filter((v) => {
    const st = statusOf(cand, v.uid)
    if (f.status ? st !== f.status : st === 'descartada' && !f.mostrarDescartadas) return false
    if (f.favoritas && !cand[v.uid]?.favorito) return false
    if (f.disponibilidade && v.status_disponibilidade !== f.disponibilidade) return false
    if (f.area && v.area !== f.area) return false
    if (f.empresa && v.empresa !== f.empresa) return false
    if (f.local && local(v) !== f.local) return false
    if (f.modalidade && (v.modalidade || 'nao_informada') !== f.modalidade) return false
    if (f.fonte && !(v.fontes || [v.source]).includes(f.fonte)) return false
    if ((v.score ?? 0) < f.scoreMin) return false
    if (f.publicacaoDias && daysAgo(v.data_publicacao || v.data_coleta) > f.publicacaoDias) return false
    if (f.tecnologia && !(v.tecnologias && f.tecnologia in v.tecnologias)) return false
    if (f.bolsa === 'informada' && !v.bolsa_auxilio) return false
    if (f.bolsa === 'nao_informada' && v.bolsa_auxilio) return false
    if (q && !norm(`${v.titulo} ${v.empresa} ${v.descricao} ${local(v)}`).includes(q)) return false
    return true
  })
  const by = {
    relevancia: (a, b) => (b.score ?? 0) - (a.score ?? 0),
    publicacao: (a, b) => (b.data_publicacao || '').localeCompare(a.data_publicacao || ''),
    coleta: (a, b) => (b.data_coleta || '').localeCompare(a.data_coleta || ''),
  }[f.ordem]
  return out.sort(by)
}

export function computeKpis(vagas, cand, meta) {
  const hoje = dayKey(new Date().toISOString())
  const itens = Object.values(cand)
  return {
    total: vagas.length,
    disponiveis: vagas.filter((v) => v.status_disponibilidade === 'disponivel').length,
    novasHoje: vagas.filter((v) => dayKey(v.data_coleta) === hoje).length,
    novasSemana: vagas.filter((v) => daysAgo(v.data_coleta) <= 7).length,
    altas: vagas.filter((v) => v.score >= 70 && v.status_disponibilidade === 'disponivel').length,
    salvas: itens.filter((i) => i.favorito || i.status === 'salva').length,
    candidaturas: itens.filter((i) => APPLIED.has(i.status)).length,
    entrevistas: itens.filter((i) => i.status === 'entrevista').length,
    ultima: meta?.ultima_execucao,
  }
}

export function toCsv(vagas, cand) {
  const cols = [
    ['Pontuação', (v) => v.score], ['Classificação', (v) => v.classificacao], ['Título', (v) => v.titulo],
    ['Empresa', (v) => v.empresa], ['Localização', local], ['Modalidade', (v) => MODALIDADE[v.modalidade] || ''],
    ['Área', (v) => v.area], ['Bolsa-auxílio', (v) => v.bolsa_auxilio], ['Publicação', (v) => fmtDate(v.data_publicacao)],
    ['Coleta', (v) => fmtDate(v.data_coleta)], ['Disponibilidade', (v) => DISPONIBILIDADE[v.status_disponibilidade]],
    ['Status candidatura', (v) => STATUS_LABEL[statusOf(cand, v.uid)]], ['Favorita', (v) => (cand[v.uid]?.favorito ? 'sim' : '')],
    ['Observações', (v) => cand[v.uid]?.notas], ['Lacunas', (v) => (v.lacunas || []).join('; ')],
    ['Fontes', (v) => (v.fontes || [v.source]).join(', ')], ['Link', (v) => v.url],
  ]
  const esc = (x) => {
    let s = x == null ? '' : String(x)
    if (/^[=+\-@]/.test(s)) s = "'" + s // evita injeção de fórmulas no Excel
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [cols.map((c) => c[0]).join(';'), ...vagas.map((v) => cols.map((c) => esc(c[1](v))).join(';'))]
  return '﻿' + lines.join('\n')
}

export function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
