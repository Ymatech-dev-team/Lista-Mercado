# Requisitos — Lista de Mercado (MVP)

> Documento vivo. Fonte da verdade do **O QUÊ**. O código é gerado contra ele.
> Validado por painel adversarial (arquiteto + jornada + produto) em 2026-08-31.

## Contexto

Pessoas montam lista de mercado no papel, no bloco de notas ou na cabeça — e esquecem o que
compram sempre. Este app resolve isso: cada pessoa monta suas listas, **usa a lista dentro do
mercado pelo celular** (marcando o que já pegou), e o histórico do que ela compra alimenta uma
**Home** que mostra os produtos que ela mais consome — pra montar a próxima lista em segundos.

O uso principal é **no celular, dentro do mercado, com uma mão e net oscilando**. Isso não é
detalhe de UX: é o requisito que dita a arquitetura de estado (ver RNF-Resiliência).

## Personas / Histórias de usuário

- **US1.** Como usuário, quero **criar uma conta e logar**, para que minhas listas fiquem salvas só pra mim.
- **US2.** Como usuário, quero **montar uma lista de compras** com os itens que preciso, para não esquecer nada.
- **US3.** Como usuário no mercado, quero **marcar itens como "peguei"** com um toque, para acompanhar o que já está no carrinho — mesmo com internet ruim.
- **US4.** Como usuário, quero **concluir a lista** quando terminar a compra, para ela virar histórico.
- **US5.** Como usuário, quero **ver meu histórico de listas**, para lembrar do que comprei antes.
- **US6.** Como usuário, quero uma **Home que mostre o que eu mais compro**, para montar a próxima lista rapidinho.

## Escopo

### Dentro do MVP (release 1)
Conta (cadastro/login/logout/sessão **+ recuperação de senha**) · 1 lista ativa por vez · adicionar/marcar/remover itens ·
concluir lista → histórico · ver histórico (leitura) · Home com "mais consumidos" + 1 ação rápida ·
produto canônico por usuário (normalização de nome).

### Fora de escopo (vai pra Fase 2 — decisão consciente, não esquecimento)
renomear lista · **múltiplas** listas ativas simultâneas ·
unidade de medida (kg/L/un) · reaproveitar lista inteira do histórico · drag-para-reordenar ·
categorias/seções de produto · compartilhar lista entre usuários · colaboração em tempo real ·
offline real / service worker · sincronização bidirecional multi-dispositivo · preços/orçamento.

> **Por que cortar:** cada item acima é uma fonte de bug e de meses a mais. O MVP entrega o ciclo
> completo (auth → CRUD → agregação → deploy) e ensina o processo inteiro sem afogar o projeto.
> O **modelo de dados** do MVP é desenhado pra não fechar a porta pra nenhum deles (ver design.md).

---

## Requisitos Funcionais (EARS)

### RF1 — Conta e sessão
- O SISTEMA DEVE autenticar cada usuário por **e-mail e senha**, com o fluxo (cadastro, login, logout, sessão, recuperação) **construído pelo próprio time**, apoiado em **primitivas auditadas** (biblioteca de hashing bcrypt/argon2 e gerador aleatório seguro do sistema) — **nunca** inventando algoritmo de hash ou de token próprio.
- O SISTEMA DEVE armazenar a senha **apenas como hash** (bcrypt/argon2 com custo adequado), jamais em texto puro ou de forma reversível.
- QUANDO o usuário se cadastra com um e-mail já existente O SISTEMA DEVE rejeitar sem criar segundo registro (e-mail **único** garantido no banco, não só no front).
- QUANDO o usuário faz login com credenciais inválidas O SISTEMA DEVE responder com mensagem genérica ("E-mail ou senha inválidos"), sem revelar qual dos dois errou, usando comparação de tempo constante.
- QUANDO o usuário faz logout O SISTEMA DEVE encerrar a sessão no servidor e limpar todo estado de listas em memória e no armazenamento local do dispositivo (celular compartilhado em família é comum).
- ENQUANTO houver sessão válida em um dispositivo O SISTEMA DEVE permitir sessão simultânea em outro dispositivo (montar no PC, usar no celular) sem invalidar a anterior.
- **Critério de aceite:** senha nunca aparece em texto no banco; cadastro cria 1 usuário; e-mail duplicado é rejeitado; login errado dá mensagem genérica; logout encerra a sessão no servidor; login no celular não desloga o PC.

