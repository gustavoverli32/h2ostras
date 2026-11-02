# H2Ostras — Operação simples

Plataforma de demonstração para entregas de água em Rio das Ostras, com cinco áreas principais e formulários objetivos.

Visual formal com a paleta azul da H2Ostras, superfícies sem sombras fortes e barra lateral fixa. No computador, a barra retrai para ícones e memoriza a preferência neste navegador. No celular, o menu abre sobre o conteúdo, fecha pela seleção de uma área, pelo botão, pelo fundo ou por Escape, e mantém o foco do teclado dentro do menu enquanto aberto.

[Abrir plataforma pública](https://h2ostras-operacao.gustavoverli.chatgpt.site/#atendimento)

## Cinco áreas

- **Atendimento:** quadro com A atender, Entrega e Concluído. Confirmar a venda pede data e horário; concluir a entrega pede quem recebeu. O pagamento pode ser registrado na própria venda concluída.
- **Nova venda:** cliente, água, quantidade, valor, data, horário e endereço. Permite cadastrar o cliente durante a venda sem perder os campos preenchidos. Observações e detalhes são opcionais e ficam recolhidos.
- **Agenda:** calendário mensal com quantidade de entregas por dia, horários e acesso às vendas. Nova venda neste dia preenche a data selecionada. Reagendamentos atualizam o calendário; solicitações, orçamentos e cancelamentos não ocupam a agenda.
- **Despesas:** cadastro e edição de descrição, categoria, valor e data; total do mês e busca.
- **Clientes:** cadastro simples, nomes clicáveis e histórico de vendas, conversas, mudanças de etapa e pagamentos. Conversas e ocorrências manuais têm um X vermelho para exclusão, com confirmação e prévia do registro. Cancelar mantém o conteúdo. Eventos automáticos de vendas e pagamentos permanecem no histórico. Cuidados e observações ficam em uma seção recolhível.

As etapas anteriores são agrupadas visualmente, sem reescrever registros: Solicitação/Orçamento em A atender; Agendado/Em rota/Abastecendo em Entrega; Entregue em Concluído. Pagamento pendente permanece identificado. Cancelamentos continuam no histórico.

Os dados anteriores de frota, estoque, recorrências e configurações são preservados, embora esses módulos não façam parte da navegação inicial. A cópia JSON inclui todos os dados.

## Executar

Requer Node.js 22.13 ou superior (recomendado: Node.js 24).

```sh
npm ci
npm start
```

Abra http://127.0.0.1:4173. O servidor local usa SQLite e oferece uma tela explícita de simulação de login como cliente ou desenvolvedor. Essa simulação existe somente no servidor local; não é incluída na publicação. Abrir somente `index.html` não fornece a API de anotações.

```sh
npm run check
npm test
npm run build
```

Para verificar a exclusão de comentários e a preservação dos demais registros:

```sh
node scripts/test-customer-notes.cjs
```

O build gera `dist/server/index.js`, um Worker ESM com os arquivos da interface incorporados. A publicação usa Sites com o banco D1 no binding `DB`. O manifesto `.openai/hosting.json` deve conter o `project_id` do Site existente, `"d1": "DB"` e `"r2": null`, sem configuração `static`.

## Anotações e área Dev

O botão **Anotar** permite clicar em um elemento ou arrastar uma área, revisar seu recorte e escrever uma solicitação. O cliente escolhe Melhoria, Problema, Alteração ou Remoção. O envio requer login com ChatGPT; o rascunho é preservado durante o login. Somente o recorte selecionado e os dados revisados são enviados. A biblioteca html2canvas é servida pela própria plataforma.

As solicitações ficam no banco compartilhado, com autor, data, página, área marcada e situação. A [área Dev](https://h2ostras-operacao.gustavoverli.chatgpt.site/desenvolvedor) permite filtrar solicitações e alterar a situação entre Recebido, Em andamento e Concluído. Tanto os registros quanto as imagens exigem autorização no servidor.

Configure `DEVELOPER_EMAILS` nas variáveis de ambiente privadas do Site, com os e-mails autorizados separados por vírgulas. O Worker usa a identidade fornecida pelo login nativo da hospedagem. Não o publique em uma infraestrutura que aceite esses cabeçalhos de identidade diretamente do visitante sem autenticação. Nenhuma senha ou lista de contas reais é incorporada ao código público.

O esquema fica em `db/schema.js`. Após uma alteração de esquema, execute `npm run db:generate`, revise e versione os arquivos de `drizzle/`. O empacotamento do Sites inclui essas migrações para aplicação na publicação. O servidor local aplica as mesmas migrações em `.local-feedback.sqlite`, ignorado pelo Git. Registros de teste locais não vão para produção. Não altere migrações já aplicadas.

Há um limite de 20 solicitações por conta em 24 horas. O envio possui identificador para evitar duplicações em tentativas repetidas; atualizações concorrentes de situação exigem recarregar o registro. A ferramenta registra pedidos para revisão humana, sem executar automaticamente as alterações solicitadas.

## Arquivos

- `h2ostras-erp.html`: interface operacional em HTML, CSS e JavaScript.
- `index.html`: cópia sincronizada da interface.
- `feedback.js` e `feedback.css`: seleção visual e envio de anotações.
- `developer.html` e `developer.js`: caixa de solicitações do desenvolvedor.
- `worker/`: API autenticada e serviço dos arquivos da aplicação.
- `db/` e `drizzle/`: esquema e migrações do banco de anotações.
- `preview-server.cjs`: servidor local.
- `scripts/check.cjs`: verifica sintaxe e consistência das cópias.
- `scripts/build.cjs`: prepara o Worker e incorpora os arquivos da interface.

## Roteiro de apresentação

1. Abrir Nova venda e cadastrar um cliente pelo botão no formulário.
2. Preencher a venda e escolher Ainda em atendimento ou Venda confirmada.
3. Acompanhar a venda no quadro Atendimento; confirmar e concluir a entrega.
4. Registrar o recebimento e abrir o nome do cliente para conferir seu histórico.
5. Registrar uma despesa e conferir o total do mês.
6. Abrir Agenda, selecionar uma data e consultar as entregas ou iniciar uma venda nesse dia.

## Persistência e limites

Os cadastros operacionais são uma demonstração com dados fictícios iniciais e persistência no navegador (`localStorage`, chave `h2ostras.erp.v5`). Clientes, vendas, despesas e histórico não são sincronizados entre computadores nem incluídos no repositório. A simplificação mantém a mesma chave e preserva os cadastros existentes. Ao enviar uma anotação, o recorte e o texto revisados pelo usuário ficam no banco compartilhado de solicitações.

O preview operacional é público. Cada navegador tem seus próprios cadastros. O banco compartilhado e o login se aplicam às anotações e à área Dev. Não há emissão fiscal, GPS ou integração bancária.

Antes de limpar o armazenamento do navegador, use Baixar cópia dos dados no menu lateral em tela ampla. A importação de pedidos de versões anteriores continua preservando as chaves originais; registros incompletos precisam de revisão.

## Verificação da versão simplificada

Testada em navegador real no desktop e em 390 × 844: navegação nas quatro áreas, cadastro de cliente durante a venda com preservação dos campos, solicitação e confirmação, validação de data/horário e recebedor, conclusão e pagamento, perfil com conversa e histórico após recarregar, criação/edição de despesas, total mensal, busca e venda no celular. Sem erros de JavaScript observados.

A referência de estrutura foi o Econ GNV; seus dados operacionais e credenciais não foram copiados.

Agenda verificada no desktop e no celular: troca de mês, dia vazio, botão Hoje, data preenchida na nova venda, venda confirmada aparecendo no calendário, abertura/edição, reagendamento, persistência após recarregar e exclusão de solicitações. Sem erros de JavaScript observados.
