// Acesso ao repositório PRIVADO de dados via API do GitHub, com token da própria usuária.
// Nenhum dado fica neste site público: tudo é lido/gravado em tempo real no repositório privado.
export const REPO = 'Manuellasantos/estagio-radar'
export const BRANCH = 'data'
const API = `https://api.github.com/repos/${REPO}/contents/`
const TOKEN_KEY = 'estagio-radar-token'
export const CANDIDATURAS_PATH = 'candidaturas.json'

export function getToken() {
  if (LOCAL) return 'local'
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setToken(token, remember) {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    if (token) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  } catch {
    /* armazenamento bloqueado: o token vale só nesta aba */
  }
}

export class GitHubError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(path, { token, raw = false, method = 'GET', body } = {}) {
  const url = API + path + (method === 'GET' ? `?ref=${BRANCH}&t=${Date.now()}` : '')
  const res = await fetch(url, {
    method,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const msg = {
      401: 'Token inválido ou expirado.',
      403: 'Token sem permissão (ou limite da API atingido).',
      404: 'Arquivo ou repositório não encontrado (verifique o acesso do token ao repositório).',
      409: 'Conflito de versão.',
    }[res.status] || `Erro ${res.status} na API do GitHub.`
    throw new GitHubError(res.status, msg)
  }
  return res.json()
}

/* global __LOCAL_DATA__ */
// Modo de desenvolvimento local (npm run dev com LOCAL_DATA): sem token, candidaturas só em memória.
export const LOCAL = typeof __LOCAL_DATA__ !== 'undefined' && __LOCAL_DATA__ && import.meta.env.DEV
let memory = { versao: 1, itens: {} }

// O GitHub responde 404 (não 403) quando o token não enxerga um repositório privado.
// Consulta os metadados do repo para dizer exatamente o que falta no token.
async function diagnose404(token) {
  const res = await fetch(`https://api.github.com/repos/${REPO}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  }).catch(() => null)
  if (res?.ok) {
    return new GitHubError(404, 'O token acessa o repositório, mas não tem a permissão "Contents". ' +
      'Edite o token: Repository permissions → Contents → Read and write.')
  }
  return new GitHubError(404, `O token não tem acesso ao repositório privado ${REPO}. Edite o token: ` +
    'Resource owner = sua conta; Repository access → Only select repositories → estagio-radar.')
}

export const fetchJson = (path, token) =>
  LOCAL
    ? fetch(`/local-data/${path}`).then((r) => (r.ok ? r.json() : Promise.reject(new GitHubError(r.status, `Arquivo local ausente: ${path}`))))
    : request(path, { token, raw: true }).catch(async (e) => {
        throw e.status === 404 ? await diagnose404(token) : e
      })

// Base64 <-> UTF-8
function b64encode(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
const b64decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)))

export async function loadCandidaturas(token) {
  if (LOCAL) return { data: memory, sha: null }
  try {
    const meta = await request(CANDIDATURAS_PATH, { token })
    return { data: JSON.parse(b64decode(meta.content)), sha: meta.sha }
  } catch (e) {
    if (e.status === 404) return { data: { versao: 1, itens: {} }, sha: null }
    throw e
  }
}

// Mescla por vaga: a alteração mais recente vence (permite uso simultâneo no celular e no PC).
export function mergeItens(remote, local) {
  const out = { ...remote }
  for (const [uid, item] of Object.entries(local)) {
    if (!out[uid] || (item.atualizado_em || '') >= (out[uid].atualizado_em || '')) out[uid] = item
  }
  return out
}

export async function saveCandidaturas(token, localItens) {
  if (LOCAL) {
    memory = { versao: 1, itens: mergeItens(memory.itens, localItens) }
    return { itens: memory.itens, sha: null }
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, sha } = await loadCandidaturas(token)
    const merged = { versao: 1, itens: mergeItens(data.itens || {}, localItens) }
    const content = b64encode(JSON.stringify(merged, null, 1))
    try {
      const res = await request(CANDIDATURAS_PATH, {
        token,
        method: 'PUT',
        body: { message: 'data: atualiza candidaturas (dashboard)', content, branch: BRANCH, ...(sha ? { sha } : {}) },
      })
      return { itens: merged.itens, sha: res.content.sha }
    } catch (e) {
      if (e.status !== 409 && e.status !== 422) throw e
    }
  }
  throw new GitHubError(409, 'Não foi possível salvar após 3 tentativas (conflito).')
}