### RF1b — Recuperação de senha
- QUANDO o usuário solicita recuperação informando um e-mail O SISTEMA DEVE enviar um link de redefinição contendo um token **de uso único e com expiração curta** (ex.: 30–60 min), guardado no banco **apenas como hash**.
- SE o e-mail informado não existir ENTÃO O SISTEMA DEVE responder com a **mesma** mensagem de sucesso (não revelar se o e-mail está cadastrado — anti-enumeração).
- QUANDO o token de redefinição é usado com sucesso O SISTEMA DEVE trocar a senha (novo hash), invalidar o token imediatamente e encerrar as sessões ativas do usuário.
- SE o token estiver expirado, já usado ou inválido ENTÃO O SISTEMA DEVE recusar e orientar a solicitar um novo.
- **Critério de aceite:** link expira e é de uso único; e-mail inexistente não vaza; após o reset, token antigo não funciona e sessões antigas caem.

### RF2 — Criar e gerenciar a lista ativa
- QUANDO o usuário cria uma lista O SISTEMA DEVE persisti-la no servidor **imediatamente**, de modo que um F5 ou fechar-e-voltar recupere a lista.
- QUANDO o usuário cria uma lista sob cliques repetidos (duplo clique) O SISTEMA DEVE gerar **apenas uma** lista (idempotência).
- O SISTEMA DEVE manter **no máximo uma lista ativa por usuário** no MVP; concluir a ativa libera a criação de uma nova.
- QUANDO o usuário exclui uma lista O SISTEMA DEVE pedir **confirmação** antes de remover (ação destrutiva).
- **Critério de aceite:** F5 no meio da montagem mantém a lista; duplo clique em "criar" gera 1 lista; excluir pede confirmação.

### RF3 — Itens da lista
- QUANDO o usuário adiciona um item O SISTEMA DEVE associá-lo a um **produto canônico do próprio usuário**, criando o produto se ainda não existir (chave = nome normalizado: trim + minúsculas + espaços colapsados + acento-insensível).
- QUANDO o usuário adiciona um item cujo nome normalizado **já existe na lista** O SISTEMA DEVE **somar a quantidade** ao item existente em vez de criar duplicata, com feedback ("quantidade atualizada").
- SE o nome do item for vazio após trim ENTÃO O SISTEMA DEVE bloquear a inclusão e sinalizar o campo.
- SE a quantidade for menor que 1 ou não numérica ENTÃO O SISTEMA DEVE normalizar para 1 antes de persistir.
- SE o nome do item exceder 80 caracteres ENTÃO O SISTEMA DEVE rejeitar/truncar (protege layout no celular e o banco).
- QUANDO o usuário remove um item O SISTEMA DEVE removê-lo apenas da lista, **sem** apagar o produto canônico (histórico e ranking dependem dele).
- **Critério de aceite:** "Leite" + "leite " viram 1 item com quantidade somada; nome vazio não entra; quantidade 0 vira 1; remover item não some com o produto.

### RF4 — Usar a lista no mercado (marcar itens) — zona crítica
- QUANDO o usuário marca um item como "peguei" O SISTEMA DEVE atualizar o estado visual **imediatamente (otimista)**, antes da confirmação do servidor, sem recarregar a página.
- A marcação de um item DEVE ser **idempotente**: enviar "pego = verdadeiro" repetidas vezes NÃO DEVE produzir estado diferente de enviá-la uma vez (estado por item, não "toggle").
- SE a requisição de marcação falhar por rede ENTÃO O SISTEMA DEVE manter o estado localmente e reenviar quando a conexão voltar, sem exigir novo clique.
- QUANDO o usuário reabre o app com a lista ativa O SISTEMA DEVE restaurar o progresso dos itens marcados (a partir do servidor e/ou armazenamento local).
- **Critério de aceite:** marcar pinta o check em ≤ 200 ms sem esperar o servidor; marcar 3x = mesmo estado que 1x; net cai e volta → marcação persiste sem reclique; fechar e reabrir mantém o progresso.

