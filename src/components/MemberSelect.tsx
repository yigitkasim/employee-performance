"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function MemberSelect({
  members,
  currentId,
}: {
  members: { id: string; name: string }[];
  currentId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("member", id);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={currentId}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white"
    >
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
