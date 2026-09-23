import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Accounts from "./pages/Accounts";
import Overview from "./pages/Overview";
import Transactions from "./pages/Transactions";

// Dados temporários enquanto o projeto ainda não usa o banco de dados.
const initialAccounts = [
  {
    id: "1",
    name: "Carteira principal",
    type: "Conta corrente",
  },
];

const initialTransactions = [
  {
    id: "1",
    description: "Pagamento",
    category: "Salário",
    value: 2500,
    type: "income",
    date: "2026-09-01",
    accountId: "1",
  },
  {
    id: "2",
    description: "Supermercado",
    category: "Alimentação",
    value: 186.4,
    type: "expense",
    date: "2026-09-03",
    accountId: "1",
  },
  {
    id: "3",
    description: "Netflix",
    category: "Assinaturas",
    value: 39.9,
    type: "expense",
    date: "2026-09-05",
    accountId: "1",
  },
];

function App() {
  // O App guarda os dados que precisam ser usados em mais de uma página.
  const [activePage, setActivePage] = useState("Visão Geral");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [transactions, setTransactions] = useState(initialTransactions);

  function handleAddTransaction(newTransaction) {
    setTransactions((currentTransactions) => [
      newTransaction,
      ...currentTransactions,
    ]);
  }

  function handleDeleteTransaction(transactionId) {
    setTransactions((currentTransactions) =>
      currentTransactions.filter(
        (transaction) => transaction.id !== transactionId,
      ),
    );
  }

  function handleUpdateTransaction(updatedTransaction) {
    setTransactions((currentTransactions) =>
      currentTransactions.map((transaction) =>
        transaction.id === updatedTransaction.id
          ? updatedTransaction
          : transaction,
      ),
    );
  }

  function handleAddAccount(newAccount) {
    setAccounts((currentAccounts) => [newAccount, ...currentAccounts]);
  }

  function handleDeleteAccount(accountId) {
    const accountHasTransactions = transactions.some(
      (transaction) => transaction.accountId === accountId,
    );

    if (accountHasTransactions) return false;

    setAccounts((currentAccounts) =>
      currentAccounts.filter((account) => account.id !== accountId),
    );

    return true;
  }

  return (
    <div className="app">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="content">
        {activePage === "Visão Geral" && (
          <Overview
            accounts={accounts}
            onViewTransactions={() => setActivePage("Lançamentos")}
            transactions={transactions}
          />
        )}

        {activePage === "Lançamentos" && (
          <Transactions
            accounts={accounts}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            transactions={transactions}
          />
        )}

        {activePage === "Contas" && (
          <Accounts
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
            transactions={transactions}
          />
        )}
      </main>
    </div>
  );
}

export default App;
