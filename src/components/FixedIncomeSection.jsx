import { useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import ConfirmDialog from "./ConfirmDialog";

const categories = ["Tesouro Direto", "CDB", "LCI/LCA", "Debênture", "Outro"];
const indexers = ["Selic", "CDI", "IPCA", "Prefixado", "Outro"];
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getToday() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return "Sem vencimento";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`));
}

const emptyForm = {
  name: "",
  category: "Tesouro Direto",
  issuer: "Tesouro Nacional",
  indexer: "Selic",
  annualRate: "",
  amountInvested: "",
  currentAmount: "",
  purchaseDate: getToday(),
  maturityDate: "",
  liquidity: "",
};

function FixedIncomeSection({ investments, onDelete, onSave, embedded = false, entryOpen = false, onCancelEntry }) {
  const [showForm, setShowForm] = useState(embedded || entryOpen);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm, purchaseDate: getToday() });
    setFormError("");
    onCancelEntry?.();
  }

  function startEditing(investment) {
    setEditingId(investment.id);
    setForm({
      name: investment.name,
      category: investment.category,
      issuer: investment.issuer,
      indexer: investment.indexer,
      annualRate: String(investment.annualRate),
      amountInvested: String(investment.amountInvested),
      currentAmount: investment.currentAmount === null ? "" : String(investment.currentAmount),
      purchaseDate: investment.purchaseDate,
      maturityDate: investment.maturityDate ?? "",
      liquidity: investment.liquidity ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.issuer.trim() || !form.purchaseDate) {
      setFormError("Preencha nome, instituição e data da aplicação.");
      return;
    }
    if (Number(form.amountInvested) <= 0 || Number(form.annualRate || 0) < 0) {
      setFormError("Informe valores válidos para a aplicação.");
      return;
    }
    if (form.currentAmount && Number(form.currentAmount) < 0) {
      setFormError("O valor atual não pode ser negativo.");
      return;
    }
    if (form.maturityDate && form.maturityDate < form.purchaseDate) {
      setFormError("O vencimento não pode ser anterior à aplicação.");
      return;
    }

    setIsSaving(true);
    const error = await onSave({
      ...form,
      name: form.name.trim(),
      issuer: form.issuer.trim(),
      annualRate: Number(form.annualRate || 0),
      amountInvested: Number(form.amountInvested),
      currentAmount: form.currentAmount === "" ? null : Number(form.currentAmount),
      liquidity: form.liquidity.trim(),
    }, editingId);
    setIsSaving(false);

    if (error) {
      setFormError(error);
      return;
    }
    closeForm();
  }

  async function confirmDelete() {
    setIsDeleting(true);
    const error = await onDelete(itemToDelete.id);
    setIsDeleting(false);

    if (error) {
      setDeleteError(error);
      return;
    }
    setItemToDelete(null);
  }

  const formContent = showForm ? (
    <form className="fixed-income-form" noValidate onSubmit={handleSubmit}>
      <label className="form-field" htmlFor="fixed-income-name">Nome do investimento *<input id="fixed-income-name" name="name" onChange={updateField} placeholder="Ex.: Tesouro Selic 2029" value={form.name} /></label>
      <label className="form-field" htmlFor="fixed-income-category">Tipo *<select id="fixed-income-category" name="category" onChange={updateField} value={form.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="form-field" htmlFor="fixed-income-issuer">Instituição ou emissor *<input id="fixed-income-issuer" name="issuer" onChange={updateField} value={form.issuer} /></label>
      <label className="form-field" htmlFor="fixed-income-indexer">Indexador *<select id="fixed-income-indexer" name="indexer" onChange={updateField} value={form.indexer}>{indexers.map((indexer) => <option key={indexer}>{indexer}</option>)}</select></label>
      <label className="form-field" htmlFor="fixed-income-rate">Taxa adicional ao ano (%)<input id="fixed-income-rate" min="0" name="annualRate" onChange={updateField} placeholder="Ex.: 0,15" step="0.01" type="number" value={form.annualRate} /></label>
      <label className="form-field" htmlFor="fixed-income-amount">Valor aplicado *<input id="fixed-income-amount" min="0.01" name="amountInvested" onChange={updateField} step="0.01" type="number" value={form.amountInvested} /></label>
      <label className="form-field" htmlFor="fixed-income-current">Valor atual<input id="fixed-income-current" min="0" name="currentAmount" onChange={updateField} placeholder="Atualização manual" step="0.01" type="number" value={form.currentAmount} /></label>
      <label className="form-field" htmlFor="fixed-income-purchase-date">Data da aplicação *<input id="fixed-income-purchase-date" name="purchaseDate" onChange={updateField} type="date" value={form.purchaseDate} /></label>
      <label className="form-field" htmlFor="fixed-income-maturity-date">Vencimento<input id="fixed-income-maturity-date" min={form.purchaseDate} name="maturityDate" onChange={updateField} type="date" value={form.maturityDate} /></label>
      <label className="form-field form-field-wide" htmlFor="fixed-income-liquidity">Liquidez<input id="fixed-income-liquidity" name="liquidity" onChange={updateField} placeholder="Ex.: diária ou somente no vencimento" value={form.liquidity} /></label>
      <div className="form-actions">{formError && <span className="form-submit-error">{formError}</span>}<button className="secondary-button" onClick={closeForm} type="button">Cancelar</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar aplicação"}</button></div>
    </form>
  ) : null;

  if (embedded) return <section className="panel embedded-fixed-income-entry">{formContent}</section>;

  return (
    <CollapsibleSection
      actions={null}
      className="fixed-income"
      description="Tesouro Direto, CDBs e outros títulos cadastrados manualmente."
      forceOpen={showForm}
      meta={`${investments.length} ${investments.length === 1 ? "aplicação" : "aplicações"}`}
      title="Tesouro e renda fixa"
    >
      {showForm ? (
        <form className="fixed-income-form" noValidate onSubmit={handleSubmit}>
          <label className="form-field" htmlFor="fixed-income-name">Nome do investimento *
            <input id="fixed-income-name" name="name" onChange={updateField} placeholder="Ex.: Tesouro Selic 2029" value={form.name} />
          </label>
          <label className="form-field" htmlFor="fixed-income-category">Tipo *
            <select id="fixed-income-category" name="category" onChange={updateField} value={form.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
          </label>
          <label className="form-field" htmlFor="fixed-income-issuer">Instituição ou emissor *
            <input id="fixed-income-issuer" name="issuer" onChange={updateField} value={form.issuer} />
          </label>
          <label className="form-field" htmlFor="fixed-income-indexer">Indexador *
            <select id="fixed-income-indexer" name="indexer" onChange={updateField} value={form.indexer}>{indexers.map((indexer) => <option key={indexer}>{indexer}</option>)}</select>
          </label>
          <label className="form-field" htmlFor="fixed-income-rate">Taxa adicional ao ano (%)
            <input id="fixed-income-rate" min="0" name="annualRate" onChange={updateField} placeholder="Ex.: 0,15" step="0.01" type="number" value={form.annualRate} />
          </label>
          <label className="form-field" htmlFor="fixed-income-amount">Valor aplicado *
            <input id="fixed-income-amount" min="0.01" name="amountInvested" onChange={updateField} step="0.01" type="number" value={form.amountInvested} />
          </label>
          <label className="form-field" htmlFor="fixed-income-current">Valor atual
            <input id="fixed-income-current" min="0" name="currentAmount" onChange={updateField} placeholder="Atualização manual" step="0.01" type="number" value={form.currentAmount} />
          </label>
          <label className="form-field" htmlFor="fixed-income-purchase-date">Data da aplicação *
            <input id="fixed-income-purchase-date" name="purchaseDate" onChange={updateField} type="date" value={form.purchaseDate} />
          </label>
          <label className="form-field" htmlFor="fixed-income-maturity-date">Vencimento
            <input id="fixed-income-maturity-date" min={form.purchaseDate} name="maturityDate" onChange={updateField} type="date" value={form.maturityDate} />
          </label>
          <label className="form-field form-field-wide" htmlFor="fixed-income-liquidity">Liquidez
            <input id="fixed-income-liquidity" name="liquidity" onChange={updateField} placeholder="Ex.: diária ou somente no vencimento" value={form.liquidity} />
          </label>
          <div className="form-actions">
            {formError && <span className="form-submit-error">{formError}</span>}
            <button className="secondary-button" onClick={closeForm} type="button">Cancelar</button>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar aplicação"}</button>
          </div>
        </form>
      ) : investments.length > 0 ? (
        <div className="fixed-income-cards">
          {investments.map((investment) => {
            const currentValue = investment.currentAmount ?? investment.amountInvested;
            const result = currentValue - investment.amountInvested;
            return (
              <article className="fixed-income-card" key={investment.id}>
                <div className="fixed-income-card-heading">
                  <div><span>{investment.category}</span><h3>{investment.name}</h3><small>{investment.issuer}</small></div>
                  <strong>{currencyFormatter.format(currentValue)}</strong>
                </div>
                <div className="fixed-income-details">
                  <span>Aplicado<strong>{currencyFormatter.format(investment.amountInvested)}</strong></span>
                  <span>Rentabilidade<strong>{investment.indexer}{investment.annualRate > 0 ? ` + ${investment.annualRate.toFixed(2)}% a.a.` : ""}</strong></span>
                  <span>Vencimento<strong>{formatDate(investment.maturityDate)}</strong></span>
                </div>
                <div className="investment-card-footer">
                  <span className={result < 0 ? "expense-text" : "income-text"}>{investment.currentAmount === null ? "Valor atual ainda não informado" : `${currencyFormatter.format(result)} de resultado`}</span>
                  <div><button className="edit-button" onClick={() => startEditing(investment)} type="button">Editar</button><button className="delete-button" onClick={() => { setItemToDelete(investment); setDeleteError(""); }} type="button">Excluir</button></div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <p className="empty-message">Nenhuma aplicação de renda fixa cadastrada.</p>}

      <ConfirmDialog confirmLabel="Excluir aplicação" error={deleteError} isLoading={isDeleting} isOpen={Boolean(itemToDelete)} message={itemToDelete ? `A aplicação “${itemToDelete.name}” será removida.` : ""} onCancel={() => setItemToDelete(null)} onConfirm={confirmDelete} title="Excluir aplicação?" />
    </CollapsibleSection>
  );
}

export default FixedIncomeSection;
