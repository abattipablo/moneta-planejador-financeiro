# Moneta

Aplicação web de planejamento financeiro pessoal feita para estudo e portfólio.

O projeto permite registrar receitas, despesas e investimentos, acompanhar o resumo financeiro e visualizar os dados por período, categoria e tipo de lançamento.

## Tecnologias

- React
- JavaScript
- Vite
- CSS puro

## Funcionalidades atuais

- Visão Geral com filtros de período, categoria e tipo.
- Resumo de receitas, despesas, saldo e taxa de economia.
- Gráfico de fluxo do período e despesas por categoria.
- Cadastro, edição e exclusão de lançamentos.
- Cadastro de contas e vínculo dos lançamentos com uma conta.
- Orçamentos mensais por categoria.
- Metas financeiras com valor guardado, prazo e progresso.
- Data no formato brasileiro (`dd/mm/aaaa`).
- Tipos de lançamento: receita, despesa e investimento.
- Login e dados separados por usuário com Supabase.

## Como rodar o projeto

```bash
npm install
npm run dev
```

## Próximos passos

- Criar a aba de Investimentos.
- Relacionar os aportes de investimento aos ativos cadastrados.
- Melhorar os gráficos e os indicadores da Visão Geral.
