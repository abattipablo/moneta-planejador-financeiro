import { useState } from "react";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const transactionTypes = [
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
  { value: "investment", label: "Investimentos" },
];

function formatMonthLabel(month) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T12:00:00`));
}

function formatTransactionDate(date) {
  if (!date) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${date}T12:00:00`),
  );
}

function getPeriodLabel(period) {
  const [type, value] = period.split(":");

  if (type === "month") return formatMonthLabel(value);
  if (type === "range") return `Últimos ${value} meses`;
  if (type === "year") return value;

  return formatMonthLabel(period);
}

function filterByPeriod(transactions, period) {
  const [type, value] = period.includes(":")
    ? period.split(":")
    : ["month", period];

  if (type === "month" || type === "year") {
    return transactions.filter((transaction) =>
      transaction.date?.startsWith(value),
    );
  }

  const numberOfMonths = Number(value);
  const today = new Date();
  const firstDate = new Date(
    today.getFullYear(),
    today.getMonth() - numberOfMonths + 1,
    1,
  )
    .toISOString()
    .slice(0, 10);
  const lastDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    .toISOString()
    .slice(0, 10);

  return transactions.filter(
    (transaction) => transaction.date >= firstDate && transaction.date < lastDate,
  );
}

function createFlowPoints(transactions) {
  const orderedTransactions = [...transactions].sort((first, second) =>
    (first.date ?? "").localeCompare(second.date ?? ""),
  );

  if (orderedTransactions.length === 0) {
    return "";
  }

  let balance = 0;
  const balances = orderedTransactions.map((transaction) => {
    balance += transaction.type === "income" ? transaction.value : -transaction.value;
    return balance;
  });
  const minBalance = Math.min(...balances, 0);
  const maxBalance = Math.max(...balances, 1);
  const difference = maxBalance - minBalance || 1;

  return balances
    .map((currentBalance, index) => {
      const x = 8 + (index / Math.max(balances.length - 1, 1)) * 284;
      const y = 72 - ((currentBalance - minBalance) / difference) * 56;

      return `${x},${y}`;
    })
    .join(" ");
}

function getValueClass(type) {
  if (type === "income") return "income-text";
  if (type === "investment") return "investment-text";

  return "expense-text";
}

