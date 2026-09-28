import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Accounts from "./pages/Accounts";
import Auth from "./pages/Auth";
import Overview from "./pages/Overview";
import Transactions from "./pages/Transactions";
import { supabase } from "./lib/supabase";

function formatTransactionFromDatabase(transaction) {
  return {
    ...transaction,
    accountId: transaction.account_id,
    value: Number(transaction.value),
  };
}

function App() {
  // O App guarda os dados que precisam ser usados em mais de uma página.
  const [activePage, setActivePage] = useState("Visão Geral");
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setSession(currentSession);
        setIsLoadingSession(false);
      }
    }

    loadSession();

    // Atualiza a interface quando o usuário entra, sai ou confirma o e-mail.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsLoadingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return undefined;

    let isMounted = true;

    async function loadFinancialData() {
      setIsLoadingData(true);
      setDataError("");

      const [accountsResult, transactionsResult] = await Promise.all([
        supabase.from("accounts").select("id, name, type").order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select("id, account_id, description, category, value, type, date, note")
          .order("date", { ascending: false }),
      ]);

      if (!isMounted) return;

      if (accountsResult.error || transactionsResult.error) {
        setDataError("Não foi possível carregar seus dados. Tente atualizar a página.");
      } else {
        setAccounts(accountsResult.data);
        setTransactions(transactionsResult.data.map(formatTransactionFromDatabase));
      }

      setIsLoadingData(false);
    }

    loadFinancialData();

    return () => {
      isMounted = false;
    };
  }, [session]);

  async function handleAddTransaction(newTransaction) {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: session.user.id,
        account_id: newTransaction.accountId,
        description: newTransaction.description,
        category: newTransaction.category,
        value: newTransaction.value,
        type: newTransaction.type,
        date: newTransaction.date,
        note: newTransaction.note || null,
      })
      .select("id, account_id, description, category, value, type, date, note")
      .single();

    if (error) return error.message;

    setTransactions((currentTransactions) => [
      formatTransactionFromDatabase(data),
      ...currentTransactions,
    ]);

    return null;
  }

  async function handleDeleteTransaction(transactionId) {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (error) return error.message;

    setTransactions((currentTransactions) =>
      currentTransactions.filter((transaction) => transaction.id !== transactionId),
    );

    return null;
  }

  async function handleUpdateTransaction(updatedTransaction) {
    const { data, error } = await supabase
      .from("transactions")
      .update({
        account_id: updatedTransaction.accountId,
        description: updatedTransaction.description,
        category: updatedTransaction.category,
        value: updatedTransaction.value,
        type: updatedTransaction.type,
        date: updatedTransaction.date,
        note: updatedTransaction.note || null,
      })
      .eq("id", updatedTransaction.id)
      .select("id, account_id, description, category, value, type, date, note")
      .single();

    if (error) return error.message;

    setTransactions((currentTransactions) =>
      currentTransactions.map((transaction) =>
        transaction.id === data.id
          ? formatTransactionFromDatabase(data)
          : transaction,
      ),
    );

    return null;
  }

  async function handleAddAccount(newAccount) {
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        user_id: session.user.id,
        name: newAccount.name,
        type: newAccount.type,
      })
      .select("id, name, type")
      .single();

    if (error) return error.message;

    setAccounts((currentAccounts) => [data, ...currentAccounts]);

    return null;
  }

  async function handleDeleteAccount(accountId) {
    const accountHasTransactions = transactions.some(
      (transaction) => transaction.accountId === accountId,
    );

    if (accountHasTransactions) {
      return "Não é possível excluir uma conta que possui lançamentos.";
    }

    const { error } = await supabase.from("accounts").delete().eq("id", accountId);

    if (error) return error.message;

    setAccounts((currentAccounts) =>
      currentAccounts.filter((account) => account.id !== accountId),
    );

    return null;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (isLoadingSession) {
    return <main className="auth-loading">Carregando Moneta...</main>;
  }

  if (!session) {
    return <Auth />;
  }

  if (isLoadingData) {
    return <main className="auth-loading">Carregando seus dados...</main>;
  }

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onSignOut={handleSignOut}
        user={session.user}
      />

      <main className="content">
        {dataError && <p className="data-error" role="alert">{dataError}</p>}

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
            onViewAccounts={() => setActivePage("Contas")}
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
