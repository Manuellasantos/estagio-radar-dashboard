import { useEffect, useRef, useState } from 'react'
import { DISPONIBILIDADE, FONTES, MODALIDADE, STATUS, STATUS_LABEL, fmtDate, fmtDateTime, local, scoreClass } from '../utils'

const COMP = [
  ['habilidades', 'Habilidades técnicas'],
  ['formacao', 'Formação e elegibilidade'],
  ['area', 'Área de interesse'],
  ['localizacao', 'Localização e modalidade'],
  ['experiencia', 'Experiências'],
]
const SECAO = { obrigatorios: 'obrigatório', desejaveis: 'desejável', atividades: 'atividades', geral: 'mencionado', outros: 'mencionado' }

function List({ title, items, tone }) {
  if (!items?.length) return null
  return (
    <div className={`box ${tone || ''}`}>
      <h4>{title}</h4>
      <ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  )
}

export default function JobDetail({ v, item, onClose, onUpdate }) {
  const [notas, setNotas] = useState(item?.notas || '')
  const [showDesc, setShowDesc] = useState(false)
  const ref = useRef(null)
  const st = item?.status || 'nao_visualizada'

  useEffect(() => setNotas(item?.notas || ''), [v.uid]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="detail" role="dialog" aria-modal="true" aria-label={v.titulo} onClick={(e) => e.stopPropagation()} ref={ref} tabIndex={-1}>
        <button className="close" onClick={onClose} aria-label="Fechar">×</button>
        <div className="detail-head">
          <span className={`score big ${scoreClass(v.score)}`}>{v.score}</span>
          <div>
            <h2>{v.titulo}</h2>
            <p className="muted">{v.empresa} · {local(v)} · {MODALIDADE[v.modalidade] || 'Modalidade não informada'}</p>
            <p className="small muted">
              Compatibilidade {v.classificacao} · confiança {v.confianca}
            </p>
          </div>
        </div>

        <a className="apply" href={v.url} target="_blank" rel="noopener noreferrer">Abrir vaga original ↗</a>

        <div className="manage">
          <label className="field">
            <span>Status da candidatura</span>
            <select value={st} onChange={(e) => onUpdate(v.uid, { status: e.target.value })}>
              {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <button className={`star ${item?.favorito ? 'on' : ''}`} onClick={() => onUpdate(v.uid, { favorito: !item?.favorito })} aria-pressed={!!item?.favorito}>
            {item?.favorito ? '★ Favorita' : '☆ Favoritar'}
          </button>
          <button className="ghost" onClick={() => onUpdate(v.uid, { status: 'descartada' })}>Descartar</button>
          <label className="field full">
            <span>Observações pessoais</span>
            <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)}
              onBlur={() => notas !== (item?.notas || '') && onUpdate(v.uid, { notas })}
              placeholder="Contato do recrutador, datas, impressões…" />
          </label>
          {item?.historico?.length > 0 && (
            <p className="small muted full">
              Histórico: {item.historico.map((h) => `${STATUS_LABEL[h.status]} (${fmtDate(h.em)})`).join(' → ')}
            </p>
          )}
        </div>

        <p className="just">{v.justificativa}</p>
        <div className="bars">
          {COMP.map(([k, l]) => (
            <div className="bar" key={k}>
              <span>{l}</span>
              <div className="track"><div style={{ width: `${v.componentes?.[k] ?? 0}%` }} /></div>
              <span className="small">{v.componentes?.[k] ?? '—'}%</span>
            </div>
          ))}
        </div>

        <div className="boxes">
          <List title="⛔ Impedimentos" items={v.impedimentos} tone="bad" />
          <List title="⚠️ Possíveis impedimentos" items={v.possiveis_impedimentos} tone="warn" />
          <List title="✅ Requisitos atendidos" items={v.atendidos} tone="good" />
          <List title="◐ Parcialmente atendidos" items={v.parciais} />
          <List title="📚 Conhecimentos a desenvolver" items={v.lacunas} />
          <List title="🔎 Verificar manualmente" items={v.verificar} />
        </div>

        {v.tecnologias && Object.keys(v.tecnologias).length > 0 && (
          <div className="techs">
            {Object.entries(v.tecnologias).map(([t, s]) => (
              <span key={t} className={`tag sec-${s}`} title={SECAO[s]}>{t} <small>{SECAO[s]}</small></span>
            ))}
          </div>
        )}

        <dl className="facts">
          <dt>Bolsa-auxílio</dt><dd>{v.bolsa_auxilio || 'Não informada'}</dd>
          <dt>Carga horária</dt><dd>{v.carga_horaria || 'Não informada'}</dd>
          <dt>Inglês</dt><dd>{v.nivel_ingles || 'Não informado'}</dd>
          <dt>Cursos citados</dt><dd>{v.cursos_aceitos?.join(', ') || 'Não informados'}</dd>
          <dt>Publicação</dt><dd>{fmtDate(v.data_publicacao)}</dd>
          <dt>Prazo</dt><dd>{v.prazo_inscricao ? fmtDate(v.prazo_inscricao) : 'Não informado'}</dd>
          <dt>Descoberta</dt><dd>{fmtDateTime(v.data_coleta)}</dd>
          <dt>Última verificação</dt><dd>{fmtDateTime(v.ultima_verificacao)}</dd>
          <dt>Disponibilidade</dt><dd>{DISPONIBILIDADE[v.status_disponibilidade]}</dd>
          <dt>Fontes</dt><dd>{(v.fontes || [v.source]).map((f) => FONTES[f] || f).join(', ')}</dd>
        </dl>

        {v.descricao && (
          <div className="desc">
            <button className="ghost" onClick={() => setShowDesc(!showDesc)} aria-expanded={showDesc}>
              {showDesc ? 'Ocultar descrição' : 'Ver descrição completa'}
            </button>
            {showDesc && <pre>{v.descricao}</pre>}
          </div>
        )}
      </aside>
    </div>
  )
}
