// Lista única usada para criar os botões do menu.
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
      <h1>Moneta</h1>
      <nav className="navigation">
        {/* Cria um botão para cada item da lista. */}
        {menuItems.map((item) => (
          <button
            key={item}
            className={activePage === item ? "nav-item active" : "nav-item"}
            onClick={() => onNavigate(item)}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
