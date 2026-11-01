# H2Ostras — Gestão de abastecimentos

Primeira versão funcional para apresentação do sistema de entregas de água da H2Ostras, adaptada à operação de caminhões-pipa em Rio das Ostras e região.

[Preview hospedado](https://h2ostras-operacao.gustavoverli.chatgpt.site/#inicio) · Acesso privado pela conta autorizada do ChatGPT.

## Executar

Requer Node.js 18 ou superior. Não há dependências para instalar.

```sh
npm start
```

Abra http://127.0.0.1:4173. Também é possível abrir `index.html` diretamente no navegador. Para validar e gerar os arquivos estáticos:

```sh
npm run check
npm run build
```

A saída fica em `dist/index.html`. Não é necessário servidor de aplicação para hospedar essa saída.

## Estrutura

- `h2ostras-erp.html`: fonte principal autocontida, com HTML, CSS e JavaScript.
- `index.html`: cópia da versão atual para abertura direta.
- `preview-server.cjs`: servidor de desenvolvimento restrito ao computador local.
- `scripts/build.cjs`: gera a saída estática.
- `scripts/check.cjs`: verifica sintaxe e consistência das cópias.

Após editar a fonte principal, atualize também `index.html` antes de enviar alterações. O build sempre utiliza `h2ostras-erp.html`.

## Módulos

- **Início:** indicadores calculados e calendário mensal de entregas, com seleção do dia e acesso à agenda.
- **Atendimento:** Solicitação → Orçamento → Agendado → Em rota → Abastecendo → Entregue → Encerrado.
- **Clientes:** nomes clicáveis, cadastro, histórico completo registrado, linha do tempo, recebimentos, contatos, ocorrências e acompanhamento manual de risco.
- **Ordens e agenda:** criação, edição, busca, filtros, endereço, volume, tipo de água e atribuição da frota.
- **Frota:** motorista, capacidade e disponibilidade, com validação de capacidade e conflito de rotas ativas.
- **Estoque:** materiais, saldos e níveis mínimos.
- **Financeiro:** recebimentos parciais ou integrais, despesas, saldos e exportação CSV.
- **Recorrentes:** cadastro, edição, pausa e geração manual da próxima entrega.
- **Configurações:** dados da empresa, preço sugerido e backup JSON.

O encerramento do atendimento ocorre após entrega e pagamento integral. Propostas não entram na agenda ou nas contas a receber. Alertas de cliente exigem justificativa da equipe; saldo em aberto não é classificado automaticamente como inadimplência.

## Roteiro de apresentação

1. Mostrar o calendário e selecionar um dia para visualizar a programação.
2. Clicar no nome de um cliente e apresentar histórico, contatos e pontos de atenção.
3. Criar um atendimento e avançar de solicitação para orçamento e agendamento.
4. Selecionar o caminhão, despachar e registrar o abastecimento.
5. Confirmar a entrega com o nome do responsável e registrar o recebimento.
6. Conferir a atualização dos indicadores, do financeiro e da linha do tempo.

## Persistência e limites

Esta é uma versão de demonstração com persistência no navegador (`localStorage`, chave `h2ostras.erp.v5`). Os cadastros não são sincronizados entre computadores e não ficam armazenados neste repositório. Os registros iniciais são fictícios.

Não inclui banco compartilhado, autenticação empresarial, emissão fiscal, rastreamento GPS ou integração bancária. As recorrências são geradas manualmente. O login privado do preview hospedado protege seu acesso, mas não é um sistema de usuários da empresa.

Exporte um backup JSON em Configurações antes de limpar os dados do navegador. O preview importa pedidos das versões anteriores sem apagar as chaves originais; os campos incompletos precisam de revisão.

## Verificação

Fluxos exercitados em navegador real, desktop e viewport de 390 × 844: navegação dos módulos, cadastro e persistência, atendimento até recebimento, capacidade da frota, manutenção em rota, estoque, despesas, recorrências, configurações, calendário, perfil clicável, contatos e alertas justificados. Testes de demonstração foram feitos no localhost e não estão incluídos no HTML.

A referência de estrutura foi o projeto Econ GNV; não foram copiados seus dados operacionais, banco ou credenciais.
