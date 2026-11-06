import { shortAddress } from "../utils";

export default function Dashboard({ account, onSelectRole }) {
  return (
    <div className="card">
      <h2>Dashboard</h2>
      <p>
        Connected wallet: <strong title={account}>{shortAddress(account)}</strong>
      </p>
      <p>Choose how you want to use the platform:</p>
      <div className="role-buttons">
        <button onClick={() => onSelectRole("lender")}>I am a Lender</button>
        <button onClick={() => onSelectRole("borrower")}>I am a Borrower</button>
      </div>
    </div>
  );
}