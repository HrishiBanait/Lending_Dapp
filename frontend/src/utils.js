export const STATUS_LABELS = ["Available", "Requested", "Approved", "Rejected"];

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function shortAddress(addr) {
  if (!addr || addr === ZERO_ADDRESS) return "None";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function sameAddress(a, b) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

// Turns a raw ethers error into a short readable message
export function readError(err) {
  if (err?.code === "ACTION_REJECTED" || err?.code === 4001) {
    return "Transaction was rejected in MetaMask.";
  }
  return err?.reason || err?.shortMessage || err?.message || "Something went wrong.";
}