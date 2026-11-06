import { useState, useEffect, useCallback } from "react";
import StatusBadge from "../components/StatusBadge";
import { shortAddress, readError } from "../utils";
import { DEPLOY_BLOCK } from "../contract/config";

const ETHERSCAN_TX = "https://sepolia.etherscan.io/tx/";
const CHUNK = 5000;

// Reads events in small block ranges so the RPC doesn't reject the request
async function queryInChunks(contract, eventName, fromBlock, toBlock) {
  const events = [];
  for (let start = fromBlock; start <= toBlock; start += CHUNK) {
    const end = Math.min(start + CHUNK - 1, toBlock);
    const part = await contract.queryFilter(contract.filters[eventName](), start, end);
    events.push(...part);
  }
  return events;
}


function TxLink({ label, hash }) {
  if (!hash) return null;
  return (
    <a href={ETHERSCAN_TX + hash} target="_blank" rel="noreferrer" className="tx-link">
      {label}: {hash.slice(0, 10)}...
    </a>
  );
}

export default function LoanHistory({ contract }) {
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const all = await contract.getAllOffers();
      const latest = await contract.runner.provider.getBlockNumber();

      // Collect transaction hashes from events
      const hashes = {};
      const collect = async (eventName, key) => {
        const events = await queryInChunks(contract, eventName, DEPLOY_BLOCK, latest);
        events.forEach((ev) => {
          const id = Number(ev.args.id);
          hashes[id] = { ...hashes[id], [key]: ev.transactionHash };
        });
      };
      await collect("OfferCreated", "created");
      await collect("LoanRequested", "requested");
      await collect("LoanApproved", "decision");
      await collect("LoanRejected", "decision");

      setLoans(
        all.map((o) => ({
          id: Number(o.id),
          lender: o.lender,
          borrower: o.borrower,
          amount: o.amount.toString(),
          status: o.status,
          tx: hashes[Number(o.id)] || {},
        }))
      );
    } catch (err) {
      console.error(err);
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="card">
      <h2>Loan History</h2>
      <button onClick={load} disabled={loading}>Refresh</button>
      {error && <div className="message message-error">{error}</div>}
      {loading ? (
        <p className="muted">Loading...</p>
      ) : loans.length === 0 ? (
        <p className="muted">No loan records yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Lender</th>
                <th>Borrower</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id}>
                  <td>#{l.id}</td>
                  <td title={l.lender}>{shortAddress(l.lender)}</td>
                  <td title={l.borrower}>{shortAddress(l.borrower)}</td>
                  <td>{l.amount}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="tx-cell">
                    <TxLink label="Created" hash={l.tx.created} />
                    <TxLink label="Requested" hash={l.tx.requested} />
                    <TxLink label="Decision" hash={l.tx.decision} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}