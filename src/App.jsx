import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchJson, getToken, loadCandidaturas, saveCandidaturas, setToken } from './github'
import { applyFilters, computeKpis, download, toCsv, uniq } from './utils'
import Kpis from './components/Kpis'
import Filters, { DEFAULT_FILTERS } from './components/Filters'
import JobList from './components/JobList'
import JobDetail from './components/JobDetail'
import TokenSetup from './components/TokenSetup'

const FILTERS_KEY = 'estagio-radar-filtros'
const loadFilters = () => {
  try {
    return { ...DEFAULT_FILTERS, ...JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}') }
  } catch {
    return DEFAULT_FILTERS
  }
}

export default function App() {
  const [token, setTok] = useState(getToken)
  const [vagas, setVagas] = useState([])
  const [meta, setMeta] = useState(null)
  const [cand, setCand] = useState({})
  const [filters, setFilters] = useState(loadFilters)
  const [selected, setSelected] = useState(null)
  const [state, setState] = useState({ loading: false, error: '', saving: '' })
  const pending = useRef({})
  const timer = useRef(null)

  const load = useCallback(async () => {
    if (!token) return
    setState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const [v, m, c] = await Promise.all([
        fetchJson('dashboard/vagas.json', token),
        fetchJson('dashboard/meta.json', token),
        loadCandidaturas(token),
      ])
      setVagas(v)
      setMeta(m)
      setCand(c.data.itens || {})
      setState((s) => ({ ...s, loading: false }))
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }))
      if (e.status === 401) {
        setToken('')
        setTok('')
      }
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
    } catch {
      /* preferências não persistem neste navegador */
    }
  }, [filters])

  const flush = useCallback(async () => {
    const local = pending.current
    if (!Object.keys(local).length) return
    pending.current = {}
    setState((s) => ({ ...s, saving: 'Salvando…' }))
    try {
      const { itens } = await saveCandidaturas(token, local)
      setCand(() => ({ ...itens, ...pending.current })) // inclui mudanças de outros dispositivos
      setState((s) => ({ ...s, saving: 'Salvo' }))
    } catch (e) {
      pending.current = { ...local, ...pending.current }
      setState((s) => ({ ...s, saving: `Erro ao salvar: ${e.message}` }))
    }
  }, [token])

  // Atualização otimista + gravação agrupada (1,5 s) no repositório privado.
  const updateCand = useCallback(
    (uid, patch) => {
      setCand((cur) => {
        const prev = cur[uid] || { status: 'nao_visualizada' }
        const now = new Date().toISOString()
        const next = { ...prev, ...patch, atualizado_em: now }
        if (patch.status && patch.status !== prev.status) {
          next.historico = [...(prev.historico || []), { status: patch.status, em: now }].slice(-30)
        }
        pending.current[uid] = next
        return { ...cur, [uid]: next }
      })
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 1500)
    },
    [flush],
  )

  useEffect(() => {
    const onHide = () => flush()
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [flush])

  const options = useMemo(() => {
    const techs = {}
    vagas.forEach((v) => Object.keys(v.tecnologias || {}).forEach((t) => (techs[t] = (techs[t] || 0) + 1)))
    return {
      areas: uniq(vagas.map((v) => v.area)),
      empresas: uniq(vagas.map((v) => v.empresa)),
      locais: uniq(vagas.map((v) => [v.cidade, v.estado].filter(Boolean).join(' – ') || v.localizacao_texto)),
      fontes: uniq(vagas.flatMap((v) => v.fontes || [v.source])),
      tecnologias: Object.entries(techs).sort((a, b) => b[1] - a[1]).map(([t]) => t),
    }
  }, [vagas])

  const filtered = useMemo(() => applyFilters(vagas, cand, filters), [vagas, cand, filters])
  const kpis = useMemo(() => computeKpis(vagas, cand, meta), [vagas, cand, meta])
  const current = selected && vagas.find((v) => v.uid === selected)

  const open = (uid) => {
    setSelected(uid)
    if ((cand[uid]?.status || 'nao_visualizada') === 'nao_visualizada') updateCand(uid, { status: 'visualizada' })
  }

  if (!token) {
    return (
      <TokenSetup
        error={state.error}
        onSave={(t, remember) => {
          setToken(t, remember)
          setTok(t)
        }}
      />
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>📡 Estágio Radar</h1>
          <p className="muted small">Central de vagas de estágio · dados lidos do repositório privado</p>
        </div>
        <div className="actions">
          {state.saving && <span className="small muted" role="status">{state.saving}</span>}
          <button onClick={load} disabled={state.loading}>{state.loading ? 'Atualizando…' : 'Atualizar'}</button>
          <button onClick={() => download(`vagas-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(filtered, cand))}>
            Exportar CSV
          </button>
          <button
            className="ghost"
            onClick={() => {
              if (confirm('Remover o token deste navegador?')) {
                setToken('')
                setTok('')
              }
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {state.error && <div className="alert">{state.error}</div>}
      <Kpis k={kpis} />
      <Filters value={filters} onChange={setFilters} options={options} />
      <p className="small muted count">
        {filtered.length} de {vagas.length} vagas
      </p>
      <JobList vagas={filtered} cand={cand} onOpen={open} onUpdate={updateCand} />
      {current && <JobDetail v={current} item={cand[current.uid]} onClose={() => setSelected(null)} onUpdate={updateCand} />}
      <footer className="small muted">
        A pontuação estima a aderência ao seu perfil — não é probabilidade de contratação.
      </footer>
    </div>
  )
}