### RF5 — Concluir lista → histórico
- QUANDO o usuário conclui uma lista O SISTEMA DEVE torná-la **imutável** no histórico e impedir segunda conclusão do mesmo registro (idempotente).
- QUANDO uma lista é concluída O SISTEMA DEVE registrar **quais itens foram efetivamente marcados como comprados**, separando-os dos não comprados.
- SE o usuário tentar concluir uma lista vazia ENTÃO O SISTEMA DEVE avisar/bloquear.
- **Critério de aceite:** concluir 2x gera 1 registro; itens comprados ficam distinguíveis dos não comprados; lista vazia não conclui.

### RF6 — Histórico (leitura)
- O SISTEMA DEVE exibir ao usuário a lista das suas listas concluídas, da mais recente para a mais antiga.
- QUANDO o usuário abre uma lista concluída O SISTEMA DEVE mostrá-la em **modo leitura**; o registro histórico é imutável.
- SE o usuário não possui listas concluídas ENTÃO O SISTEMA DEVE exibir um **estado vazio explicativo**, não uma área em branco.
- **Critério de aceite:** histórico ordenado por data desc; abrir uma antiga não permite editá-la; histórico vazio mostra mensagem/CTA.

### RF7 — Home: mais consumidos + ação rápida
- QUANDO o usuário abre a Home O SISTEMA DEVE exibir os até **10 produtos** com maior número de **listas concluídas distintas** em que apareceram **marcados como comprados** nos **últimos 90 dias**, apenas do próprio usuário, ordenados do maior para o menor (desempate: mais recente primeiro).
- O ranking de "mais consumidos" DEVE contar um produto **apenas no momento da conclusão da lista** e **apenas** para itens marcados como comprados (consumo real, não intenção).
- QUANDO o usuário aciona a ação rápida em um produto mais consumido O SISTEMA DEVE adicioná-lo à lista ativa (criando uma lista ativa se não houver), gerando **uma única** adição sob cliques repetidos.
- SE o usuário tem menos de ~3 listas concluídas (dado insuficiente) ENTÃO O SISTEMA DEVE exibir um estado vazio com CTA ("Conclua sua primeira lista para ver o que você mais compra"), nunca um gráfico/área quebrada.
- **Critério de aceite:** ranking bate com a definição (frequência, comprados, 90 dias, top 10, por usuário); Home de usuário novo mostra empty state; ação rápida adiciona 1 item à lista ativa.

---

## Requisitos Não-Funcionais (RNF)

### RNF-Segurança / Isolamento por usuário
- QUANDO um usuário autenticado requisita uma lista, item, produto ou histórico cujo dono **não é ele** O SISTEMA DEVE negar o acesso respondendo como recurso inexistente (404), sem vazar a existência do dado (anti-IDOR).
- O SISTEMA DEVE derivar o `user_id` **sempre da sessão no servidor**, nunca de um parâmetro enviado pelo cliente.
- O SISTEMA DEVE tratar todo nome digitado como input não confiável: escapar na renderização (anti-XSS) e usar queries parametrizadas (anti-SQL injection).
- O SISTEMA DEVE proteger login e recuperação de senha contra **força bruta** (rate limiting por IP/conta e/ou atraso progressivo).
- O SISTEMA DEVE guardar a sessão em cookie **httpOnly, Secure, SameSite**, com expiração e renovação controladas no servidor.
- QUANDO uma requisição altera estado com sessão baseada em cookie O SISTEMA DEVE protegê-la contra **CSRF**.
- **Critério de aceite:** trocar o id na URL/requisição para um recurso de outro usuário retorna 404; nome de item com `<script>` não executa.

