import { useState } from "react";

const categories = [
  "Alimentação",
  "Assinaturas",
  "Moradia",
  "Transporte",
  "Lazer",
  "Salário",
  "Investimentos",
  "Outros",
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatTransactionDate(date) {
  if (!date) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${date}T12:00:00`),
  );
}

function formatDateForInput(date) {
  if (!date) return "";

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function toIsoDate(date) {
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) return null;

  const [, day, month, year] = match;
  const parsedDate = new Date(`${year}-${month}-${day}T12:00:00`);
  const isValidDate =
    parsedDate.getFullYear() === Number(year) &&
    parsedDate.getMonth() === Number(month) - 1 &&
    parsedDate.getDate() === Number(day);

  return isValidDate ? `${year}-${month}-${day}` : null;
}

function formatDateTyping(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 8);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;

  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
}

function getValueClass(type) {
  if (type === "income") return "income-text";
  if (type === "investment") return "investment-text";

  return "expense-text";
}

function Transactions({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
}) {
  // Estados usados nos campos do formulário.
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [account, setAccount] = useState("Carteira principal");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dateError, setDateError] = useState("");

  const incomeTotal = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.value, 0);
  const expenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.value, 0);

  function resetForm() {
    setDescription("");
    setValue("");
    setCategory("");
    setType("");
    setDate("");
    setAccount("Carteira principal");
    setNote("");
    setDateError("");
    setEditingId(null);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function handleEditClick(transaction) {
    // Preenche o formulário com os dados do lançamento selecionado.
    setDescription(transaction.description);
    setValue(String(transaction.value));
    setCategory(transaction.category);
    setType(transaction.type);
    setDate(formatDateForInput(transaction.date));
    setAccount(transaction.account ?? "Carteira principal");
    setNote(transaction.note ?? "");
    setEditingId(transaction.id);
    setShowForm(true);
  }

  function handleDeleteClick(transaction) {
    const shouldDelete = window.confirm(
      `Excluir o lançamento "${transaction.description}"?`,
    );

    if (shouldDelete) {
      onDeleteTransaction(transaction.id);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const isoDate = toIsoDate(date);

    if (!isoDate) {
      setDateError("Informe uma data válida no formato dd/mm/aaaa.");
      return;
    }

    const transactionData = {
      description: description.trim(),
      value: Number(value),
      category,
      type,
      date: isoDate,
      account,
      note,
    };

    if (editingId) {
      onUpdateTransaction({ id: editingId, ...transactionData });
    } else {
      onAddTransaction({ id: crypto.randomUUID(), ...transactionData });
    }

    closeForm();
  }

  return (
    <section className="transactions-page">
      <header className="page-header transactions-header">
        <div>
          <h1>
            {showForm
              ? editingId
                ? "Editar lançamento"
                : "Novo lançamento"
              : "Lançamentos"}
          </h1>
          <p>
            {showForm
              ? "Preencha os dados para registrar uma movimentação."
              : "Registre e acompanhe todas as suas movimentações."}
          </p>
        </div>

        {!showForm && (
          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
            type="button"
          >
            + Novo lançamento
          </button>
        )}
      </header>

      {showForm ? (
        <form className="transaction-form" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>Dados do lançamento</h2>
            <p>Campos marcados com * são obrigatórios.</p>
          </div>

          <label className="form-field form-field-wide" htmlFor="description">
            Descrição *
            <input
              id="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: Mercado do bairro"
              required
              type="text"
              value={description}
            />
          </label>

          <label className="form-field" htmlFor="value">
            Valor *
            <input
              id="value"
              min="0.01"
              onChange={(event) => setValue(event.target.value)}
              placeholder="0,00"
              required
              step="0.01"
              type="number"
              value={value}
            />
          </label>

          <label className="form-field" htmlFor="category">
            Categoria *
            <select
              id="category"
              onChange={(event) => setCategory(event.target.value)}
              required
              value={category}
            >
              <option disabled value="">Selecione uma categoria</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="form-field" htmlFor="type">
            Tipo *
            <select
              id="type"
              onChange={(event) => setType(event.target.value)}
              required
              value={type}
            >
              <option disabled value="">Selecione o tipo</option>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="investment">Investimento</option>
            </select>
          </label>

          <label className="form-field" htmlFor="date">
            Data *
            <input
              id="date"
              inputMode="numeric"
              maxLength="10"
              onChange={(event) => {
                setDate(formatDateTyping(event.target.value));
                setDateError("");
              }}
              pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
              placeholder="dd/mm/aaaa"
              required
              type="text"
              value={date}
            />
            {dateError && <span className="form-error">{dateError}</span>}
          </label>

          <label className="form-field" htmlFor="account">
            Conta *
            <select
              id="account"
              onChange={(event) => setAccount(event.target.value)}
              required
              value={account}
            >
              <option>Carteira principal</option>
            </select>
          </label>

          <label className="form-field" htmlFor="note">
            Observação
            <input
              id="note"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Opcional"
              type="text"
              value={note}
            />
          </label>

          <div className="form-actions">
            <button className="secondary-button" onClick={closeForm} type="button">
              Cancelar
            </button>
            <button className="primary-button" type="submit">
              {editingId ? "Salvar alterações" : "Salvar lançamento"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <section className="transaction-totals" aria-label="Resumo dos lançamentos">
            <article>
              <span>Receitas</span>
              <strong className="income-text">
                {currencyFormatter.format(incomeTotal)}
              </strong>
            </article>
            <article>
              <span>Despesas</span>
              <strong className="expense-text">
                {currencyFormatter.format(expenseTotal)}
              </strong>
            </article>
            <article>
              <span>Saldo do período</span>
              <strong>{currencyFormatter.format(incomeTotal - expenseTotal)}</strong>
            </article>
          </section>

          <section className="transaction-list panel" aria-label="Lista de lançamentos">
            <div className="panel-title-row">
              <h2>Todos os lançamentos</h2>
              <span>
                {transactions.length} {transactions.length === 1 ? "registro" : "registros"}
              </span>
            </div>

            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <article
                  className={`transaction-row ${transaction.type}`}
                  key={transaction.id}
                >
                  <div>
                    <strong>{transaction.description}</strong>
                    <span>
                      {transaction.category} · {formatTransactionDate(transaction.date)}
                    </span>
                  </div>
                  <div className="transaction-actions">
                    <strong className={getValueClass(transaction.type)}>
                      {transaction.type === "income" ? "+ " : "− "}
                      {currencyFormatter.format(transaction.value)}
                    </strong>
                    <button className="edit-button" onClick={() => handleEditClick(transaction)} type="button">
                      Editar
                    </button>
                    <button className="delete-button" onClick={() => handleDeleteClick(transaction)} type="button">
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-message">Nenhum lançamento cadastrado.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default Transactions;
