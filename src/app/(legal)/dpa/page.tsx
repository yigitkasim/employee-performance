import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Processing Addendum — GrowthMatrix",
  description:
    "Summary of GrowthMatrix's processor commitments under GDPR Art. 28, UK GDPR and KVKK.",
};

const LAST_UPDATED = "13 August 2026";

export default function DpaPage() {
  const company = process.env.COMPANY_NAME || "GrowthMatrix";
  const contact = process.env.COMPANY_CONTACT_EMAIL || "privacy@growthmatrix.app";

  return (
    <article>
      <p className="text-xs italic text-slate-500 mb-4">
        Template notice: this is a plain-language summary of our processor
        commitments, not the executed contract. Have counsel review and issue the
        signable DPA (with SCC annexes) before launch.
      </p>

      <h1>Data Processing Addendum</h1>
      <p className="text-xs text-slate-500 mt-1 mb-6">
        Last updated: {LAST_UPDATED} · Summary version
      </p>

      <p>
        This addendum forms part of the <Link href="/terms">Terms of Service</Link>{" "}
        between {company} (<strong>&ldquo;Processor&rdquo;</strong>) and the
        customer organisation using GrowthMatrix (
        <strong>&ldquo;Controller&rdquo;</strong>). It applies whenever we process
        personal data on the Controller&rsquo;s behalf, and gives effect to GDPR
        Art. 28, UK GDPR Art. 28, and the equivalent duties under KVKK (Law No.
        6698) for a veri işleyen.
      </p>
      <p>
        A signable copy including Standard Contractual Clauses is available on
        request at <a href={`mailto:${contact}`}>{contact}</a>.
      </p>

      <h2>1. Scope of processing</h2>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Subject matter</td>
            <td>Provision of the GrowthMatrix skill-evaluation SaaS</td>
          </tr>
          <tr>
            <td>Duration</td>
            <td>For the term of the subscription, plus the deletion window in §7</td>
          </tr>
          <tr>
            <td>Nature and purpose</td>
            <td>
              Hosting, storage, retrieval, display, computation of gaps and
              readiness, export and deletion — all on the Controller&rsquo;s
              instructions
            </td>
          </tr>
          <tr>
            <td>Categories of data subject</td>
            <td>
              Controller&rsquo;s users (managers) and the Controller&rsquo;s
              employees / team members being evaluated
            </td>
          </tr>
          <tr>
            <td>Categories of personal data</td>
            <td>
              Name, work email, job title, job role and level, skill ratings
              (1–5), self-assessments, target scores, coaching notes, goals, 1:1
              talking points, captured observations, rating-change history,
              simulator values, authentication and audit metadata
            </td>
          </tr>
          <tr>
            <td>Special categories</td>
            <td>
              <strong>None permitted.</strong> The Controller must not enter
              special-category or criminal-offence data
            </td>
          </tr>
        </tbody>
      </table>

      <h2>2. Processor commitments</h2>
      <ul>
        <li>
          Process personal data <strong>only on documented instructions</strong>{" "}
          from the Controller — the Terms, this addendum, and the Controller&rsquo;s
          use of the product features are those instructions.
        </li>
        <li>
          Never sell, share for behavioural advertising, or use Controller data
          for our own purposes, analytics or AI model training.
        </li>
        <li>
          Bind every person authorised to process the data to{" "}
          <strong>confidentiality</strong>, and grant access on a strict
          least-privilege, need-to-know basis.
        </li>
        <li>
          Implement the technical and organisational measures in §4 (GDPR Art.
          32; KVKK Art. 12).
        </li>
        <li>
          <strong>Assist the Controller</strong>, taking into account the nature
          of processing, with data subject requests (Art. 12–23 / KVKK Art. 11),
          security, breach notification, DPIAs and prior consultation. Where we
          receive a request directly from a team member, we will not respond
          substantively — we forward it to the Controller without undue delay.
        </li>
        <li>
          Make available the information needed to demonstrate compliance and
          allow <strong>audits</strong> — normally satisfied by our security
          documentation and completed questionnaires; on-site audit no more than
          once a year, with 30 days&rsquo; notice, at the Controller&rsquo;s cost.
        </li>
        <li>
          Immediately inform the Controller if, in our opinion, an instruction
          infringes data protection law.
        </li>
      </ul>

      <h2>3. Sub-processors</h2>
      <p>
        The Controller gives general written authorisation for the following
        sub-processors. Each is bound by a written contract imposing the same
        data protection obligations. We give at least{" "}
        <strong>30 days&rsquo; notice</strong> before adding or replacing one, and
        the Controller may object on reasonable data-protection grounds; if we
        cannot resolve the objection, the Controller may terminate the affected
        subscription without penalty.
      </p>
      <table>
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Service</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Application hosting provider (Vercel-class PaaS)</td>
            <td>Application runtime, TLS, edge/request logs</td>
            <td>EU region preferred; US access possible under SCCs</td>
          </tr>
          <tr>
            <td>Managed PostgreSQL provider (Neon-class)</td>
            <td>Primary database, encrypted backups</td>
            <td>EU region</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Transactional and opt-in product email</td>
            <td>EU / US under SCCs</td>
          </tr>
        </tbody>
      </table>
      <p>
        We remain fully liable to the Controller for the performance of each
        sub-processor&rsquo;s obligations.
      </p>

      <h2>4. Security measures</h2>
      <ul>
        <li>
          <strong>Encryption:</strong> TLS 1.2+ in transit; AES-256 encryption at
          rest for the database and backups.
        </li>
        <li>
          <strong>Authentication:</strong> bcrypt password hashing; signed,
          httpOnly, SameSite=Lax session cookies; server-side session
          invalidation after password reset; single-use, expiring, hash-stored
          verification and reset tokens.
        </li>
        <li>
          <strong>Tenant isolation:</strong> every record is scoped to an
          organisation id and every query is filtered by the authenticated
          session&rsquo;s organisation — no cross-workspace reads.
        </li>
        <li>
          <strong>Abuse resistance:</strong> failed-login tracking with rate
          limiting and lockout.
        </li>
        <li>
          <strong>Accountability:</strong> audit log of privileged and
          compliance-relevant actions (data export, account deletion, password
          reset) with actor and timestamp.
        </li>
        <li>
          <strong>Resilience:</strong> managed daily backups with a rolling
          retention window and documented restore procedure.
        </li>
        <li>
          <strong>Access control:</strong> least-privilege staff access, MFA on
          all administrative accounts, access revoked on offboarding.
        </li>
        <li>
          <strong>Change management:</strong> peer-reviewed code, dependency
          vulnerability scanning, staged deployments.
        </li>
      </ul>

      <h2>5. Personal data breach notification</h2>
      <p>
        We notify the Controller <strong>without undue delay, and in any event
        within 48 hours</strong> of becoming aware of a personal data breach
        affecting their data — comfortably inside the Controller&rsquo;s own 72-hour
        deadline under GDPR Art. 33 and the KVKK notification duty to the Kurul.
        Our notice will describe the nature of the breach, the categories and
        approximate number of data subjects and records affected, the likely
        consequences, the measures taken or proposed, and a contact point. We
        will cooperate fully with the Controller&rsquo;s investigation and any
        notification to data subjects.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Where personal data leaves the EEA, the UK or Türkiye, we rely on the EU
        Standard Contractual Clauses (Decision 2021/914, Module 2 or 3 as
        applicable), the UK International Data Transfer Addendum, and a transfer
        impact assessment; for Türkiye, on an appropriate safeguard or exception
        under KVKK Art. 9. Supplementary measures include encryption in transit
        and at rest and a policy of challenging unlawful government access
        requests.
      </p>

      <h2>7. Return and deletion on termination</h2>
      <ul>
        <li>
          The Controller can export a complete, machine-readable JSON copy of all
          Customer Data at any time from{" "}
          <strong>Account &amp; privacy → Download my data</strong>, including
          during any wind-down period.
        </li>
        <li>
          On termination we delete Customer Data from production systems{" "}
          <strong>immediately on account deletion</strong>, or within{" "}
          <strong>30 days</strong> of subscription termination. Deleting the last
          remaining user of a workspace deletes the entire organisation and every
          team-member record it contains, by database cascade.
        </li>
        <li>
          Encrypted backups age out within <strong>30 days</strong>, after which
          the data is unrecoverable.
        </li>
        <li>
          We retain only what law requires (for example invoices for tax
          purposes) and our own audit records of export and deletion events, and
          keep them protected and isolated for the remainder of their retention
          period.
        </li>
      </ul>

      <h2>8. Contact</h2>
      <p>
        Data protection contact: <a href={`mailto:${contact}`}>{contact}</a> —{" "}
        {company}. See also the <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </article>
  );
}
