const menuItems = [
  "Visão Geral",
  "Lançamentos",
  "Contas",
  "Orçamentos",
  "Metas",
  "Investimentos",
];

function Sidebar({ activePage, onNavigate, onSignOut, user }) {
  const userName = user.email?.split("@")[0] ?? "Usuário";
  const initials = userName.slice(0, 2).toUpperCase();

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
        <span>{initials}</span>
        <div>
          <strong>{userName}</strong>
          <button className="sign-out-button" onClick={onSignOut} type="button">
            Sair da conta
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
