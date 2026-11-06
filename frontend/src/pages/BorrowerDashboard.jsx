import { useState, useEffect, useCallback } from "react";
import StatusBadge from "../components/StatusBadge";
import Message from "../components/Message";
import { sameAddress, shortAddress, readError } from "../utils";

export default function BorrowerDashboard({ account, contract }) {
  const [offers, setOffers] = useState([]);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadOffers = useCallback(async () => {
    try {
      setOffers([...(await contract.getAllOffers())]);
    } catch (err) {
      setMessage({ type: "error", text: readError(err) });
    }
  }, [contract]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleRequest = async (id) => {
    setBusy(true);
    setMessage({ type: "info", text: "Waiting for MetaMask confirmation..." });
    try {
      const tx = await contract.requestLoan(id);
      setMessage({ type: "info", text: "Transaction sent. Waiting for confirmation..." });
      await tx.wait();
      setMessage({ type: "success", text: `Loan requested. Tx: ${tx.hash}` });
      await loadOffers();
    } catch (err) {
      setMessage({ type: "error", text: `Failed: ${readError(err)}` });
    } finally {
      setBusy(false);
    }
  };

  // Offers from other lenders that can be requested
  const available = offers.filter(
    (o) => Number(o.status) === 0 && !sameAddress(o.lender, account)
  );
  // Offers this wallet has requested
  const myRequests = offers.filter((o) => sameAddress(o.borrower, account));

  return (
    <div>
      <div className="card">
        <h2>Available Loan Offers</h2>
        <Message message={message} />
        {available.length === 0 ? (
          <p className="muted">No offers available right now.</p>
        ) : (
          available.map((o) => (
            <div className="row" key={Number(o.id)}>
              <div>
                <strong>Offer #{Number(o.id)}</strong> · Amount: {o.amount.toString()}
                <br />
                <span className="muted">Lender: {shortAddress(o.lender)}</span>
              </div>
              <button disabled={busy} onClick={() => handleRequest(o.id)}>
                Request Loan
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>My Requested Loans</h2>
        {myRequests.length === 0 ? (
          <p className="muted">You have not requested any loans yet.</p>
        ) : (
          myRequests.map((o) => (
            <div className="row" key={Number(o.id)}>
              <div>
                <strong>Offer #{Number(o.id)}</strong> · Amount: {o.amount.toString()}
                <br />
                <span className="muted">Lender: {shortAddress(o.lender)}</span>
              </div>
              <StatusBadge status={o.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}