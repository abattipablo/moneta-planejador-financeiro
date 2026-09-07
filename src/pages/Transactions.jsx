import { useState } from "react";

// Lista inicial usada enquanto os dados ainda não vêm do banco.
const initialTransactions = [
  {
    id: "1",
    description: "Pagamento",
    category: "Salário",
    value: 2500,
    type: "income",
  },
  {
    id: "2",
    description: "Supermercado",
    category: "Alimentação",
    value: 186.4,
    type: "expense",
  },
  {
    id: "3",
    description: "Netflix",
    category: "Assinaturas",
    value: 39.9,
    type: "expense",
  },
];

// Opções disponíveis no seletor de categoria.
const categories = [
  "Alimentação",
  "Assinaturas",
  "Moradia",
  "Transporte",
  "Lazer",
  "Salário",
  "Outros",
];

// Formata qualquer número como moeda brasileira na interface.
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function Transactions() {
  // Estado da lista: novos lançamentos entram aqui antes do Supabase.
  const [transactions, setTransactions] = useState(initialTransactions);
  // Controla se o formulário está visível.
  const [showForm, setShowForm] = useState(false);
  // Estados dos campos controlados do formulário.
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

  // Separa e soma receitas para o card de resumo.
  const incomeTotal = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.value, 0);

  // Separa e soma despesas para o card de resumo.
  const expenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.value, 0);

  function resetForm() {
    // Devolve todos os campos ao estado inicial.
    setDescription("");
    setValue("");
    setCategory("");
    setType("");
  }

  function toggleForm() {
    // Abre ou fecha o formulário e limpa dados que não foram salvos.
    setShowForm((currentValue) => !currentValue);
    resetForm();
  }

  function handleSubmit(event) {
    // Evita o recarregamento padrão ao enviar um formulário HTML.
    event.preventDefault();

    // Monta o objeto que será salvo no estado e, futuramente, no Supabase.
    const newTransaction = {
      id: crypto.randomUUID(),
      description: description.trim(),
      value: Number(value),
      category,
      type,
    };

    // Cria uma nova lista, colocando o novo lançamento no topo.
    setTransactions((currentTransactions) => [
      newTransaction,
      ...currentTransactions,
    ]);
    resetForm();
    setShowForm(false);
  }

  return (
    <section className="transactions-page">
      <header className="transactions-header">
        <div>
          <h1>Lançamentos</h1>
          <p>Registre e acompanhe todas as suas movimentações.</p>
        </div>
        <button className="primary-button" onClick={toggleForm} type="button">
          {showForm ? "Fechar formulário" : "Novo lançamento"}
        </button>
      </header>

      {/* O formulário só existe na tela enquanto showForm for verdadeiro. */}
      {showForm && (
        <form className="transaction-form" onSubmit={handleSubmit}>
          <div className="form-field form-field-wide">
            <label htmlFor="description">Descrição</label>
            <input
              id="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: Mercado do bairro"
              required
              type="text"
              value={description}
            />
          </div>

          <div className="form-field">
            <label htmlFor="value">Valor</label>
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
          </div>

          <div className="form-field">
            <label htmlFor="category">Categoria</label>
            <select
              id="category"
              onChange={(event) => setCategory(event.target.value)}
              required
              value={category}
            >
              <option disabled value="">
                Selecione uma categoria
              </option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="type">Tipo</label>
            <select
              id="type"
              onChange={(event) => setType(event.target.value)}
              required
              value={type}
            >
              <option disabled value="">
                Selecione o tipo
              </option>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              className="secondary-button"
              onClick={toggleForm}
              type="button"
            >
              Cancelar
            </button>
            <button className="primary-button" type="submit">
              Salvar lançamento
            </button>
          </div>
        </form>
      )}

      {/* Resumo calculado automaticamente a partir da lista atual. */}
      <section
        className="transaction-totals"
        aria-label="Resumo dos lançamentos"
      >
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
          <strong>
            {currencyFormatter.format(incomeTotal - expenseTotal)}
          </strong>
        </article>
      </section>

      <section className="transaction-list" aria-label="Lista de lançamentos">
        {/* Cria uma linha visual para cada lançamento da lista. */}
        {transactions.map((transaction) => (
          <article
            className={`transaction-row ${transaction.type}`}
            key={transaction.id}
          >
            <div>
              <strong>{transaction.description}</strong>
              <span>{transaction.category}</span>
            </div>
            <strong
              className={
                transaction.type === "income" ? "income-text" : "expense-text"
              }
            >
              {currencyFormatter.format(transaction.value)}
            </strong>
          </article>
        ))}
      </section>
    </section>
  );
}

export default Transactions;
