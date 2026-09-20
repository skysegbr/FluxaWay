# Plano — corrigir o FluxaWay antes do vídeo 2

Este arquivo é para continuar o trabalho **dentro do repositório do FluxaWay**, em outra sessão.
Ele não depende de nenhuma conversa anterior: tudo que é preciso saber está aqui.

## 🤖 Para retomar (cole na nova sessão, já dentro do repositório do FluxaWay)

```text
Leia /home/danilo/proj_js/fluxa_tutorial/PLANO-FLUXAWAY.md inteiro e o AGENTS.md deste repositório.
Depois rode o conferidor do plano contra o dist/ local e me mostre a saída.
Comece pelo item P0. Um item por vez: reproduzir, corrigir na fonte, testar, atualizar a spec.
```

---

## 🧭 De onde veio isto

- Estamos fazendo uma série de vídeos sobre o FluxaWay. O vídeo 2 mostra uma IA montando uma
  landing page sozinha, só com a `docs/AI_SPEC.md` e um prompt.
- Para testar o prompt, uma IA sem contexto recebeu **só a spec pública** e montou a página.
- A página saiu boa. Mas onde a spec e o comportamento real não batiam, a IA travou e anotou.
- Quem assistir ao vídeo vai rodar a própria IA e pode cair nos mesmos pontos. Por isso vale
  corrigir **antes** de publicar.

Nenhum achado é de segurança. 🔒 A parte de segurança passou em tudo: nenhum `innerHTML`, todo
`href`/`src` com `safeUrl()`, e o ataque `<img onerror>` no formulário apareceu como texto.

## 📁 Onde está cada coisa (caminhos absolutos)

| Caminho | O que é |
|---|---|
| `/home/danilo/proj_js/fluxa_tutorial/floricultura/repro/conferir_achados.py` | **conferidor automático** dos achados. Rodar antes e depois de cada correção |
| `/home/danilo/proj_js/fluxa_tutorial/floricultura/repro/achados.html` | as reproduções mínimas que o conferidor abre |
| `/home/danilo/proj_js/fluxa_tutorial/floricultura/NOTAS-DO-TESTE.md` | relato completo do teste |
| `/home/danilo/proj_js/fluxa_tutorial/floricultura/referencia/` | a página que a IA montou (mostra os contornos que ela precisou fazer) |
| `/home/danilo/proj_js/fluxa_tutorial/floricultura/inicial/PROMPT.md` | o prompt do vídeo 2 |
| `/home/danilo/proj_js/fluxa_tutorial/ROTEIRO-2.md` | o roteiro do vídeo 2 |

## ▶️ Como rodar o conferidor

```bash
# 1. no repositório do FluxaWay, suba o servidor dele (veja a porta que ele informa)
python server.py

# 2. em outro terminal — troque 8000 pela porta informada
python3 /home/danilo/proj_js/fluxa_tutorial/floricultura/repro/conferir_achados.py --base http://localhost:8000/dist
```

Sem `--base` ele testa o CDN `@main` (o que o público usa hoje). Precisa de `playwright` para
Python, que o repositório já usa. **Sem Node**, como manda o `AGENTS.md`.

Saída de hoje, contra o CDN `@main` — é a linha de base:

```text
A1-light  ok        botão contained: texto branco sobre rgb(15, 118, 110) = 5.47:1
A1-dark   PROBLEMA  botão contained: texto branco sobre rgb(45, 212, 191) = 1.86:1 (AA pede 4.5:1)
A2        PROBLEMA  Tabs: 3 abas, topos [304, 345, 386], .m-tabs flex-direction=column, tem .m-tabs-list=False
A3        PROBLEMA  Chip com onClick: <span> tabIndex=-1 role=None
A4        PROBLEMA  Card sem `padded`: padding=16px
A5        PROBLEMA  aria-labels gerados pelo framework: ['Open menu', 'Switch to dark theme', 'required']
A6        PROBLEMA  Avatar: role/aria-label = ['img', 'Ana Lima']
A7        PROBLEMA  Button com href renderiza <button>
B1        PROBLEMA  useForm devolve 18 chaves (a spec documenta 5)
A8        PROBLEMA  useForm: 5 de 5 cliques válidos em Enviar NÃO enviaram; o botão se moveu -25 px
```

**Meta:** cada linha virar `ok` — ou virar uma decisão escrita ("é assim de propósito") na spec.

## ⚠️ Regras do repositório (resumo do `AGENTS.md` — leia o original)

- **Sem Node.** Nada de `node`, `npm`, `npx`. Ferramentas em Python.
- **Nunca editar arquivo gerado em `dist/`.** Os `*.min.*` saem de `python scripts/minify.py`; os
  `fluxaway-ui-*.css` por categoria saem de `python scripts/split_css.py` (split primeiro, minify
  depois). Descubra no `AGENTS.md` qual é a **fonte** de cada arquivo antes de mexer.
