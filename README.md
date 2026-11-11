# Moneta

Aplicação web de planejamento financeiro pessoal feita para estudo e portfólio.

O projeto permite registrar receitas, despesas e investimentos, acompanhar o resumo financeiro e visualizar os dados por período, categoria e tipo de lançamento.

## Tecnologias

- React
- JavaScript
- Vite
- CSS puro
- Supabase (banco, autenticação e funções)

## Funcionalidades atuais

- Visão Geral com filtros de período, categoria e tipo.
- Resumo de receitas, despesas, saldo e taxa de economia.
- Gráfico de fluxo do período e despesas por categoria.
- Cadastro, edição e exclusão de lançamentos.
- Cadastro de contas e vínculo dos lançamentos com uma conta.
- Orçamentos mensais por categoria.
- Metas financeiras com valor guardado, prazo e progresso.
- Carteira de investimentos calculada a partir do histórico de compras e vendas.
- Consulta manual de cotações pela brapi para economizar requisições.
- Cálculo de preço médio, posição atual e resultado realizado nas vendas.
- Indicadores de Selic e CDI consultados no Banco Central e IPCA consultado no IBGE.
- Histórico de dividendos estimados conforme a posição em cada data.
- Data no formato brasileiro (`dd/mm/aaaa`).
- Tipos de lançamento: receita, despesa e investimento.
- Login e dados separados por usuário com Supabase.

## Como rodar o projeto

Crie um arquivo `.env.local` a partir do `.env.example` e informe a URL e a chave pública do seu projeto Supabase.

```bash
npm install
npm run dev
```

As funções que consultam cotações, indicadores e dividendos estão em `supabase/functions`. O token da brapi deve ser salvo apenas como segredo `BRAPI_TOKEN` no Supabase e nunca no código do navegador.

## Próximos passos

- Adicionar moedas, criptomoedas, Tesouro Direto e gráficos da carteira.
- Melhorar os gráficos e os indicadores da Visão Geral.
