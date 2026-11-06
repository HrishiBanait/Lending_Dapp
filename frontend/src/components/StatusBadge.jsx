import { STATUS_LABELS } from "../utils";

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[Number(status)];
  return <span className={`badge badge-${label.toLowerCase()}`}>{label}</span>;
}