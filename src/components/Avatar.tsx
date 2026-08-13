import { initialsOf } from "@/lib/compute";

export function Avatar({
  name,
  color,
  initials,
  size = "md",
}: {
  name: string;
  color: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
}) {
  const s =
    size === "sm"
      ? "w-7 h-7 text-xs"
      : size === "lg"
        ? "w-12 h-12 text-base"
        : "w-9 h-9 text-sm";
  return (
    <div
      className={`${s} rounded-full ${color} text-white flex items-center justify-center font-semibold shrink-0`}
    >
      {initials || initialsOf(name)}
    </div>
  );
}
