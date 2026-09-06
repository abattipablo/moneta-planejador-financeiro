import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Transactions from "./pages/Transactions";

function App() {
  // Guarda o nome da página selecionada no menu.
  const [activePage, setActivePage] = useState("Visão geral");
  return (
    <>
      <div className="app">
        {/* O menu recebe o estado atual e uma função para trocar de página. */}
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="content">
          {/* Cada condição mostra somente a página selecionada. */}
          {activePage === "Visão Geral" && <Overview />}
          {activePage === "Lançamentos" && <Transactions />}
        </main>
      </div>
    </>
  );
}

export default App;