- Validar sempre servido por HTTP e no navegador: `python scripts/validate_fluxaway.py` e
  `python scripts/run_browser_tests.py`.
- Mudou comportamento? Atualize `docs/AI_SPEC.md`, o site de docs (`examples/docs-site/`) e o `CHANGELOG.md`.

---

# Os itens, por prioridade

Cada item segue o mesmo caminho: **reproduzir → corrigir na fonte → teste novo em `tests/` →
spec → conferidor em `ok`**.

## 🔴 P0 — `useForm`: o erro "velho" faz o clique em Enviar se perder  (A8)

- **O que acontece:** a pessoa preenche tudo certo, clica em "Enviar" e nada acontece.
- **Reproduzido:** 5 de 5 vezes, com o padrão que a própria spec ensina (`...field('nome')`).
- **Passo a passo:** digitar o nome → Tab → digitar uma mensagem válida → clicar em Enviar.
- **Por quê:**
  1. Depois que um campo perde o foco, o campo seguinte mostra erro **desde a primeira tecla**.
  2. O erro **continua na tela mesmo com o valor já válido**. Só some no blur.
  3. O `mousedown` no botão causa esse blur. A linha de erro some. O botão sobe 25 px.
  4. O `mouseup` cai fora do botão. O navegador não dispara o `click`.
- **Controles (provam a causa):** dar Tab antes de clicar → envia. Enter no campo → envia.
- **Caminhos de correção (decisão do autor):**
  - revalidar o campo a cada `input` depois que ele foi tocado, para o erro sumir assim que o valor fica válido; e/ou
  - reservar a altura da linha de ajuda/erro nos campos, para o layout não pular.
- **Spec:** dizer **quando** `field().error` aparece e quando some.
- **Pronto quando:** A8 = `ok` (0 de 5 perdidos, deslocamento 0 px) + teste novo cobrindo o caso.

## 🟠 P1 — Botão `contained` ilegível no tema escuro  (A1)

- **O que acontece:** texto branco sobre a cor primária clara do tema escuro. Contraste 1,86:1.
- **Também relatado:** paleta `rose` no escuro = 2,69:1. Provável em todas as paletas.
- **Caminho:** um token para "texto sobre a primária" (ex.: `--m-on-primary`) com valor por tema,
  no lugar do branco fixo.
- **Pronto quando:** A1-dark = `ok` + um teste que percorre **todas as paletas × claro/escuro** e
  exige 4,5:1. Conferir também `outlined`/`text`, `Badge`, `Chip`, `FAB`.

## 🟠 P1 — `Tabs` sai na vertical  (A2)

- **O que acontece:** as abas ficam uma embaixo da outra.
- **Por quê:** o CSS tem `.m-tabs { flex-direction: column }` e estiliza um `.m-tabs-list`. O
  componente põe os botões `.m-tab` direto dentro de `.m-tabs`, sem esse wrapper.
- **Caminho:** o componente criar o `.m-tabs-list` (com `role="tablist"`), **ou** o CSS deixar de
  depender dele. Ver como a página de Tabs do site de docs renderiza — se lá está certo, a
  diferença mostra qual dos dois lados está desatualizado.
- **Pronto quando:** A2 = `ok` (todas as abas com o mesmo `top`).

## 🟡 P2 — Textos de acessibilidade fixos em inglês  (A5)

- **O que acontece:** página em português anuncia "Open menu", "Switch to dark theme", "required".
- **Caminho:** props para trocar (ex.: `menuLabel`/`closeLabel` no `Navbar`, `labels` no
  `ThemeToggle`, rótulo do marcador de obrigatório) **ou** um padrão global de idioma.
- **Spec:** documentar como traduzir. Procurar outros textos fixos (Dialog "Close", Pagination…).
- **Pronto quando:** A5 = `ok` usando as props novas na `achados.html`.

## 🟡 P2 — `Chip` clicável não funciona pelo teclado  (A3)

- **O que acontece:** com `onClick`, vira `<span>` sem `tabindex` nem `role`.
- **Caminho:** com `onClick`, renderizar `<button>` (ou `role="button"` + `tabindex="0"` + Enter/Espaço).
- **Spec:** a seção 9 apresenta o Chip como "toggleable tag"; dizer qual componente usar para filtro.
- **Pronto quando:** A3 = `ok`.

## 🟡 P2 — `Button` não tem modo link  (A7)

- **O que acontece:** `h(Button, { href })` continua sendo `<button>`. Para ter um link com cara
  de botão, a IA precisou descobrir as classes `m-button m-button-contained` inspecionando o DOM.
