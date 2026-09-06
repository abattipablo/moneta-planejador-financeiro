function Overview() {
  return (
    <div>
      {/* Dados fixos por enquanto; depois virão dos lançamentos e do Supabase. */}
      <header>
        <h1>Olá Pablo</h1>
        <p>Seu panorama financeiro em Setembro</p>
      </header>
      <section className="summary-grid">
        <div className="summary-card">
          <p className="card-label">Saldo em contas</p>
          <p className="card-value">R$ 8.420,00</p>
          <p className="card-detail positive">↑ R$ 1.340 neste mês</p>
        </div>
        <div className="summary-card">
          <p className="card-label">Despesas do mês</p>
          <p className="card-value">R$ 2.680,00</p>
          <p className="card-detail">72% do orçamento usado</p>
        </div>
        <div className="summary-card">
          <p className="card-label">Patrimônio total</p>
          <p className="card-value">R$ 42.860,00</p>
          <p className="card-detail">↑ 4,8% em 12 meses</p>
        </div>
      </section>
    </div>
  );
}

export default Overview;
