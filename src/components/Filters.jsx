import { useState } from 'react'
import { DISPONIBILIDADE, FONTES, MODALIDADE, STATUS } from '../utils'

export const DEFAULT_FILTERS = {
  q: '', area: '', empresa: '', local: '', modalidade: '', fonte: '', scoreMin: 0, publicacaoDias: 0,
  tecnologia: '', bolsa: '', status: '', disponibilidade: 'disponivel', favoritas: false,
  mostrarDescartadas: false, ordem: 'relevancia',
}

function Select({ label, value, onChange, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todas</option>
        {children}
      </select>
    </label>
  )
}

export default function Filters({ value: f, onChange, options: o }) {
  const [open, setOpen] = useState(false)
  const set = (k) => (v) => onChange({ ...f, [k]: v })
  const active = Object.entries(f).filter(([k, v]) => !['q', 'ordem'].includes(k) && v !== DEFAULT_FILTERS[k]).length

  return (
    <section className="filters" aria-label="Filtros">
      <div className="filters-main">
        <input
          type="search"
          placeholder="Buscar por palavra-chave (título, empresa, descrição)…"
          value={f.q}
          onChange={(e) => set('q')(e.target.value)}
          aria-label="Buscar"
        />
        <label className="field inline">
          <span>Ordenar</span>
          <select value={f.ordem} onChange={(e) => set('ordem')(e.target.value)}>
            <option value="relevancia">Relevância</option>
            <option value="publicacao">Data de publicação</option>
            <option value="coleta">Data de descoberta</option>
          </select>
        </label>
        <button onClick={() => setOpen(!open)} aria-expanded={open}>
          Filtros{active ? ` (${active})` : ''}
        </button>
      </div>
      {open && (
        <div className="filters-grid">
          <Select label="Área" value={f.area} onChange={set('area')}>
            {o.areas.map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select label="Empresa" value={f.empresa} onChange={set('empresa')}>
            {o.empresas.map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select label="Localização" value={f.local} onChange={set('local')}>
            {o.locais.map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select label="Modalidade" value={f.modalidade} onChange={set('modalidade')}>
            {Object.entries(MODALIDADE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            <option value="nao_informada">Não informada</option>
          </Select>
          <Select label="Plataforma" value={f.fonte} onChange={set('fonte')}>
            {o.fontes.map((x) => <option key={x} value={x}>{FONTES[x] || x}</option>)}
          </Select>
          <Select label="Tecnologia" value={f.tecnologia} onChange={set('tecnologia')}>
            {o.tecnologias.map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select label="Bolsa-auxílio" value={f.bolsa} onChange={set('bolsa')}>
            <option value="informada">Informada</option>
            <option value="nao_informada">Não informada</option>
          </Select>
          <Select label="Status da candidatura" value={f.status} onChange={set('status')}>
            {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <Select label="Disponibilidade" value={f.disponibilidade} onChange={set('disponibilidade')}>
            {Object.entries(DISPONIBILIDADE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <label className="field">
            <span>Publicada nos últimos</span>
            <select value={f.publicacaoDias} onChange={(e) => set('publicacaoDias')(Number(e.target.value))}>
              <option value={0}>Qualquer data</option>
              <option value={1}>24 horas</option>
              <option value={7}>7 dias</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
            </select>
          </label>
          <label className="field">
            <span>Compatibilidade mínima: {f.scoreMin}</span>
            <input type="range" min="0" max="100" step="5" value={f.scoreMin}
              onChange={(e) => set('scoreMin')(Number(e.target.value))} />
          </label>
          <div className="field checks">
            <label><input type="checkbox" checked={f.favoritas} onChange={(e) => set('favoritas')(e.target.checked)} /> Só favoritas</label>
            <label><input type="checkbox" checked={f.mostrarDescartadas} onChange={(e) => set('mostrarDescartadas')(e.target.checked)} /> Mostrar descartadas</label>
          </div>
          <button className="ghost" onClick={() => onChange({ ...DEFAULT_FILTERS, q: f.q, ordem: f.ordem })}>Limpar filtros</button>
        </div>
      )}
    </section>
  )
}
