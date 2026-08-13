import { statusLabel } from "@/lib/compute";

export function StatusBadge({ status }: { status: string }) {
  const { cls, label } = statusLabel(status);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}
