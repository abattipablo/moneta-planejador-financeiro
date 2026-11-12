import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Accounts from "./pages/Accounts";
import Auth from "./pages/Auth";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Investments from "./pages/Investments";
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

function formatBudgetFromDatabase(budget) {
  return {
    ...budget,
    limitAmount: Number(budget.limit_amount),
  };
}

function formatGoalFromDatabase(goal) {
  return {
    ...goal,
    targetAmount: Number(goal.target_amount),
    savedAmount: Number(goal.saved_amount),
  };
}

function formatInvestmentFromDatabase(investment) {
  return {
    ...investment,
    currentPrice: investment.current_price === null
      ? null
      : Number(investment.current_price),
    priceUpdatedAt: investment.price_updated_at,
  };
}

function formatInvestmentOperationFromDatabase(operation) {
  return {
    ...operation,
    investmentId: operation.investment_id,
    createdAt: operation.created_at,
    operationDate: operation.operation_date,
    operationType: operation.operation_type,
    quantity: Number(operation.quantity),
    unitPrice: Number(operation.unit_price),
    fees: Number(operation.fees),
  };
}

function formatInvestmentDividendFromDatabase(dividend) {
  return {
    ...dividend,
    amountPerUnit: Number(dividend.amount_per_unit),
    eventDate: dividend.event_date,
    investmentId: dividend.investment_id,
  };
}

function formatFixedIncomeFromDatabase(investment) {
  return {
    ...investment,
    annualRate: Number(investment.annual_rate),
    amountInvested: Number(investment.amount_invested),
    currentAmount: investment.current_amount === null
      ? null
      : Number(investment.current_amount),
    maturityDate: investment.maturity_date,
    purchaseDate: investment.purchase_date,
  };
}

async function getFunctionErrorMessage(error) {
  if (!error?.context) return error?.message ?? "Não foi possível consultar os dados.";

  try {
    const response = await error.context.json();
    return response.error ?? error.message;
  } catch {
    return error.message;
  }
}