### RNF-Privacidade (LGPD) — obrigatório desde o dia 1
- QUANDO o usuário se cadastra O SISTEMA DEVE apresentar um aviso de privacidade e registrar o consentimento (é dado pessoal: e-mail + hábitos de consumo).
- O SISTEMA DEVE oferecer um caminho para **excluir a conta e apagar os dados** do usuário (direito do titular), ainda que operacionalmente simples.
- **Critério de aceite:** cadastro exige aceite; existe fluxo (mesmo manual) de exclusão de conta.

### RNF-Resiliência (net ruim é o caso normal)
- O SISTEMA DEVE preservar o trabalho não salvo quando a sessão expirar: SE o token expirar com edição não persistida na tela ENTÃO O SISTEMA DEVE preservar o rascunho localmente e reautenticar sem descartar o que foi digitado.
- O SISTEMA DEVE degradar graciosamente sob rede instável (RF4): estado otimista + reenvio automático; nada de tela travada "salvando...".
- **Critério de aceite:** sessão expira durante montagem → nada é perdido; ações sob falha de rede se recuperam sozinhas.

### RNF-Experiência (fácil, interativo, sem cara de IA)
- O SISTEMA DEVE ter uma **identidade visual própria** (paleta, tipografia e tom definidos como design-system), evitando a aparência de template genérico. *(Direção visual e mockups são resolvidos e aprovados na Fase 2 via builder.)*
- QUANDO o usuário executa a ação principal (marcar item) O SISTEMA DEVE dar **feedback visual imediato** (≤ 200 ms), sem recarregar a página.
- Toda tela com possibilidade de vazio (lista sem itens, histórico vazio, Home sem dados) DEVE ter um **estado vazio** desenhado e claro.
- **Critério de aceite:** revisão de design aprova a identidade como "não-template"; marcar item responde na hora; nenhuma tela aparece "quebrada" quando vazia.

### RNF-Acessibilidade & Idioma
- O SISTEMA DEVE atender acessibilidade básica: contraste AA, alvos de toque ≥ 44px, foco visível, labels em todos os inputs.
- O SISTEMA DEVE usar **pt-BR** como único idioma do MVP (sem i18n prematuro).
- Toda mensagem de erro visível DEVE ser em PT-BR, clara e acionável ("E-mail ou senha inválidos", não "401").

---

## Riscos / Decisões que precisam de aprovação do JP

> Decididas com o JP em 2026-08-31.

- **D1 — Método e construção da auth.** ✅ **RESOLVIDO: e-mail e senha, com fluxo construído do zero** (cadastro, login, logout, sessão e **recuperação de senha** — tudo dentro do escopo). Regra de segurança travada: o hashing de senha e a geração de tokens usam **primitivas auditadas** (bcrypt/argon2 + RNG seguro); não se inventa algoritmo criptográfico. Envio de e-mail de reset exige um provedor (ex.: Resend) — a definir na Fase 2.
- **D2 — Corte de MVP.** ✅ **APROVADO.** Recuperar senha, renomear lista, múltiplas listas ativas, unidade de medida e reaproveitar lista inteira vão pra **Fase 2**.
- **D3 — Uma lista ativa por vez (MVP).** ✅ **APROVADO.** O banco já fica pronto pra várias.
- **D4 — Definição de "mais consumido"** (RF7): frequência em listas concluídas distintas, itens comprados, últimos 90 dias, top 10. ✅ **APROVADO.**
- **D5 — Nome do projeto.** ✅ **"Meu Mercado".**

## Rastreabilidade (para o /analyze de consistência na Fase 4)
Todo RF/RNF acima deve ter cobertura em `design.md` (como) e `tasks.md` (teste que prova). Requisito sem
cobertura = furo a reportar.
