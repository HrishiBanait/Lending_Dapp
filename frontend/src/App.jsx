import { useState } from "react";
import "./App.css";
import useWallet from "./useWallet";
import Dashboard from "./pages/Dashboard";
import LenderDashboard from "./pages/LenderDashboard";
import BorrowerDashboard from "./pages/BorrowerDashboard";
import LoanHistory from "./pages/LoanHistory";
import { shortAddress } from "./utils";

function App() {
  const { account, contract, wrongNetwork, hasMetaMask, error, connect, disconnect, switchToSepolia } =
    useWallet();
  const [page, setPage] = useState("dashboard");

  const handleDisconnect = async () => {
    await disconnect();
    setPage("dashboard");
  };

  const renderPage = () => {
    if (page === "lender") return <LenderDashboard account={account} contract={contract} />;
    if (page === "borrower") return <BorrowerDashboard account={account} contract={contract} />;
    if (page === "history") return <LoanHistory contract={contract} />;
    return <Dashboard account={account} onSelectRole={setPage} />;
  };

  return (
    <div className="container">
      <header>
        <h1>P2P Lending Platform</h1>
        {account && (
          <div className="header-right">
            <span className="wallet-chip">{shortAddress(account)}</span>
            <button className="secondary" onClick={handleDisconnect}>Disconnect</button>
          </div>
        )}
      </header>

      {error && <div className="message message-error">{error}</div>}

      {!hasMetaMask ? (
        <div className="card center">
          <p>MetaMask was not found in your browser.</p>
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
            Install MetaMask
          </a>
          <p className="muted">Reload this page after installing.</p>
        </div>
      ) : !account ? (
        <div className="card center">
          <p>Connect your MetaMask wallet to continue.</p>
          <button onClick={connect}>Connect MetaMask</button>
        </div>
      ) : wrongNetwork ? (
        <div className="card center">
          <p>You are on the wrong network. Please switch to Sepolia.</p>
          <button onClick={switchToSepolia}>Switch to Sepolia</button>
        </div>
      ) : (
        <>
          <nav>
            <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>Dashboard</button>
            <button className={page === "lender" ? "active" : ""} onClick={() => setPage("lender")}>Lender</button>
            <button className={page === "borrower" ? "active" : ""} onClick={() => setPage("borrower")}>Borrower</button>
            <button className={page === "history" ? "active" : ""} onClick={() => setPage("history")}>History</button>
          </nav>
          {contract && renderPage()}
        </>
      )}
    </div>
  );
}

export default App;