function App() {
  // O App guarda os dados que precisam ser usados em mais de uma página.
  const [activePage, setActivePage] = useState("Visão Geral");
  const [accounts, setAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [investmentOperations, setInvestmentOperations] = useState([]);
  const [investmentQuotes, setInvestmentQuotes] = useState({});
  const [investmentDividends, setInvestmentDividends] = useState([]);
  const [fixedIncomeInvestments, setFixedIncomeInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("moneta-theme");

    if (savedTheme) return savedTheme;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [sidebarSize, setSidebarSize] = useState(
    () => localStorage.getItem("moneta-sidebar-size") ?? "expanded",
  );
  const [isCompactScreen, setIsCompactScreen] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSidebarHidden = isCompactScreen && !isMobileMenuOpen;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("moneta-theme", theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");

    function updateScreenSize(event) {
      setIsCompactScreen(event.matches);
      setIsMobileMenuOpen(false);
    }

    mediaQuery.addEventListener("change", updateScreenSize);

    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

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

      const [
        accountsResult,
        transactionsResult,
        budgetsResult,
        goalsResult,
        investmentsResult,
        investmentOperationsResult,
        investmentDividendsResult,
        fixedIncomeResult,
      ] = await Promise.all([
        supabase.from("accounts").select("id, name, type").order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select("id, account_id, description, category, value, type, date, note")
          .order("date", { ascending: false }),
        supabase
          .from("budgets")
          .select("id, category, month, limit_amount")
          .order("month", { ascending: false }),
        supabase
          .from("goals")
          .select("id, name, target_amount, saved_amount, deadline")
          .order("created_at", { ascending: false }),
        supabase
          .from("investments")
          .select("id, name, ticker, type, current_price, price_updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("investment_operations")
          .select("id, investment_id, operation_type, quantity, unit_price, fees, operation_date, created_at")
          .order("operation_date", { ascending: false }),
        supabase
          .from("investment_dividends")
          .select("id, investment_id, external_id, event_date, amount_per_unit, source, fetched_at")
          .order("event_date", { ascending: false }),
        supabase
          .from("fixed_income_investments")
          .select("id, name, category, issuer, indexer, annual_rate, amount_invested, current_amount, purchase_date, maturity_date, liquidity")
          .order("purchase_date", { ascending: false }),
      ]);

      if (!isMounted) return;

      if (
        accountsResult.error ||
        transactionsResult.error ||
        budgetsResult.error ||
        goalsResult.error ||
        investmentsResult.error ||
        investmentOperationsResult.error ||
        investmentDividendsResult.error ||
        fixedIncomeResult.error
      ) {
        setDataError("Não foi possível carregar seus dados. Tente atualizar a página.");
      } else {
        setAccounts(accountsResult.data);
        setTransactions(transactionsResult.data.map(formatTransactionFromDatabase));
        setBudgets(budgetsResult.data.map(formatBudgetFromDatabase));
        setGoals(goalsResult.data.map(formatGoalFromDatabase));
        const formattedInvestments = investmentsResult.data.map(
          formatInvestmentFromDatabase,
        );
        setInvestments(formattedInvestments);
        setInvestmentQuotes(Object.fromEntries(
          formattedInvestments
            .filter((investment) => investment.currentPrice !== null)
            .map((investment) => [investment.ticker, {
              ticker: investment.ticker,
              name: investment.name,
              price: investment.currentPrice,
              updatedAt: investment.priceUpdatedAt,
            }]),
        ));
        setInvestmentOperations(
          investmentOperationsResult.data.map(formatInvestmentOperationFromDatabase),
        );
        setInvestmentDividends(
          investmentDividendsResult.data.map(formatInvestmentDividendFromDatabase),
        );
        setFixedIncomeInvestments(
          fixedIncomeResult.data.map(formatFixedIncomeFromDatabase),
        );
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

  async function handleAddBudget(newBudget) {
    const { data, error } = await supabase
      .from("budgets")
      .insert({
        user_id: session.user.id,
        category: newBudget.category,
        month: `${newBudget.month}-01`,
        limit_amount: newBudget.limitAmount,
      })
      .select("id, category, month, limit_amount")
      .single();

    if (error) return error.message;

    setBudgets((currentBudgets) => [formatBudgetFromDatabase(data), ...currentBudgets]);

    return null;
  }

  async function handleUpdateBudget(updatedBudget) {
    const { data, error } = await supabase
      .from("budgets")
      .update({
        category: updatedBudget.category,
        month: `${updatedBudget.month}-01`,
        limit_amount: updatedBudget.limitAmount,
      })
      .eq("id", updatedBudget.id)
      .select("id, category, month, limit_amount")
      .single();

    if (error) return error.message;

    setBudgets((currentBudgets) =>
      currentBudgets.map((budget) =>
        budget.id === data.id ? formatBudgetFromDatabase(data) : budget,
      ),
    );

    return null;
  }

  async function handleDeleteBudget(budgetId) {
    const { error } = await supabase.from("budgets").delete().eq("id", budgetId);

    if (error) return error.message;

    setBudgets((currentBudgets) =>
      currentBudgets.filter((budget) => budget.id !== budgetId),
    );

    return null;
  }

  async function handleAddGoal(newGoal) {
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: session.user.id,
        name: newGoal.name,
        target_amount: newGoal.targetAmount,
        saved_amount: newGoal.savedAmount,
        deadline: newGoal.deadline,
      })
      .select("id, name, target_amount, saved_amount, deadline")
      .single();

    if (error) return error.message;

    setGoals((currentGoals) => [formatGoalFromDatabase(data), ...currentGoals]);

    return null;
  }

  async function handleUpdateGoal(updatedGoal) {
    const { data, error } = await supabase
      .from("goals")
      .update({
        name: updatedGoal.name,
        target_amount: updatedGoal.targetAmount,
        saved_amount: updatedGoal.savedAmount,
        deadline: updatedGoal.deadline,
      })
      .eq("id", updatedGoal.id)
      .select("id, name, target_amount, saved_amount, deadline")
      .single();

    if (error) return error.message;

    setGoals((currentGoals) =>
      currentGoals.map((goal) =>
        goal.id === data.id ? formatGoalFromDatabase(data) : goal,
      ),
    );

    return null;
  }

  async function handleDeleteGoal(goalId) {
    const { error } = await supabase.from("goals").delete().eq("id", goalId);

    if (error) return error.message;

    setGoals((currentGoals) => currentGoals.filter((goal) => goal.id !== goalId));

    return null;
  }

  async function handleAddInvestmentOperation(newOperation) {
    let investment = investments.find(
      (item) => item.ticker === newOperation.ticker,
    );
    let createdInvestment = null;

    if (!investment && newOperation.operationType === "sell") {
      return "Cadastre uma compra antes de registrar uma venda.";
    }

    if (!investment) {
      const cachedQuote = investmentQuotes[newOperation.ticker];
      const { data, error } = await supabase
        .from("investments")
        .insert({
          current_price: cachedQuote?.price ?? null,
          user_id: session.user.id,
          name: newOperation.name,
          price_updated_at: cachedQuote ? new Date().toISOString() : null,
          ticker: newOperation.ticker,
          type: newOperation.type,
        })
        .select("id, name, ticker, type, current_price, price_updated_at")
        .single();

      if (error) return error.message;

      investment = formatInvestmentFromDatabase(data);
      createdInvestment = investment;
    }

    const { data, error } = await supabase
      .from("investment_operations")
      .insert({
        user_id: session.user.id,
        investment_id: investment.id,
        operation_type: newOperation.operationType,
        quantity: newOperation.quantity,
        unit_price: newOperation.unitPrice,
        fees: newOperation.fees,
        operation_date: newOperation.operationDate,
      })
      .select("id, investment_id, operation_type, quantity, unit_price, fees, operation_date, created_at")
      .single();

    if (error) {
      if (createdInvestment) {
        await supabase.from("investments").delete().eq("id", createdInvestment.id);
      }

      return error.message;
    }

    if (createdInvestment) {
      setInvestments((currentInvestments) => [
        createdInvestment,
        ...currentInvestments,
      ]);
    }

    setInvestmentOperations((currentOperations) => [
      formatInvestmentOperationFromDatabase(data),
      ...currentOperations,
    ]);

    return null;
  }

  async function handleGetInvestmentQuotes(tickers) {
    const { data, error } = await supabase.functions.invoke("brapi-quotes", {
      body: { tickers },
    });

    if (error) return { error: error.message, quotes: [] };
    if (data.error) return { error: data.error, quotes: [] };

    const receivedQuotes = data.quotes ?? [];

    const priceUpdatedAt = new Date().toISOString();
    const storedQuotes = receivedQuotes.map((quote) => ({
      ...quote,
      updatedAt: priceUpdatedAt,
    }));

    const priceUpdates = await Promise.all(
      storedQuotes.map((quote) => supabase
        .from("investments")
        .update({
          current_price: quote.price,
          price_updated_at: priceUpdatedAt,
        })
        .eq("ticker", quote.ticker)),
    );

    setInvestmentQuotes((currentQuotes) => ({
      ...currentQuotes,
      ...Object.fromEntries(
        storedQuotes.map((quote) => [quote.ticker, quote]),
      ),
    }));
    setInvestments((currentInvestments) => currentInvestments.map((investment) => {
      const quote = storedQuotes.find((item) => item.ticker === investment.ticker);
      return quote
        ? { ...investment, currentPrice: quote.price, priceUpdatedAt }
        : investment;
    }));

    return {
      error: receivedQuotes.length === 0
        ? "Nenhuma cotação foi encontrada."
        : priceUpdates.some((result) => result.error)
          ? "Os preços foram consultados, mas não puderam ser salvos."
          : null,
      quotes: storedQuotes,
    };
  }

  async function handleGetMarketIndicators() {
    const { data, error } = await supabase.functions.invoke("market-data", {
      body: { action: "macro" },
    });

    if (error) {
      return { error: await getFunctionErrorMessage(error), indicators: [] };
    }
    if (data.error) return { error: data.error, indicators: [] };

    return { error: null, indicators: data.indicators ?? [] };
  }

  async function handleRefreshInvestmentDividends(tickers, startDate) {
    const { data, error } = await supabase.functions.invoke("market-data", {
      body: { action: "dividends", startDate, tickers },
    });

    if (error) {
      return { error: await getFunctionErrorMessage(error), dividends: [] };
    }
    if (data.error) return { error: data.error, dividends: [] };

    const rows = (data.events ?? []).flatMap((event) => {
      const investment = investments.find((item) => item.ticker === event.ticker);
      if (!investment) return [];

      return [{
        amount_per_unit: event.amountPerUnit,
        event_date: event.eventDate,
        external_id: event.externalId,
        fetched_at: data.updatedAt,
        investment_id: investment.id,
        source: event.source,
        user_id: session.user.id,
      }];
    });

    if (rows.length === 0) {
      return {
        error: data.errors?.length ? "Não foi possível encontrar proventos para os ativos." : null,
        dividends: [],
      };
    }

    const { data: savedDividends, error: saveError } = await supabase
      .from("investment_dividends")
      .upsert(rows, { onConflict: "user_id,external_id" })
      .select("id, investment_id, external_id, event_date, amount_per_unit, source, fetched_at");

    if (saveError) return { error: saveError.message, dividends: [] };

    const formattedDividends = savedDividends.map(
      formatInvestmentDividendFromDatabase,
    );
    setInvestmentDividends((currentDividends) => {
      const receivedIds = new Set(formattedDividends.map((item) => item.external_id));
      return [
        ...formattedDividends,
        ...currentDividends.filter((item) => !receivedIds.has(item.external_id)),
      ].sort((first, second) => second.eventDate.localeCompare(first.eventDate));
    });

    return { error: null, dividends: formattedDividends };
  }

  async function handleDeleteInvestmentOperation(operationId) {
    const { error } = await supabase
      .from("investment_operations")
      .delete()
      .eq("id", operationId);

    if (error) return error.message;

    setInvestmentOperations((currentOperations) =>
      currentOperations.filter((operation) => operation.id !== operationId),
    );

    return null;
  }

  async function handleUpdateInvestmentOperation(operationId, updatedOperation) {
    const { data, error } = await supabase
      .from("investment_operations")
      .update({
        fees: updatedOperation.fees,
        operation_date: updatedOperation.operationDate,
        quantity: updatedOperation.quantity,
        unit_price: updatedOperation.unitPrice,
      })
      .eq("id", operationId)
      .select("id, investment_id, operation_type, quantity, unit_price, fees, operation_date, created_at")
      .single();

    if (error) return error.message;

    setInvestmentOperations((currentOperations) => currentOperations.map(
      (operation) => operation.id === operationId
        ? formatInvestmentOperationFromDatabase(data)
        : operation,
    ));

    return null;
  }

  async function handleDeleteInvestment(investmentId) {
    const investmentToDelete = investments.find(
      (investment) => investment.id === investmentId,
    );
    const { error } = await supabase
      .from("investments")
      .delete()
      .eq("id", investmentId);

    if (error) return error.message;

    setInvestments((currentInvestments) =>
      currentInvestments.filter((investment) => investment.id !== investmentId),
    );
    setInvestmentOperations((currentOperations) =>
      currentOperations.filter(
        (operation) => operation.investmentId !== investmentId,
      ),
    );
    setInvestmentDividends((currentDividends) =>
      currentDividends.filter(
        (dividend) => dividend.investmentId !== investmentId,
      ),
    );
    if (investmentToDelete) {
      setInvestmentQuotes((currentQuotes) => {
        const nextQuotes = { ...currentQuotes };
        delete nextQuotes[investmentToDelete.ticker];
        return nextQuotes;
      });
    }

    return null;
  }

  async function handleSaveFixedIncome(investment, editingId) {
    const values = {
      amount_invested: investment.amountInvested,
      annual_rate: investment.annualRate,
      category: investment.category,
      current_amount: investment.currentAmount ?? null,
      issuer: investment.issuer,
      indexer: investment.indexer,
      liquidity: investment.liquidity || null,
      maturity_date: investment.maturityDate || null,
      name: investment.name,
      purchase_date: investment.purchaseDate,
      user_id: session.user.id,
    };

    const query = editingId
      ? supabase.from("fixed_income_investments").update(values).eq("id", editingId)
      : supabase.from("fixed_income_investments").insert(values);
    const { data, error } = await query
      .select("id, name, category, issuer, indexer, annual_rate, amount_invested, current_amount, purchase_date, maturity_date, liquidity")
      .single();

    if (error) return error.message;

    const formattedInvestment = formatFixedIncomeFromDatabase(data);
    setFixedIncomeInvestments((currentInvestments) => editingId
      ? currentInvestments.map((item) => (
        item.id === editingId ? formattedInvestment : item
      ))
      : [formattedInvestment, ...currentInvestments]);

    return null;
  }

  async function handleDeleteFixedIncome(investmentId) {
    const { error } = await supabase
      .from("fixed_income_investments")
      .delete()
      .eq("id", investmentId);

    if (error) return error.message;

    setFixedIncomeInvestments((currentInvestments) => (
      currentInvestments.filter((investment) => investment.id !== investmentId)
    ));

    return null;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleToggleSidebarSize() {
    setSidebarSize((currentSize) => {
      const nextSize = currentSize === "expanded" ? "compact" : "expanded";
      localStorage.setItem("moneta-sidebar-size", nextSize);

      return nextSize;
    });
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
    <div
      className={`app sidebar-${sidebarSize} ${
        isSidebarHidden ? "sidebar-hidden" : ""
      }`}
    >
      {isSidebarHidden && (
        <button
          className="app-menu-trigger"
          onClick={() => {
            setIsMobileMenuOpen(true);
          }}
          type="button"
        >
          Mostrar menu
        </button>
      )}

      {isCompactScreen && isMobileMenuOpen && (
        <button
          aria-label="Fechar menu"
          className="mobile-menu-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          type="button"
        />
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          if (isCompactScreen) setIsMobileMenuOpen(false);
        }}
        onSignOut={handleSignOut}
        onToggleTheme={() => {
          setTheme((currentTheme) => currentTheme === "light" ? "dark" : "light");
        }}
        onToggleSize={handleToggleSidebarSize}
        sidebarSize={sidebarSize}
        theme={theme}
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

        {activePage === "Orçamentos" && (
          <Budgets
            budgets={budgets}
            onAddBudget={handleAddBudget}
            onDeleteBudget={handleDeleteBudget}
            onUpdateBudget={handleUpdateBudget}
            transactions={transactions}
          />
        )}

        {activePage === "Metas" && (
          <Goals
            goals={goals}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
            onUpdateGoal={handleUpdateGoal}
          />
        )}

        {activePage === "Investimentos" && (
          <Investments
            fixedIncomeInvestments={fixedIncomeInvestments}
            investmentDividends={investmentDividends}
            investmentOperations={investmentOperations}
            investmentQuotes={investmentQuotes}
            investments={investments}
            onAddOperation={handleAddInvestmentOperation}
            onDeleteFixedIncome={handleDeleteFixedIncome}
            onDeleteInvestment={handleDeleteInvestment}
            onDeleteOperation={handleDeleteInvestmentOperation}
            onGetQuotes={handleGetInvestmentQuotes}
            onGetMarketIndicators={handleGetMarketIndicators}
            onRefreshDividends={handleRefreshInvestmentDividends}
            onSaveFixedIncome={handleSaveFixedIncome}
            onUpdateOperation={handleUpdateInvestmentOperation}
          />
        )}
      </main>
    </div>
  );
}

export default App;
