import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDeadline(deadline) {
  if (!deadline) return "Sem prazo definido";

  return `Prazo: ${new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${deadline}T12:00:00`),
  )}`;
}

function Goals({ goals, onAddGoal, onDeleteGoal, onUpdateGoal }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const totalTarget = goals.reduce((total, goal) => total + goal.targetAmount, 0);
  const totalSaved = goals.reduce((total, goal) => total + goal.savedAmount, 0);

  function resetForm() {
    setEditingId(null);
    setName("");
    setTargetAmount("");
    setSavedAmount("");
    setDeadline("");
    setFormError("");
    setIsSaving(false);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function handleEditClick(goal) {
    setEditingId(goal.id);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setSavedAmount(String(goal.savedAmount));
    setDeadline(goal.deadline ?? "");
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    const goalData = {
      name: name.trim(),
      targetAmount: Number(targetAmount),
      savedAmount: Number(savedAmount || 0),
      deadline: deadline || null,
    };
    const error = editingId
      ? await onUpdateGoal({ id: editingId, ...goalData })
      : await onAddGoal(goalData);

    if (error) {
      setFormError(error);
      setIsSaving(false);
      return;
    }

    closeForm();
  }

  async function confirmDelete() {
    setIsDeleting(true);

    const error = await onDeleteGoal(goalToDelete.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setGoalToDelete(null);
    setIsDeleting(false);
  }

  return (
    <section className="goals-page">
      <header className="page-header">
        <div>
          <h1>Metas</h1>
          <p>Transforme seus planos em objetivos financeiros acompanháveis.</p>
        </div>

        {!showForm && (
          <button className="primary-button" onClick={() => setShowForm(true)} type="button">
            + Nova meta
          </button>
        )}
      </header>

      {showForm ? (
        <form className="goal-form panel" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{editingId ? "Editar meta" : "Nova meta"}</h2>
            <p>Informe quanto você pretende alcançar e quanto já conseguiu guardar.</p>
          </div>

          <label className="form-field form-field-wide" htmlFor="goal-name">
            Nome da meta *
            <input
              id="goal-name"
              maxLength="80"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Reserva de emergência"
              required
              type="text"
              value={name}
            />
          </label>

          <label className="form-field" htmlFor="goal-target">
            Valor da meta *
            <input
              id="goal-target"
              min="0.01"
              onChange={(event) => setTargetAmount(event.target.value)}
              placeholder="0,00"
              required
              step="0.01"
              type="number"
              value={targetAmount}
            />
          </label>

          <label className="form-field" htmlFor="goal-saved">
            Valor já guardado
            <input
              id="goal-saved"
              min="0"
              onChange={(event) => setSavedAmount(event.target.value)}
              placeholder="0,00"
              step="0.01"
              type="number"
              value={savedAmount}
            />
          </label>

          <label className="form-field" htmlFor="goal-deadline">
            Prazo
            <input
              id="goal-deadline"
              onChange={(event) => setDeadline(event.target.value)}
              type="date"
              value={deadline}
            />
          </label>

          <div className="form-actions">
            {formError && <span className="form-submit-error">{formError}</span>}
            <button className="secondary-button" onClick={closeForm} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Salvando..." : "Salvar meta"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <section className="goal-totals" aria-label="Resumo das metas">
            <article>
              <span>Total das metas</span>
              <strong>{currencyFormatter.format(totalTarget)}</strong>
            </article>
            <article>
              <span>Já guardado</span>
              <strong className="income-text">{currencyFormatter.format(totalSaved)}</strong>
            </article>
            <article>
              <span>Falta alcançar</span>
              <strong>{currencyFormatter.format(Math.max(totalTarget - totalSaved, 0))}</strong>
            </article>
          </section>

          <section className="goal-list panel" aria-label="Lista de metas">
            <div className="panel-title-row">
              <div>
                <h2>Suas metas</h2>
                <p>Acompanhe o progresso de cada objetivo.</p>
              </div>
              <span>{goals.length} {goals.length === 1 ? "meta" : "metas"}</span>
            </div>

            {goals.length > 0 ? (
              <div className="goal-cards">
                {goals.map((goal) => {
                  const percentage = (goal.savedAmount / goal.targetAmount) * 100;
                  const isCompleted = percentage >= 100;

                  return (
                    <article className="goal-card" key={goal.id}>
                      <div className="goal-card-header">
                        <div>
                          <span>{isCompleted ? "Meta concluída" : formatDeadline(goal.deadline)}</span>
                          <h3>{goal.name}</h3>
                        </div>
                        <strong>{Math.min(percentage, 100).toFixed(0)}%</strong>
                      </div>

                      <div className="goal-progress" aria-label={`${percentage.toFixed(0)}% da meta alcançada`}>
                        <span
                          className={isCompleted ? "completed" : ""}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>

                      <div className="goal-values">
                        <span>
                          Guardado <strong>{currencyFormatter.format(goal.savedAmount)}</strong>
                        </span>
                        <span>
                          Meta <strong>{currencyFormatter.format(goal.targetAmount)}</strong>
                        </span>
                      </div>

                      <div className="goal-actions">
                        <button className="edit-button" onClick={() => handleEditClick(goal)} type="button">
                          Editar
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => {
                            setGoalToDelete(goal);
                            setDeleteError("");
                          }}
                          type="button"
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="empty-message">Nenhuma meta cadastrada ainda.</p>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        confirmLabel="Excluir meta"
        error={deleteError}
        isLoading={isDeleting}
        isOpen={Boolean(goalToDelete)}
        message={`A meta "${goalToDelete?.name ?? ""}" será removida.`}
        onCancel={() => setGoalToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir meta?"
      />
    </section>
  );
}

export default Goals;
