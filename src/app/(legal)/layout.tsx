import Link from "next/link";

/**
 * Typographic rules for the legal pages. Scoped to .legal-prose so nothing
 * else in the app is affected.
 */
const PROSE_CSS = `
.legal-prose { color: #334155; font-size: 0.875rem; line-height: 1.7; }
.legal-prose h1 { font-size: 1.5rem; line-height: 2rem; font-weight: 600; letter-spacing: -0.01em; color: #0f172a; }
.legal-prose h2 { font-size: 1rem; font-weight: 600; color: #0f172a; margin-top: 2rem; margin-bottom: 0.5rem; }
.legal-prose h3 { font-size: 0.875rem; font-weight: 600; color: #0f172a; margin-top: 1.25rem; margin-bottom: 0.25rem; }
.legal-prose p { margin-bottom: 0.75rem; }
.legal-prose ul, .legal-prose ol { margin: 0.5rem 0 0.75rem 1.25rem; }
.legal-prose ul { list-style: disc; }
.legal-prose ol { list-style: decimal; }
.legal-prose li { margin-bottom: 0.35rem; }
.legal-prose a { color: #4f46e5; text-decoration: underline; }
.legal-prose strong { color: #0f172a; font-weight: 600; }
.legal-prose table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
.legal-prose th, .legal-prose td { border: 1px solid #e2e8f0; padding: 0.5rem 0.625rem; text-align: left; vertical-align: top; }
.legal-prose th { background: #f8fafc; font-weight: 600; color: #0f172a; }
`;

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const company = process.env.COMPANY_NAME || "GrowthMatrix";
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50">
      <style dangerouslySetInnerHTML={{ __html: PROSE_CSS }} />
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              G
            </div>
            <div className="font-semibold">GrowthMatrix</div>
          </Link>
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm legal-prose">
          {children}
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-sm text-slate-500 mt-6">
          <Link href="/terms" className="hover:text-indigo-600 hover:underline">
            Terms of Service
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/privacy" className="hover:text-indigo-600 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/dpa" className="hover:text-indigo-600 hover:underline">
            Data Processing Addendum
          </Link>
        </nav>

        <p className="text-center text-xs text-slate-400 mt-3">
          © {year} {company}. All rights reserved.
        </p>
      </main>
    </div>
  );
}
