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

Requer Node.js 18 ou superior, sem dependências para instalar.

```sh
npm start
```

Abra http://127.0.0.1:4173. Também é possível abrir `index.html` diretamente no navegador.

```sh
npm run check
npm run build
```

Para verificar a exclusão de comentários e a preservação dos demais registros:

```sh
node scripts/test-customer-notes.cjs
```

O build gera `dist/index.html` para hospedagem estática.

## Arquivos

- `h2ostras-erp.html`: fonte autocontida em HTML, CSS e JavaScript.
- `index.html`: cópia sincronizada para abertura direta.
- `preview-server.cjs`: servidor local.
- `scripts/check.cjs`: verifica sintaxe e consistência das cópias.
- `scripts/build.cjs`: prepara os arquivos estáticos.

## Roteiro de apresentação

1. Abrir Nova venda e cadastrar um cliente pelo botão no formulário.
2. Preencher a venda e escolher Ainda em atendimento ou Venda confirmada.
3. Acompanhar a venda no quadro Atendimento; confirmar e concluir a entrega.
4. Registrar o recebimento e abrir o nome do cliente para conferir seu histórico.
5. Registrar uma despesa e conferir o total do mês.
6. Abrir Agenda, selecionar uma data e consultar as entregas ou iniciar uma venda nesse dia.

## Persistência e limites

Esta é uma demonstração com dados fictícios iniciais e persistência no navegador (`localStorage`, chave `h2ostras.erp.v5`). Os dados não são sincronizados entre computadores, enviados a um banco ou incluídos no repositório. A simplificação mantém a mesma chave e preserva os cadastros existentes.

O preview é público. Cada navegador tem seus próprios dados. Não há banco compartilhado, autenticação empresarial, emissão fiscal, GPS ou integração bancária.

Antes de limpar o armazenamento do navegador, use Baixar cópia dos dados no menu lateral em tela ampla. A importação de pedidos de versões anteriores continua preservando as chaves originais; registros incompletos precisam de revisão.

## Verificação da versão simplificada

Testada em navegador real no desktop e em 390 × 844: navegação nas quatro áreas, cadastro de cliente durante a venda com preservação dos campos, solicitação e confirmação, validação de data/horário e recebedor, conclusão e pagamento, perfil com conversa e histórico após recarregar, criação/edição de despesas, total mensal, busca e venda no celular. Sem erros de JavaScript observados.

A referência de estrutura foi o Econ GNV; seus dados operacionais e credenciais não foram copiados.

Agenda verificada no desktop e no celular: troca de mês, dia vazio, botão Hoje, data preenchida na nova venda, venda confirmada aparecendo no calendário, abertura/edição, reagendamento, persistência após recarregar e exclusão de solicitações. Sem erros de JavaScript observados.
