const menuItems = [
  "Visão Geral",
  "Lançamentos",
  "Contas",
  "Orçamentos",
  "Metas",
  "Investimentos",
];

function Sidebar({
  activePage,
  onNavigate,
  onSignOut,
  onToggleSize,
  onHide,
  sidebarSize,
  user,
}) {
  const userName = user.email?.split("@")[0] ?? "Usuário";
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <h1>Moneta</h1>
          <span>PLANEJADOR PESSOAL</span>
        </div>
        <button
          className="sidebar-size-button"
          onClick={onToggleSize}
          title={sidebarSize === "expanded" ? "Menu compacto" : "Menu expandido"}
          type="button"
        >
          {sidebarSize === "expanded" ? "‹" : "›"}
        </button>
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

      <div className="sidebar-footer">
        <div className="profile">
          <span>{initials}</span>
          <div>
            <strong>{userName}</strong>
            <button className="sign-out-button" onClick={onSignOut} type="button">
              Sair da conta
            </button>
          </div>
        </div>
        <button className="sidebar-hide-button" onClick={onHide} type="button">
          Ocultar menu
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
