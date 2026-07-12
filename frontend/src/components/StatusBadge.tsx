import { DonationStatus, STATUS_LABELS } from "../types";

export function StatusBadge({ status }: { status: DonationStatus }) {
  return <span className={`badge-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}
