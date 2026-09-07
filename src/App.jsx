import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Transactions from "./pages/Transactions";

// Dados temporários enquanto o projeto ainda não usa o banco de dados.
const initialTransactions = [
  {
    id: "1",
    description: "Pagamento",
    category: "Salário",
    value: 2500,
    type: "income",
    date: "2026-09-01",
  },
  {
    id: "2",
    description: "Supermercado",
    category: "Alimentação",
    value: 186.4,
    type: "expense",
    date: "2026-09-03",
  },
  {
    id: "3",
    description: "Netflix",
    category: "Assinaturas",
    value: 39.9,
    type: "expense",
    date: "2026-09-05",
  },
];

function App() {
  // O App guarda os dados que precisam ser usados em mais de uma página.
  const [activePage, setActivePage] = useState("Visão Geral");
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

  return (
    <div className="app">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="content">
        {activePage === "Visão Geral" && (
          <Overview
            onViewTransactions={() => setActivePage("Lançamentos")}
            transactions={transactions}
          />
        )}

        {activePage === "Lançamentos" && (
          <Transactions
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            transactions={transactions}
          />
        )}
      </main>
    </div>
  );
}

export default App;
