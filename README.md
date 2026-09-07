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
- Data no formato brasileiro (`dd/mm/aaaa`).
- Tipos de lançamento: receita, despesa e investimento.

## Como rodar o projeto

```bash
npm install
npm run dev
```

## Próximos passos

- Criar a aba Contas e conectar cada lançamento a uma conta real.
- Criar as abas de Orçamentos, Metas e Investimentos.
- Integrar o Supabase para salvar dados por usuário.
