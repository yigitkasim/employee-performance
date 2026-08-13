import Link from "next/link";

// Shown on per-member screens when the org has no members yet.
export function NoMembers({ what }: { what: string }) {
  return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-2xl">
        👥
      </div>
      <h1 className="text-xl font-semibold">No team members yet</h1>
      <p className="text-slate-500 mt-1">
        Add someone to your team to see {what}.
      </p>
      <Link
        href="/app"
        className="inline-block mt-4 text-sm bg-indigo-600 text-white rounded-md px-4 py-2 hover:bg-indigo-700"
      >
        Go to Team →
      </Link>
    </div>
  );
}
