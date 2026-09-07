const menuItems = [
  "Visão Geral",
  "Lançamentos",
  "Contas",
  "Orçamentos",
  "Metas",
  "Investimentos",
];

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Moneta</h1>
        <span>PLANEJADOR PESSOAL</span>
      </div>

      <nav className="navigation" aria-label="Navegação principal">
        {/* Cria um botão para cada página disponível no menu. */}
        {menuItems.map((item) => (
          <button
            className={activePage === item ? "nav-item active" : "nav-item"}
            key={item}
            onClick={() => onNavigate(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="profile">
        <span>PA</span>
        <div>
          <strong>Pablo</strong>
          <small>Minha conta</small>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
