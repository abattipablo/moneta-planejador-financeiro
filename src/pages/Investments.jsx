import { useState } from "react";
import CollapsibleSection from "../components/CollapsibleSection";
import ConfirmDialog from "../components/ConfirmDialog";
import FixedIncomeSection from "../components/FixedIncomeSection";

const investmentTypes = ["Ações", "Fundos imobiliários", "ETFs", "Outros"];
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const quantityFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 8 });

function getToday() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`));
}

function formatQuoteDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

// Refaz a posição usando todas as compras e vendas na ordem em que aconteceram.
function calculatePosition(investment, operations, quote) {
  const assetOperations = operations
    .filter((operation) => operation.investmentId === investment.id)
    .sort((first, second) => {
      const dateOrder = first.operationDate.localeCompare(second.operationDate);
      return dateOrder || first.createdAt.localeCompare(second.createdAt);
    });
  let totalQuantity = 0;
  let positionCost = 0;
  let realizedResult = 0;

  assetOperations.forEach((operation) => {
    if (operation.operationType === "buy") {
      totalQuantity += operation.quantity;
      positionCost += operation.quantity * operation.unitPrice + operation.fees;
      return;
    }

    const averagePrice = totalQuantity > 0 ? positionCost / totalQuantity : 0;
    const removedCost = averagePrice * operation.quantity;
    const saleValue = operation.quantity * operation.unitPrice - operation.fees;
    totalQuantity -= operation.quantity;
    positionCost -= removedCost;
    realizedResult += saleValue - removedCost;
    if (totalQuantity === 0) positionCost = 0;
  });

  const averagePrice = totalQuantity > 0 ? positionCost / totalQuantity : 0;
  const currentPrice = quote?.price ?? null;
  const currentValue = currentPrice === null ? null : totalQuantity * currentPrice;
  const unrealizedResult = currentValue === null ? 0 : currentValue - positionCost;

  return { ...investment, assetOperations, averagePrice, currentPrice, currentValue, positionCost, realizedResult, totalQuantity, unrealizedResult };
}

function getAvailableQuantity(position, date) {
  if (!position) return 0;

  return position.assetOperations
    .filter((operation) => operation.operationDate <= date)
    .reduce(
      (total, operation) => total + (
        operation.operationType === "buy" ? operation.quantity : -operation.quantity
      ),
      0,
    );
}

function leavesNegativeBalance(position, operationToSave, editingId) {
  let balance = 0;
  const operations = [
    ...position.assetOperations.filter((operation) => operation.id !== editingId),
    operationToSave,
  ].sort((first, second) => {
    const dateOrder = first.operationDate.localeCompare(second.operationDate);
    return dateOrder || first.createdAt.localeCompare(second.createdAt);
  });

  return operations.some((operation) => {
    balance += operation.operationType === "buy"
      ? operation.quantity
      : -operation.quantity;
    return balance < 0;
  });
}

function Investments({ fixedIncomeInvestments, investmentDividends, investmentOperations, investmentQuotes, investments, onAddOperation, onDeleteFixedIncome, onDeleteInvestment, onDeleteOperation, onGetMarketIndicators, onGetQuotes, onRefreshDividends, onSaveFixedIncome, onUpdateOperation }) {
  const [showForm, setShowForm] = useState(false);
  const [operationType, setOperationType] = useState("buy");
  const [ticker, setTicker] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [type, setType] = useState("Ações");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [fees, setFees] = useState("");
  const [operationDate, setOperationDate] = useState(getToday());
  const [quoteError, setQuoteError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingDividends, setIsRefreshingDividends] = useState(false);
  const [isRefreshingIndicators, setIsRefreshingIndicators] = useState(false);
  const [marketIndicators, setMarketIndicators] = useState([]);
  const [marketDataError, setMarketDataError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingOperation, setEditingOperation] = useState(null);
  const [investmentToDelete, setInvestmentToDelete] = useState(null);
  const [operationToDelete, setOperationToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const positions = investments.map((investment) => calculatePosition(investment, investmentOperations, investmentQuotes[investment.ticker]));
  const openPositions = positions.filter((position) => position.totalQuantity > 0);
  const variableIncomeInvested = openPositions.reduce((total, position) => total + position.positionCost, 0);
  const variableIncomeCurrent = openPositions.reduce((total, position) => total + (position.currentValue ?? position.positionCost), 0);
  const fixedIncomeInvested = fixedIncomeInvestments.reduce((total, investment) => total + investment.amountInvested, 0);
  const fixedIncomeCurrent = fixedIncomeInvestments.reduce((total, investment) => total + (investment.currentAmount ?? investment.amountInvested), 0);
  const totalInvested = variableIncomeInvested + fixedIncomeInvested;
  const currentTotal = variableIncomeCurrent + fixedIncomeCurrent;
  const realizedResult = positions.reduce((total, position) => total + position.realizedResult, 0);
  const unrealizedResult = openPositions.reduce((total, position) => total + position.unrealizedResult, 0);
  const fixedIncomeResult = fixedIncomeCurrent - fixedIncomeInvested;
  const totalReturn = realizedResult + unrealizedResult + fixedIncomeResult;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const lastQuoteUpdate = Object.values(investmentQuotes)
    .map((quote) => quote.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  const dividendEntries = investmentDividends.map((dividend) => {
    const position = positions.find((item) => item.id === dividend.investmentId);
    const eligibleQuantity = getAvailableQuantity(position, dividend.eventDate);
    return {
      ...dividend,
      eligibleQuantity,
      estimatedValue: eligibleQuantity * dividend.amountPerUnit,
      ticker: position?.ticker,
    };
  }).filter((dividend) => dividend.eligibleQuantity > 0);
  const totalDividends = dividendEntries.reduce(
    (total, dividend) => total + dividend.estimatedValue,
    0,
  );

  function resetForm() {
    setOperationType("buy");
    setTicker("");
    setSelectedQuote(null);
    setType("Ações");
    setQuantity("");
    setUnitPrice("");
    setFees("");
    setOperationDate(getToday());
    setQuoteError("");
    setFormError("");
    setIsSaving(false);
    setEditingOperation(null);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  async function searchTicker() {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker) return;
    setIsSearching(true);
    setQuoteError("");
    setSelectedQuote(null);
    const existingInvestment = investments.find((investment) => investment.ticker === normalizedTicker);
    const result = await onGetQuotes([normalizedTicker]);

    if (result.error || result.quotes.length === 0) {
      setQuoteError(result.error ?? "Ticker não encontrado na brapi.");
      setIsSearching(false);
      return;
    }

    const quote = result.quotes[0];
    setSelectedQuote({ ...quote, name: existingInvestment?.name ?? quote.name });
    setTicker(quote.ticker);
    setType(existingInvestment?.type ?? "Ações");
    setUnitPrice(String(quote.price));
    setIsSearching(false);
  }

  async function refreshPrices() {
    if (openPositions.length === 0) return;
    setIsRefreshing(true);
    setQuoteError("");
    const result = await onGetQuotes(openPositions.map((position) => position.ticker));
    if (result.error) setQuoteError(result.error);
    setIsRefreshing(false);
  }

  async function refreshIndicators() {
    setIsRefreshingIndicators(true);
    setMarketDataError("");
    const result = await onGetMarketIndicators();
    if (result.error) setMarketDataError(result.error);
    else setMarketIndicators(result.indicators);
    setIsRefreshingIndicators(false);
  }

  async function refreshDividends() {
    const purchases = investmentOperations.filter(
      (operation) => operation.operationType === "buy",
    );
    if (purchases.length === 0) return;

    const startDate = purchases
      .map((operation) => operation.operationDate)
      .sort()[0];
    const tickers = [...new Set(investments.map((investment) => investment.ticker))];

    setIsRefreshingDividends(true);
    setMarketDataError("");
    const result = await onRefreshDividends(tickers, startDate);
    if (result.error) setMarketDataError(result.error);
    setIsRefreshingDividends(false);
  }

  function startOperation(position, nextOperationType) {
    setOperationType(nextOperationType);
    setTicker(position.ticker);
    setSelectedQuote({ ticker: position.ticker, name: position.name, price: position.currentPrice });
    setType(position.type);
    setUnitPrice(position.currentPrice === null ? "" : String(position.currentPrice));
    setShowForm(true);
  }

  function startEditing(operation) {
    const investment = investments.find((item) => item.id === operation.investmentId);
    const position = positions.find((item) => item.id === operation.investmentId);

    setEditingOperation(operation);
    setOperationType(operation.operationType);
    setTicker(investment.ticker);
    setSelectedQuote({ ticker: investment.ticker, name: investment.name, price: position.currentPrice });
    setType(investment.type);
    setQuantity(String(operation.quantity));
    setUnitPrice(String(operation.unitPrice));
    setFees(operation.fees ? String(operation.fees) : "");
    setOperationDate(operation.operationDate);
    setQuoteError("");
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (!selectedQuote) {
      setFormError("Busque e confirme o ticker antes de salvar.");
      return;
    }

    if (!operationDate || quantity === "" || unitPrice === "" || Number(quantity) <= 0 || Number(unitPrice) <= 0 || Number(fees || 0) < 0) {
      setFormError("Preencha os valores da operação corretamente.");
      return;
    }

    const selectedPosition = positions.find((position) => position.ticker === selectedQuote.ticker);
    const positionWithoutEditedOperation = editingOperation
      ? { ...selectedPosition, assetOperations: selectedPosition.assetOperations.filter((operation) => operation.id !== editingOperation.id) }
      : selectedPosition;
    const availableQuantity = getAvailableQuantity(positionWithoutEditedOperation, operationDate);
    if (operationType === "sell" && Number(quantity) > availableQuantity) {
      setFormError(`Você tinha ${quantityFormatter.format(availableQuantity)} unidades disponíveis nessa data.`);
      return;
    }

    const operationToSave = {
      createdAt: editingOperation?.createdAt ?? new Date().toISOString(),
      operationDate,
      operationType,
      quantity: Number(quantity),
    };
    if (selectedPosition && leavesNegativeBalance(selectedPosition, operationToSave, editingOperation?.id)) {
      setFormError("Essa alteração deixaria uma venda posterior sem quantidade disponível.");
      return;
    }

    setIsSaving(true);
    const operationData = { fees: Number(fees || 0), name: selectedQuote.name, operationDate, operationType, quantity: Number(quantity), ticker: selectedQuote.ticker, type, unitPrice: Number(unitPrice) };
    const error = editingOperation
      ? await onUpdateOperation(editingOperation.id, operationData)
      : await onAddOperation(operationData);
    if (error) {
      setFormError(error);
      setIsSaving(false);
      return;
    }
    closeForm();
  }

  async function confirmDelete() {
    setIsDeleting(true);
    const error = investmentToDelete
      ? await onDeleteInvestment(investmentToDelete.id)
      : await onDeleteOperation(operationToDelete.id);
    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }
    setInvestmentToDelete(null);
    setOperationToDelete(null);
    setIsDeleting(false);
  }

  const isSale = operationType === "sell";

  return (
    <section className="investments-page">
      <header className="page-header">
        <div><h1>Investimentos</h1><p>Acompanhe seu patrimônio, preço médio e rentabilidade.</p></div>
        {!showForm && (
          <div className="investment-header-actions">
            <button className="secondary-button" disabled={isRefreshing || openPositions.length === 0} onClick={refreshPrices} type="button">{isRefreshing ? "Atualizando..." : "Atualizar preços"}</button>
            <button className="primary-button" onClick={() => setShowForm(true)} type="button">+ Registrar compra</button>
          </div>
        )}
      </header>

      {quoteError && !showForm && <p className="data-error" role="alert">{quoteError}</p>}
      {marketDataError && !showForm && <p className="data-error" role="alert">{marketDataError}</p>}

      {showForm ? (
        <form className="investment-form panel" noValidate onSubmit={handleSubmit}>
          <div className="form-heading"><h2>{editingOperation ? "Editar" : "Registrar"} {isSale ? "venda" : "compra"}</h2><p>Informe os dados reais da sua operação.</p></div>

          <label className="form-field investment-ticker-field" htmlFor="investment-ticker">Ticker *
            <div>
              <input disabled={isSale || Boolean(editingOperation)} id="investment-ticker" maxLength="12" onChange={(event) => { setTicker(event.target.value.toUpperCase()); setSelectedQuote(null); }} placeholder="Ex.: PETR4" required type="text" value={ticker} />
              {!isSale && !editingOperation && <button className="secondary-button" disabled={isSearching} onClick={searchTicker} type="button">{isSearching ? "Buscando..." : "Buscar"}</button>}
            </div>
            {quoteError && <span className="form-error">{quoteError}</span>}
          </label>

          <div className="investment-quote-preview">
            {selectedQuote ? <><strong>{selectedQuote.name}</strong><span>{selectedQuote.ticker} · Cotação: {selectedQuote.price === null ? "não atualizada" : currencyFormatter.format(selectedQuote.price)}</span></> : <span>Busque um ticker para confirmar o ativo e a cotação.</span>}
          </div>

          <label className="form-field" htmlFor="investment-type">Tipo *
            <select disabled={isSale || Boolean(editingOperation)} id="investment-type" onChange={(event) => setType(event.target.value)} required value={type}>{investmentTypes.map((investmentType) => <option key={investmentType}>{investmentType}</option>)}</select>
          </label>
          <label className="form-field" htmlFor="investment-quantity">Quantidade {isSale ? "vendida" : "comprada"} *
            <input id="investment-quantity" min="0.00000001" onChange={(event) => setQuantity(event.target.value)} required step="0.00000001" type="number" value={quantity} />
          </label>
          <label className="form-field" htmlFor="investment-unit-price">Preço {isSale ? "recebido" : "pago"} por unidade *
            <input id="investment-unit-price" min="0" onChange={(event) => setUnitPrice(event.target.value)} required step="0.01" type="number" value={unitPrice} />
          </label>
          <label className="form-field" htmlFor="investment-date">Data da {isSale ? "venda" : "compra"} *
            <input id="investment-date" onChange={(event) => setOperationDate(event.target.value)} required type="date" value={operationDate} />
          </label>
          <label className="form-field" htmlFor="investment-fees">Taxas
            <input id="investment-fees" min="0" onChange={(event) => setFees(event.target.value)} placeholder="0,00" step="0.01" type="number" value={fees} />
          </label>

          <div className="form-actions">
            {formError && <span className="form-submit-error">{formError}</span>}
            <button className="secondary-button" onClick={closeForm} type="button">Cancelar</button>
            <button className="primary-button" disabled={isSaving || !selectedQuote} type="submit">{isSaving ? "Salvando..." : editingOperation ? "Salvar alterações" : `Salvar ${isSale ? "venda" : "compra"}`}</button>
          </div>
        </form>
      ) : (
        <>
          <section className="investment-totals" aria-label="Resumo dos investimentos">
            <article><span>Custo da posição</span><strong>{currencyFormatter.format(totalInvested)}</strong></article>
            <article><span>Patrimônio atual</span><strong>{currencyFormatter.format(currentTotal)}</strong></article>
            <article><span>Resultado total</span><strong className={totalReturn < 0 ? "expense-text" : "income-text"}>{currencyFormatter.format(totalReturn)}</strong><small className={totalReturn < 0 ? "expense-text" : "income-text"}>Vendas: {currencyFormatter.format(realizedResult)} · Carteira: {returnPercentage.toFixed(2)}%</small></article>
          </section>

          <FixedIncomeSection investments={fixedIncomeInvestments} onDelete={onDeleteFixedIncome} onSave={onSaveFixedIncome} />

          <CollapsibleSection
            actions={<button className="secondary-button" disabled={isRefreshingIndicators} onClick={refreshIndicators} type="button">{isRefreshingIndicators ? "Atualizando..." : "Atualizar indicadores"}</button>}
            className="market-indicators"
            description="Selic, CDI e IPCA para comparar seus investimentos."
            meta={marketIndicators.length > 0 ? `${marketIndicators.length} indicadores` : "Não atualizado"}
            title="Indicadores"
          >
            {marketIndicators.length > 0 ? (
              <div className="market-indicator-cards">
                {marketIndicators.map((indicator) => (
                  <article key={indicator.key}><span>{indicator.name}</span><strong>{Number(indicator.value).toFixed(2)}%</strong><small>{indicator.unit} · ref. {indicator.referenceDate}</small></article>
                ))}
              </div>
            ) : <p className="empty-message">Clique em atualizar para consultar Selic, CDI e IPCA.</p>}
          </CollapsibleSection>

          <CollapsibleSection
            actions={<button className="secondary-button" disabled={isRefreshingDividends || investmentOperations.length === 0} onClick={refreshDividends} type="button">{isRefreshingDividends ? "Atualizando..." : "Atualizar dividendos"}</button>}
            className="investment-dividends"
            description="Proventos estimados conforme sua posição em cada data."
            meta={currencyFormatter.format(totalDividends)}
            title="Dividendos"
          >
            <div className="dividend-summary"><span>Total estimado</span><strong>{currencyFormatter.format(totalDividends)}</strong></div>
            {dividendEntries.length > 0 ? (
              <div className="dividend-list">
                {dividendEntries.map((dividend) => (
                  <div className="dividend-row" key={dividend.id}>
                    <div><strong>{dividend.ticker}</strong><span>{formatDate(dividend.eventDate)} · {quantityFormatter.format(dividend.eligibleQuantity)} unidades</span></div>
                    <div><strong>{currencyFormatter.format(dividend.estimatedValue)}</strong><span>{currencyFormatter.format(dividend.amountPerUnit)} por unidade</span></div>
                  </div>
                ))}
              </div>
            ) : <p className="empty-message">Nenhum dividendo encontrado para sua posição.</p>}
            <p className="dividend-disclaimer">Estimativa baseada em dados do Yahoo Finance. Confirme os valores líquidos no extrato da corretora.</p>
          </CollapsibleSection>

          <CollapsibleSection
            className="investment-list"
            defaultOpen
            description={`Cotações atualizadas manualmente.${lastQuoteUpdate ? ` Última atualização: ${formatQuoteDate(lastQuoteUpdate)}.` : ""}`}
            meta={`${openPositions.length} ${openPositions.length === 1 ? "ativo" : "ativos"}`}
            title="Sua carteira"
          >
            {openPositions.length > 0 ? (
              <div className="investment-cards">
                {openPositions.map((position) => {
                  const percentage = position.positionCost > 0 ? (position.unrealizedResult / position.positionCost) * 100 : 0;
                  return (
                    <article className="investment-card" key={position.id}>
                      <div className="investment-card-heading"><div><span>{position.type}</span><h3>{position.name}</h3><small>{position.ticker}</small></div><strong>{position.currentValue === null ? "Preço não atualizado" : currencyFormatter.format(position.currentValue)}</strong></div>
                      <div className="investment-details"><span>Quantidade <strong>{quantityFormatter.format(position.totalQuantity)}</strong></span><span>Preço médio <strong>{currencyFormatter.format(position.averagePrice)}</strong></span><span>Preço atual <strong>{position.currentPrice === null ? "—" : currencyFormatter.format(position.currentPrice)}</strong></span></div>
                      <div className="investment-card-footer"><span className={position.unrealizedResult < 0 ? "expense-text" : "income-text"}>{position.currentPrice === null ? "Atualize para calcular o resultado" : `${currencyFormatter.format(position.unrealizedResult)} (${percentage.toFixed(2)}%)`}</span><div><button className="portfolio-action portfolio-buy" onClick={() => startOperation(position, "buy")} type="button">+ Compra</button><button className="portfolio-action portfolio-sell" onClick={() => startOperation(position, "sell")} type="button">Venda</button><button className="portfolio-action portfolio-delete" onClick={() => { setInvestmentToDelete(position); setDeleteError(""); }} type="button">Excluir</button></div></div>
                    </article>
                  );
                })}
              </div>
            ) : <p className="empty-message">Nenhum ativo com posição aberta.</p>}
          </CollapsibleSection>

          {investmentOperations.length > 0 && (
            <CollapsibleSection
              className="investment-history"
              description="Compras e vendas registradas na carteira."
              meta={`${investmentOperations.length} operações`}
              title="Histórico de operações"
            >
              {investmentOperations.map((operation) => {
                const investment = investments.find((item) => item.id === operation.investmentId);
                const isOperationSale = operation.operationType === "sell";
                const operationValue = operation.quantity * operation.unitPrice + (isOperationSale ? -operation.fees : operation.fees);
                return <div className="investment-operation" key={operation.id}><div><strong>{investment?.ticker} · {isOperationSale ? "Venda" : "Compra"}</strong><span>{quantityFormatter.format(operation.quantity)} unidades · {formatDate(operation.operationDate)}</span></div><div><strong className={isOperationSale ? "income-text" : ""}>{currencyFormatter.format(operationValue)}</strong><button className="edit-button" onClick={() => startEditing(operation)} type="button">Editar</button><button className="delete-button" onClick={() => { setOperationToDelete(operation); setDeleteError(""); }} type="button">Excluir</button></div></div>;
              })}
            </CollapsibleSection>
          )}
        </>
      )}

      <ConfirmDialog confirmLabel={investmentToDelete ? "Excluir ativo" : "Excluir operação"} error={deleteError} isLoading={isDeleting} isOpen={Boolean(investmentToDelete || operationToDelete)} message={investmentToDelete ? `O ativo "${investmentToDelete.name}" e seu histórico serão removidos.` : "A operação será removida e todos os valores serão recalculados."} onCancel={() => { setInvestmentToDelete(null); setOperationToDelete(null); }} onConfirm={confirmDelete} title={investmentToDelete ? "Excluir ativo?" : "Excluir operação?"} />
    </section>
  );
}

export default Investments;