function Overview({ transactions, onViewTransactions }) {
  const availableMonths = [
    ...new Set(
      transactions
        .map((transaction) => transaction.date?.slice(0, 7))
        .filter(Boolean),
    ),
  ].sort((firstMonth, secondMonth) => secondMonth.localeCompare(firstMonth));

  const availableYears = [
    ...new Set(availableMonths.map((month) => month.slice(0, 4))),
  ].sort((firstYear, secondYear) => secondYear.localeCompare(firstYear));

  const [selectedPeriod, setSelectedPeriod] = useState(
    availableMonths[0] ? `month:${availableMonths[0]}` : "range:3",
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const availableCategories = [
    ...new Set(transactions.map((transaction) => transaction.category)),
  ].sort();

  // Esses dados são usados pelo fluxo e pelas categorias: somente o período importa.
  const periodTransactions = filterByPeriod(transactions, selectedPeriod);

  // Cards e lançamentos recentes também respeitam categoria e tipo.
  const filteredTransactions = periodTransactions.filter((transaction) => {
    const isSelectedCategory =
      !selectedCategory || transaction.category === selectedCategory;
    const isSelectedType = !selectedType || transaction.type === selectedType;

    return isSelectedCategory && isSelectedType;
  });

  const incomeTotal = filteredTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.value, 0);
  const expenseTotal = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.value, 0);
  const investmentTotal = filteredTransactions
    .filter((transaction) => transaction.type === "investment")
    .reduce((total, transaction) => total + transaction.value, 0);
  const periodBalance = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? (investmentTotal / incomeTotal) * 100 : 0;

  const expenseByCategory = periodTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (totals, transaction) => ({
        ...totals,
        [transaction.category]:
          (totals[transaction.category] ?? 0) + transaction.value,
      }),
      {},
    );

  const expenseCategories = Object.entries(expenseByCategory).sort(
    ([, firstValue], [, secondValue]) => secondValue - firstValue,
  );

  const recentTransactions = [...filteredTransactions]
    .sort((first, second) =>
      (second.date ?? "").localeCompare(first.date ?? ""),
    )
    .slice(0, 3);

  const flowPoints = createFlowPoints(periodTransactions);
  const categoryExpenseTotal = expenseCategories.reduce(
    (total, [, value]) => total + value,
    0,
  );

  return (
    <section className="overview-page">
      <header className="page-header overview-header">
        <div>
          <h1>Olá, Pablo</h1>
          <p>Seu panorama financeiro de {getPeriodLabel(selectedPeriod)}.</p>
        </div>

        <div className="overview-filters">
          <label className="overview-filter">
            <span>Período</span>
            <select
              onChange={(event) => setSelectedPeriod(event.target.value)}
              value={selectedPeriod}
            >
              <optgroup label="Por mês">
                {availableMonths.map((month) => (
                  <option key={month} value={`month:${month}`}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Períodos">
                <option value="range:3">Últimos 3 meses</option>
                <option value="range:6">Últimos 6 meses</option>
                <option value="range:12">Último ano</option>
              </optgroup>
              <optgroup label="Por ano">
                {availableYears.map((year) => (
                  <option key={year} value={`year:${year}`}>
                    {year}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="overview-filter">
            <span>Categoria</span>
            <select
              onChange={(event) => setSelectedCategory(event.target.value)}
              value={selectedCategory}
            >
              <option value="">Todas</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="overview-filter">
            <span>Tipo</span>
            <select
              onChange={(event) => setSelectedType(event.target.value)}
              value={selectedType}
            >
              <option value="">Todos</option>
              {transactionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="summary-grid">
        <article className="summary-card">
          <span>Saldo do período</span>
          <strong>{currencyFormatter.format(periodBalance)}</strong>
          <small>Receitas menos despesas</small>
        </article>
        <article className="summary-card">
          <span>Receitas</span>
          <strong className="income-text">
            {currencyFormatter.format(incomeTotal)}
          </strong>
          <small>Total que entrou</small>
        </article>
        <article className="summary-card">
          <span>Despesas</span>
          <strong className="expense-text">
            {currencyFormatter.format(expenseTotal)}
          </strong>
          <small>Total que saiu</small>
        </article>
        <article className="summary-card">
          <span>Taxa de economia</span>
          <strong className="savings-text">
            {savingsRate.toFixed(1).replace(".", ",")}%
          </strong>
          <small>{currencyFormatter.format(investmentTotal)} investidos</small>
        </article>
      </section>

      <section className="overview-insights">
        <article className="panel flow-panel">
          <h2>Fluxo do mês</h2>
          <p>Receitas, despesas e investimentos acumulados no período.</p>

          {flowPoints ? (
            <svg
              aria-label="Gráfico de fluxo financeiro"
              className="flow-chart"
              role="img"
              viewBox="0 0 300 80"
            >
              <line x1="0" x2="300" y1="16" y2="16" />
              <line x1="0" x2="300" y1="40" y2="40" />
              <line x1="0" x2="300" y1="64" y2="64" />
              <polyline points={flowPoints} />
            </svg>
          ) : (
            <p className="empty-message">Não há dados para este período.</p>
          )}
        </article>

        <article className="panel category-panel">
          <h2>Despesas por categoria</h2>

          {expenseCategories.length > 0 ? (
            <div className="category-bars">
              {expenseCategories.map(([category, total]) => {
                const percentage = (total / categoryExpenseTotal) * 100;

                return (
                  <div className="category-bar" key={category}>
                    <div>
                      <span>{category}</span>
                      <strong>{currencyFormatter.format(total)}</strong>
                    </div>
                    <div className="category-bar-track">
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-message">Não há despesas neste período.</p>
          )}
        </article>
      </section>

      <section className="panel recent-transactions">
        <div className="panel-title-row">
          <div>
            <h2>Lançamentos recentes</h2>
            <p>Movimentações com os filtros selecionados</p>
          </div>
          <button className="text-button" onClick={onViewTransactions} type="button">
            Ver todos
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <article className="recent-transaction" key={transaction.id}>
              <div>
                <strong>{transaction.description}</strong>
                <span>
                  {transaction.category} · {formatTransactionDate(transaction.date)}
                </span>
              </div>
              <strong className={getValueClass(transaction.type)}>
                {transaction.type === "income" ? "+ " : "− "}
                {currencyFormatter.format(transaction.value)}
              </strong>
            </article>
          ))
        ) : (
          <p className="empty-message">Nenhum lançamento encontrado.</p>
        )}
      </section>
    </section>
  );
}

export default Overview;
