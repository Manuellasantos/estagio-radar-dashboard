# Estágio Radar — Dashboard

Interface web (React + Vite) do [Estágio Radar](https://github.com/Manuellasantos), um agente que busca e classifica vagas de estágio.

**Este repositório e o site publicado não contêm dados.** O dashboard lê as vagas e grava o
acompanhamento de candidaturas diretamente no repositório privado do agente, usando um token
fine-grained do próprio usuário (acesso restrito a esse repositório), guardado apenas no navegador.

## Funcionalidades
- Indicadores: total, disponíveis, novas do dia/semana, alta compatibilidade, salvas, candidaturas, entrevistas, última execução.
- Busca, filtros (área, empresa, local, modalidade, plataforma, compatibilidade, data, tecnologia, bolsa, status) e ordenação.
- Detalhe com justificativa da pontuação, requisitos atendidos/parciais, lacunas, impedimentos e itens a verificar.
- Favoritos, descarte, status de candidatura (11 etapas), observações e histórico — sincronizados entre dispositivos.
- Exportação CSV. Layout responsivo, tema claro/escuro.

## Desenvolvimento
```bash
npm install
LOCAL_DATA=../estagio-radar/data npm run dev   # usa dados locais, sem token
npm run build
```
Publicado via GitHub Actions no GitHub Pages.
