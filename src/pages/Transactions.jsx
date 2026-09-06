// Dados de teste até a integração com o banco de dados.
const transactions = [
  {
    id: 1,
    description: "teste",
    category: "pessoal",
    value: 2500,
    type: "income",
  },
  {
    id: 2,
    description: "Supermercado",
    category: "Alimentação",
    value: 186.4,
    type: "expense",
  },
  {
    id: 3,
    description: "Netflix",
    category: "Assinaturas",
    value: 39.9,
    type: "expense",
  },
];

function Transactions() {
  return (
    <div>
      <header>
        <h1>Lançamentos</h1>
        <p>Adicione aqui seus lançamentos</p>
      </header>
      <div>
        <ul>
          {/* Para cada objeto, cria um item visual na lista. */}
          {transactions.map((transaction) => (
            // O id identifica cada item de forma única para o React.
            <li key={transaction.id}>
              {transaction.description} - {transaction.category} -{" "}
              {transaction.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Transactions;