- **Caminho:** `href` → renderizar `<a>`; **ou** documentar as classes como API pública.
- 🔒 **Atenção:** o FluxaWay não sanitiza `href` sozinho, de propósito. Se o `Button` aceitar
  `href`, a spec precisa repetir a regra: endereço de fora passa por `safeUrl()`.
- **Pronto quando:** A7 = `ok`, ou a decisão estiver escrita na spec.

## 🟢 P3 — Menores

| Item | O que acontece | Caminho |
|---|---|---|
| A4 · `Card` | 16 px de padding mesmo sem `padded`; a spec dá a entender que é o `padded` que adiciona | alinhar código e spec — decidir qual dos dois é o certo |
| A6 · `Avatar` | sai com `role="img"` + `aria-label` do nome; com o nome escrito ao lado, o leitor de tela fala duas vezes | prop `decorative`, ou nota na spec |
| `Navbar` no celular | **não reproduzi — só relato.** O menu abre dentro do fluxo; com cabeçalho `sticky`, tocar num link fecha o menu, a página encolhe no meio da rolagem e o título para 68 px acima | reproduzir primeiro; depois menu sobreposto (overlay) ou nota na spec |

## 📖 Correções só na spec (`docs/AI_SPEC.md`)

| # | O que falta | Onde |
|---|---|---|
| B1 | `useForm` devolve 18 chaves; a spec mostra 5. Faltam `reset`, `touched`, `setValues`, `isValid`, `dirty`, `submitCount`, `validateForm`… Para limpar o formulário, a IA só achou o `reset` inspecionando o objeto | seção 6 |
| B2 | Todos os exemplos importam de `/dist/...`. Falta: como importar do **CDN em projeto de vários arquivos**, e que a URL tem que ser **idêntica em todos**, senão o framework carrega duas vezes | seções 2 e 14 |
| B3 | O `index.html` do exemplo não carrega o `fluxaway-ui.css`, e o CSS do exemplo usa cores próprias (`--a-*`) em vez de `--m-*` | seção 14 |
| B4 | **Regras que brigam:** a seção 15 diz "6+ componentes → agrupar por domínio"; a seção 12 diz "flat first" e "pasta só com 3+ arquivos do mesmo domínio". Numa landing page de 8 seções não dá para cumprir as duas. Escolher uma redação só | seções 12 e 15 |
| B5 | Não existe lugar oficial para função auxiliar pequena (montar URL, formatar preço): sem `utils/`, um componente por arquivo, `app.js` sem lógica | seção 12 |
| B6 | SVG via `h()` e o nome dos atributos (`stroke-width`, `aria-hidden`) | seção 8 |
| B7 | Repasse de `className` nos componentes, e o `Navbar` repassar props desconhecidas para o `<nav>` | seção 9 |
| B8 | A seção 3 pede Chromium + Firefox + WebKit. Dizer o que vale para quem está fazendo um **app** (um navegador basta?) | seção 3 |

Depois de mexer na spec, atualizar as cópias:

- `.claude/skills/fluxaway-expert/SKILL.md` (no repositório);
- `~/.claude/skills/fluxaway/references/AI_SPEC.md` — está **desatualizada**: 2.960 linhas contra 3.390 da pública.

---

## ✅ Depois das correções

1. Conferidor contra o `dist/` local: tudo `ok`.
2. `python scripts/validate_fluxaway.py` e `python scripts/run_browser_tests.py` passando.
3. `CHANGELOG.md` atualizado. Publicar.
4. O CDN `@main` tem cache. Forçar com `https://purge.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/<arquivo>`
   e rodar o conferidor **sem** `--base`, para confirmar que o público já recebe a correção.
5. Voltar para `/home/danilo/proj_js/fluxa_tutorial`:
   - rodar de novo o teste da floricultura com o `PROMPT.md` atual (ele foi esclarecido depois do
     teste e **ainda não rodou de ponta a ponta**);
   - atualizar `floricultura/referencia/` e o `ROTEIRO-2.md` — o passo 4 cita as três falhas que a
     IA achou; se o framework as corrigir, essa fala muda;
   - gerar o vídeo 2.

## 📋 Ordem sugerida

- [ ] Rodar o conferidor contra o `dist/` local e guardar a saída
- [ ] P0 · `useForm` — clique perdido
- [ ] P1 · contraste do botão no tema escuro (todas as paletas)
- [ ] P1 · `Tabs` na vertical
- [ ] P2 · textos em inglês · `Chip` · `Button` com `href`
- [ ] P3 · `Card` · `Avatar` · reproduzir o `Navbar` no celular
- [ ] Spec: B1 a B8, e sincronizar as cópias da spec
- [ ] Publicar, limpar o cache do CDN, conferir sem `--base`
- [ ] Voltar ao tutorial: retestar o prompt, atualizar a referência e o roteiro, gerar o vídeo 2
