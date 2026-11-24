import { fmtDateTime } from '../utils'

const STATUS_RUN = { ok: 'OK', parcial: 'Parcial', falha: 'Falha', rescore: 'Recálculo' }

export default function Kpis({ k }) {
  const u = k.ultima
  const items = [
    ['Vagas encontradas', k.total],
    ['Disponíveis', k.disponiveis],
    ['Novas hoje', k.novasHoje],
    ['Novas na semana', k.novasSemana],
    ['Alta compatibilidade', k.altas],
    ['Salvas', k.salvas],
    ['Candidaturas', k.candidaturas],
    ['Entrevistas', k.entrevistas],
  ]
  return (
    <section className="kpis" aria-label="Indicadores">
      {items.map(([label, value]) => (
        <div className="kpi" key={label}>
          <span className="kpi-value">{value}</span>
          <span className="kpi-label">{label}</span>
        </div>
      ))}
      <div className="kpi kpi-run">
        <span className={`run-dot run-${u?.status || 'na'}`} aria-hidden="true" />
        <div>
          <span className="kpi-label">Última execução</span>
          <strong>{fmtDateTime(u?.fim || u?.inicio)}</strong>
          <span className="small muted">
            {STATUS_RUN[u?.status] || '—'}
            {u ? ` · ${u.novas} novas` : ''}
          </span>
        </div>
      </div>
    </section>
  )
}
