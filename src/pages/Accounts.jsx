import { useState } from "react";

const accountTypes = [
  "Conta corrente",
  "Carteira",
  "Poupança",
  "Conta de investimento",
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getAccountBalance(account, transactions) {
  const transactionBalance = transactions
    .filter((transaction) => transaction.accountId === account.id)
    .reduce((total, transaction) => {
      if (transaction.type === "income") return total + transaction.value;

      return total - transaction.value;
    }, 0);

  return transactionBalance;
}

function Accounts({ accounts, onAddAccount, onDeleteAccount, transactions }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const totalBalance = accounts.reduce(
    (total, account) => total + getAccountBalance(account, transactions),
    0,
  );

  function resetForm() {
    setName("");
    setType("");
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function handleSubmit(event) {
    event.preventDefault();

    onAddAccount({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
    });

    closeForm();
  }

  function handleDeleteClick(account) {
    const shouldDelete = window.confirm(`Excluir a conta "${account.name}"?`);

    if (!shouldDelete) return;

    const wasDeleted = onDeleteAccount(account.id);

    if (!wasDeleted) {
      window.alert(
        "Não é possível excluir uma conta que já possui lançamentos. Exclua ou edite os lançamentos primeiro.",
      );
    }
  }

  return (
    <section className="accounts-page">
      <header className="page-header">
        <div>
          <h1>Contas</h1>
          <p>Organize onde o seu dinheiro está guardado.</p>
        </div>

        {!showForm && (
          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
            type="button"
          >
            + Nova conta
          </button>
        )}
      </header>

      {showForm ? (
        <form className="account-form panel" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>Nova conta</h2>
            <p>Cadastre uma conta para usar nos seus lançamentos.</p>
          </div>

          <label className="form-field" htmlFor="account-name">
            Nome da conta *
            <input
              id="account-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Nubank"
              required
              type="text"
              value={name}
            />
          </label>

          <label className="form-field" htmlFor="account-type">
            Tipo *
            <select
              id="account-type"
              onChange={(event) => setType(event.target.value)}
              required
              value={type}
            >
              <option disabled value="">Selecione o tipo</option>
              {accountTypes.map((accountType) => (
                <option key={accountType} value={accountType}>
                  {accountType}
                </option>
              ))}
            </select>
          </label>

          <div className="form-actions">
            <button className="secondary-button" onClick={closeForm} type="button">
              Cancelar
            </button>
            <button className="primary-button" type="submit">
              Salvar conta
            </button>
          </div>
        </form>
      ) : (
        <>
          <article className="accounts-total summary-card">
            <span>Saldo total em contas</span>
            <strong>{currencyFormatter.format(totalBalance)}</strong>
            <small>{accounts.length} {accounts.length === 1 ? "conta cadastrada" : "contas cadastradas"}</small>
          </article>

          <section className="accounts-list" aria-label="Lista de contas">
            {accounts.map((account) => {
              const balance = getAccountBalance(account, transactions);
              const transactionCount = transactions.filter(
                (transaction) => transaction.accountId === account.id,
              ).length;

              return (
                <article className="account-card panel" key={account.id}>
                  <div>
                    <span>{account.type}</span>
                    <h2>{account.name}</h2>
                    <small>{transactionCount} {transactionCount === 1 ? "lançamento" : "lançamentos"}</small>
                  </div>

                  <div className="account-card-balance">
                    <strong>{currencyFormatter.format(balance)}</strong>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(account)}
                      type="button"
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </section>
  );
}

export default Accounts;
