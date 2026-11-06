import { useState, useEffect, useCallback } from "react";
import StatusBadge from "../components/StatusBadge";
import Message from "../components/Message";
import { sameAddress, shortAddress, readError } from "../utils";

export default function LenderDashboard({ account, contract }) {
  const [amount, setAmount] = useState("");
  const [offers, setOffers] = useState([]);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadOffers = useCallback(async () => {
    try {
      const all = await contract.getAllOffers();
      setOffers(all.filter((o) => sameAddress(o.lender, account)));
    } catch (err) {
      setMessage({ type: "error", text: readError(err) });
    }
  }, [contract, account]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // Runs any contract transaction and shows success / failure
  const sendTx = async (txFunction, successText) => {
    setBusy(true);
    setMessage({ type: "info", text: "Waiting for MetaMask confirmation..." });
    try {
      const tx = await txFunction();
      setMessage({ type: "info", text: "Transaction sent. Waiting for confirmation..." });
      await tx.wait();
      setMessage({ type: "success", text: `${successText} Tx: ${tx.hash}` });
      await loadOffers();
      return true;
    } catch (err) {
      setMessage({ type: "error", text: `Failed: ${readError(err)}` });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setMessage({ type: "error", text: "Enter an amount greater than 0." });
      return;
    }
    const ok = await sendTx(() => contract.createOffer(amount), "Loan offer created.");
    if (ok) setAmount("");
  };

  const requests = offers.filter((o) => Number(o.status) === 1);

  return (
    <div>
      <div className="card">
        <h2>Create Loan Offer</h2>
        <form onSubmit={handleCreate} className="inline-form">
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Loan amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit" disabled={busy}>Create Offer</button>
        </form>
        <Message message={message} />
      </div>

      <div className="card">
        <h2>Incoming Requests</h2>
        {requests.length === 0 ? (
          <p className="muted">No pending requests.</p>
        ) : (
          requests.map((o) => (
            <div className="row" key={Number(o.id)}>
              <div>
                <strong>Offer #{Number(o.id)}</strong> · Amount: {o.amount.toString()}
                <br />
                <span className="muted">Borrower: {shortAddress(o.borrower)}</span>
              </div>
              <div className="actions">
                <button
                  disabled={busy}
                  onClick={() => sendTx(() => contract.approveLoan(o.id), "Loan approved.")}
                >
                  Approve
                </button>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={() => sendTx(() => contract.rejectLoan(o.id), "Loan rejected.")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>My Offers</h2>
        {offers.length === 0 ? (
          <p className="muted">You have not created any offers yet.</p>
        ) : (
          offers.map((o) => (
            <div className="row" key={Number(o.id)}>
              <div>
                <strong>Offer #{Number(o.id)}</strong> · Amount: {o.amount.toString()}
                <br />
                <span className="muted">Borrower: {shortAddress(o.borrower)}</span>
              </div>
              <StatusBadge status={o.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}