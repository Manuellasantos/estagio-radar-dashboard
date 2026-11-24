import { useState } from 'react'
import { REPO } from '../github'

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'

export default function TokenSetup({ onSave, error }) {
  const [token, setToken] = useState('')
  const [remember, setRemember] = useState(true)
  return (
    <main className="setup">
      <h1>📡 Estágio Radar</h1>
      <p>Este site é público, mas não contém dados. As vagas e candidaturas são lidas do repositório privado <code>{REPO}</code> com um token seu.</p>
      <ol>
        <li>Crie um <a href={TOKEN_URL} target="_blank" rel="noopener noreferrer">token fine-grained no GitHub</a>.</li>
        <li><b>Repository access</b>: <i>Only select repositories</i> → <code>estagio-radar</code>.</li>
        <li><b>Permissions → Repository → Contents</b>: <i>Read and write</i> (para salvar candidaturas).</li>
        <li>Gere o token e cole abaixo. Ele fica salvo apenas neste navegador.</li>
      </ol>
      {error && <div className="alert">{error}</div>}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (token.trim()) onSave(token.trim(), remember)
        }}
      >
        <input type="password" autoComplete="off" placeholder="github_pat_…" value={token} onChange={(e) => setToken(e.target.value)} aria-label="Token do GitHub" />
        <label className="small"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Lembrar neste dispositivo</label>
        <button type="submit">Entrar</button>
      </form>
    </main>
  )
}
