import { useState } from 'react'
import { DISPONIBILIDADE, MODALIDADE, STATUS_LABEL, daysAgo, fmtDate, local, scoreClass, statusOf } from '../utils'

const PAGE = 30

export default function JobList({ vagas, cand, onOpen, onUpdate }) {
  const [limit, setLimit] = useState(PAGE)
  if (!vagas.length) return <p className="empty">Nenhuma vaga com esses filtros.</p>
  return (
    <>
      <ul className="jobs">
        {vagas.slice(0, limit).map((v) => {
          const st = statusOf(cand, v.uid)
          const fav = cand[v.uid]?.favorito
          return (
            <li key={v.uid} className={`job ${st === 'nao_visualizada' ? 'unseen' : ''}`}>
              <button className={`score ${scoreClass(v.score)}`} onClick={() => onOpen(v.uid)} aria-label={`Compatibilidade ${v.score}`}>
                {v.score}
              </button>
              <div className="job-body" onClick={() => onOpen(v.uid)}>
                <h3>
                  {daysAgo(v.data_coleta) <= 1 && <span className="tag new">Nova</span>}
                  {v.titulo}
                </h3>
                <p className="muted">
                  {v.empresa || 'Empresa não informada'} · {local(v)} · {MODALIDADE[v.modalidade] || 'Modalidade n/i'}
                </p>
                <p className="small muted">
                  Publicada {fmtDate(v.data_publicacao)} · {v.area}
                  {v.status_disponibilidade !== 'disponivel' && ` · ${DISPONIBILIDADE[v.status_disponibilidade]}`}
                  {(v.impedimentos?.length || v.possiveis_impedimentos?.length) ? ' · ⚠️ verificar elegibilidade' : ''}
                </p>
              </div>
              <div className="job-side">
                <button className={`star ${fav ? 'on' : ''}`} onClick={() => onUpdate(v.uid, { favorito: !fav })}
                  aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'} aria-pressed={!!fav}>
                  {fav ? '★' : '☆'}
                </button>
                <span className={`chip st-${st}`}>{STATUS_LABEL[st]}</span>
              </div>
            </li>
          )
        })}
      </ul>
      {limit < vagas.length && (
        <button className="more" onClick={() => setLimit(limit + PAGE)}>Mostrar mais ({vagas.length - limit})</button>
      )}
    </>
  )
}
