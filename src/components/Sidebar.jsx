const menuItems = [
  { compactLabel: "VG", label: "Visão Geral" },
  { compactLabel: "LA", label: "Lançamentos" },
  { compactLabel: "CO", label: "Contas" },
  { compactLabel: "OR", label: "Orçamentos" },
  { compactLabel: "ME", label: "Metas" },
  { compactLabel: "IN", label: "Investimentos" },
];

function Sidebar({
  activePage,
  onNavigate,
  onSignOut,
  onToggleTheme,
  onToggleSize,
  sidebarSize,
  theme,
  user,
}) {
  const userName = user.email?.split("@")[0] ?? "Usuário";
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <h1>{sidebarSize === "compact" ? "M" : "Moneta"}</h1>
          <span>PLANEJADOR PESSOAL</span>
        </div>
        <button
          className="sidebar-size-button"
          onClick={onToggleSize}
          title={sidebarSize === "expanded" ? "Menu compacto" : "Menu expandido"}
          type="button"
        >
          <span
            aria-hidden="true"
            className={`sidebar-chevron ${sidebarSize === "compact" ? "is-compact" : ""}`}
          />
        </button>
      </div>

      <nav className="navigation" aria-label="Navegação principal">
        {/* Cria um botão para cada página disponível no menu. */}
        {menuItems.map((item) => (
          <button
            aria-label={item.label}
            className={activePage === item.label ? "nav-item active" : "nav-item"}
            key={item.label}
            onClick={() => onNavigate(item.label)}
            title={sidebarSize === "compact" ? item.label : undefined}
            type="button"
          >
            {sidebarSize === "compact" ? (
              <span aria-hidden="true" className="nav-short-label">
                {item.compactLabel}
              </span>
            ) : item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
          className="theme-button"
          onClick={onToggleTheme}
          title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
          type="button"
        >
          <span aria-hidden="true" className="theme-button-indicator" />
          <strong>{theme === "light" ? "Modo escuro" : "Modo claro"}</strong>
        </button>
        <div className="profile">
          <span>{initials}</span>
          <div>
            <strong>{userName}</strong>
            <button className="sign-out-button" onClick={onSignOut} type="button">
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
