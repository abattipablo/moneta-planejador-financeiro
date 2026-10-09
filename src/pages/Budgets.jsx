import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

const categories = [
  "Alimentação",
  "Assinaturas",
  "Moradia",
  "Transporte",
  "Lazer",
  "Outros",
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getCurrentMonth() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${today.getFullYear()}-${month}`;
}

function formatMonthLabel(month) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T12:00:00`));
}

function Budgets({
  budgets,
  onAddBudget,
  onDeleteBudget,
  onUpdateBudget,
  transactions,
}) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const monthBudgets = budgets.filter((budget) =>
    budget.month.startsWith(selectedMonth),
  );

  const expensesByCategory = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && transaction.date.startsWith(selectedMonth),
    )
    .reduce(
      (totals, transaction) => ({
        ...totals,
        [transaction.category]:
          (totals[transaction.category] ?? 0) + transaction.value,
      }),
      {},
    );

  const totalBudgeted = monthBudgets.reduce(
    (total, budget) => total + budget.limitAmount,
    0,
  );
  const totalSpent = monthBudgets.reduce(
    (total, budget) => total + (expensesByCategory[budget.category] ?? 0),
    0,
  );

  function resetForm() {
    setCategory("");
    setLimitAmount("");
    setEditingId(null);
    setFormError("");
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function handleEditClick(budget) {
    setCategory(budget.category);
    setLimitAmount(String(budget.limitAmount));
    setEditingId(budget.id);
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    const budgetData = {
      category,
      month: selectedMonth,
      limitAmount: Number(limitAmount),
    };
    const error = editingId
      ? await onUpdateBudget({ id: editingId, ...budgetData })
      : await onAddBudget(budgetData);

    if (error) {
      setFormError(
        error.includes("budgets_user_category_month_key")
          ? "Já existe um orçamento para essa categoria neste mês."
          : error,
      );
      setIsSaving(false);
      return;
    }

    closeForm();
  }

  function handleDeleteClick(budget) {
    setBudgetToDelete(budget);
    setDeleteError("");
  }

  async function confirmDelete() {
    setIsDeleting(true);

    const error = await onDeleteBudget(budgetToDelete.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setBudgetToDelete(null);
    setIsDeleting(false);
  }

  return (
    <section className="budgets-page">
      <header className="page-header">
        <div>
          <h1>Orçamentos</h1>
          <p>Defina limites mensais e acompanhe seus gastos por categoria.</p>
        </div>

        <div className="budget-header-actions">
          <label className="month-filter" htmlFor="budget-month">
            Mês
            <input
              id="budget-month"
              onChange={(event) => setSelectedMonth(event.target.value)}
              type="month"
              value={selectedMonth}
            />
          </label>
          {!showForm && (
            <button className="primary-button" onClick={() => setShowForm(true)} type="button">
              + Novo orçamento
            </button>
          )}
        </div>
      </header>

      {showForm ? (
        <form className="budget-form panel" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{editingId ? "Editar orçamento" : "Novo orçamento"}</h2>
            <p>O limite vale para {formatMonthLabel(selectedMonth)}.</p>
          </div>

          <label className="form-field" htmlFor="budget-category">
            Categoria *
            <select
              id="budget-category"
              onChange={(event) => setCategory(event.target.value)}
              required
              value={category}
            >
              <option disabled value="">Selecione uma categoria</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="form-field" htmlFor="budget-limit">
            Limite mensal *
            <input
              id="budget-limit"
              min="0.01"
              onChange={(event) => setLimitAmount(event.target.value)}
              placeholder="0,00"
              required
              step="0.01"
              type="number"
              value={limitAmount}
            />
          </label>

          <div className="form-actions">
            {formError && <span className="form-submit-error">{formError}</span>}
            <button className="secondary-button" onClick={closeForm} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Salvando..." : "Salvar orçamento"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <section className="budget-totals" aria-label="Resumo dos orçamentos">
            <article>
              <span>Planejado</span>
              <strong>{currencyFormatter.format(totalBudgeted)}</strong>
            </article>
            <article>
              <span>Gasto</span>
              <strong className="expense-text">{currencyFormatter.format(totalSpent)}</strong>
            </article>
            <article>
              <span>Disponível</span>
              <strong className={totalBudgeted - totalSpent < 0 ? "expense-text" : "income-text"}>
                {currencyFormatter.format(totalBudgeted - totalSpent)}
              </strong>
            </article>
          </section>

          <section className="budget-list panel" aria-label="Lista de orçamentos">
            <div className="panel-title-row">
              <div>
                <h2>Orçamentos de {formatMonthLabel(selectedMonth)}</h2>
                <p>O gasto é calculado pelos seus lançamentos de despesa.</p>
              </div>
              <span>{monthBudgets.length} {monthBudgets.length === 1 ? "orçamento" : "orçamentos"}</span>
            </div>

            {monthBudgets.length > 0 ? (
              <div className="budget-cards">
                {monthBudgets.map((budget) => {
                  const spent = expensesByCategory[budget.category] ?? 0;
                  const percentage = (spent / budget.limitAmount) * 100;
                  const isOverLimit = percentage > 100;

                  return (
                    <article className="budget-card" key={budget.id}>
                      <div className="budget-card-top">
                        <div>
                          <h3>{budget.category}</h3>
                          <p>
                            {currencyFormatter.format(spent)} de {currencyFormatter.format(budget.limitAmount)}
                          </p>
                        </div>
                        <strong className={isOverLimit ? "expense-text" : "savings-text"}>
                          {percentage.toFixed(0)}%
                        </strong>
                      </div>

                      <div className="budget-progress" aria-label={`${percentage.toFixed(0)}% do orçamento usado`}>
                        <span
                          className={isOverLimit ? "over-limit" : ""}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>

                      <div className="budget-card-footer">
                        <span className={isOverLimit ? "expense-text" : "income-text"}>
                          {isOverLimit
                            ? `${currencyFormatter.format(spent - budget.limitAmount)} acima do limite`
                            : `${currencyFormatter.format(budget.limitAmount - spent)} disponível`}
                        </span>
                        <div>
                          <button className="edit-button" onClick={() => handleEditClick(budget)} type="button">
                            Editar
                          </button>
                          <button className="delete-button" onClick={() => handleDeleteClick(budget)} type="button">
                            Excluir
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="empty-message">Nenhum orçamento cadastrado para este mês.</p>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        confirmLabel="Excluir orçamento"
        error={deleteError}
        isLoading={isDeleting}
        isOpen={Boolean(budgetToDelete)}
        message={`O orçamento de ${budgetToDelete?.category ?? ""} será removido.`}
        onCancel={() => setBudgetToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir orçamento?"
      />
    </section>
  );
}

export default Budgets;
