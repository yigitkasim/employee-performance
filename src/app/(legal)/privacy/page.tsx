import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — GrowthMatrix",
  description:
    "How GrowthMatrix collects, uses and protects personal data, and your rights under GDPR, UK GDPR, KVKK, CCPA/CPRA and PIPEDA.",
};

const LAST_UPDATED = "13 August 2026";

export default function PrivacyPage() {
  const company = process.env.COMPANY_NAME || "GrowthMatrix";
  const contact = process.env.COMPANY_CONTACT_EMAIL || "privacy@growthmatrix.app";
  const address = process.env.COMPANY_ADDRESS || "";

  return (
    <article>
      <p className="text-xs italic text-slate-500 mb-4">
        Template notice: this policy is a good-faith, product-specific template.
        It must be reviewed and adapted by a qualified privacy lawyer in each
        market before you launch commercially.
      </p>

      <h1>Privacy Policy</h1>
      <p className="text-xs text-slate-500 mt-1 mb-6">
        Last updated: {LAST_UPDATED}
      </p>

      <p>
        This policy explains how {company}, the provider of{" "}
        <strong>GrowthMatrix</strong>, handles personal data. GrowthMatrix is a
        tool a manager uses to evaluate and develop their team: you define roles,
        levels and skills, then rate each team member on a 1–5 scale and keep
        coaching notes about them.
      </p>
      <p>
        Because of that, there are <strong>two very different kinds of people</strong>{" "}
        in this product, and the law treats them differently. Please read section
        2 carefully.
      </p>

      <h2>1. Who we are</h2>
      <p>
        {company}
        {address ? <> — {address}</> : null}
        <br />
        Privacy contact: <a href={`mailto:${contact}`}>{contact}</a>
      </p>
      <p>
        <em>
          Placeholder: if you require an EU Article 27 representative, a UK
          representative, or a Turkish data controller registry (VERBİS)
          registration, name them here before launch.
        </em>
      </p>

      <h2>2. Two roles: controller and processor</h2>
      <h3>a) Account data — we are the controller</h3>
      <p>
        For the people who sign up and log in (managers / workspace users), we
        decide why and how their data is processed. We are the{" "}
        <strong>controller</strong> (GDPR/UK GDPR), the{" "}
        <strong>veri sorumlusu</strong> (KVKK), and a{" "}
        <strong>business</strong> (CCPA/CPRA).
      </p>
      <p>We collect:</p>
      <ul>
        <li>
          <strong>Identity and account:</strong> your name, email address, hashed
          password (bcrypt — we never store or can read your plaintext password),
          your role in the workspace (owner or manager), the organisation name
          you entered, account creation date.
        </li>
        <li>
          <strong>Consent records:</strong> the timestamp at which you accepted
          the Terms and Privacy Policy, and whether you opted in to marketing
          email. We keep these to prove consent (GDPR Art. 7(1), KVKK
          accountability, CASL record-keeping).
        </li>
        <li>
          <strong>Security and account lifecycle:</strong> email verification
          status, failed login attempts (email + IP, for rate limiting and
          lockout), password-reset and verification token hashes, session
          validity timestamps, suspension status.
        </li>
        <li>
          <strong>Audit records:</strong> privileged actions such as data
          exports, account deletion and password resets, with who did them and
          when.
        </li>
        <li>
          <strong>Support correspondence</strong> you send us by email.
        </li>
      </ul>

      <h3>
        b) Team-member data — you are the controller, we are the processor
      </h3>
      <p>
        The most sensitive data in GrowthMatrix is not about you. It is about{" "}
        <strong>the people you manage</strong>, who never sign in. For every team
        member you add, the workspace may hold:
      </p>
      <ul>
        <li>name, initials and job title;</li>
        <li>assigned job role and level;</li>
        <li>
          <strong>skill ratings on a 1–5 scale</strong> per sub-skill, the
          expected/target score, and the member&rsquo;s self-assessment where
          recorded;
        </li>
        <li>
          <strong>free-text coaching notes</strong>, 1:1 talking points,
          checklist items and development goals;
        </li>
        <li>
          <strong>observations captured in the inbox</strong> (anything the
          manager types about them), and the history log of every rating change
          with its note, author and timestamp;
        </li>
        <li>growth-simulator target values.</li>
      </ul>
      <p>
        For this data, <strong>the customer organisation is the data controller</strong>{" "}
        and <strong>{company} is only a processor</strong> acting on the
        customer&rsquo;s documented instructions. We do not decide what ratings are
        recorded, we do not read this data for our own purposes, and we do not
        use it for analytics, profiling, advertising or model training.
      </p>
      <p>
        <strong>If you are a team member</strong> whose ratings or notes are held
        in GrowthMatrix and you want access, correction or deletion, please
        contact your employer — they control that record. If you contact us
        directly we will forward your request to them without undue delay and
        support them in answering it. See the{" "}
        <Link href="/dpa">Data Processing Addendum</Link>.
      </p>
      <p>
        <strong>Employers:</strong> you are responsible for informing your team
        members that you keep these records, for having a lawful basis (in the EU
        typically legitimate interests or a legal/contractual HR obligation, not
        employee &ldquo;consent&rdquo;, which is rarely freely given in an
        employment relationship), and — in Türkiye — for meeting your KVKK Art. 10
        disclosure duty (aydınlatma yükümlülüğü) toward them.
      </p>

      <h2>3. Legal bases (GDPR / UK GDPR Art. 6)</h2>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Legal basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Creating and running your account and workspace</td>
            <td>Art. 6(1)(b) — performance of a contract with you</td>
          </tr>
          <tr>
            <td>Billing and tax records (paid plans)</td>
            <td>Art. 6(1)(b) and Art. 6(1)(c) — contract and legal obligation</td>
          </tr>
          <tr>
            <td>
              Security: login rate limiting, lockout, audit logs, abuse
              prevention
            </td>
            <td>
              Art. 6(1)(f) — legitimate interests in keeping the service secure;
              also Art. 32 security obligation
            </td>
          </tr>
          <tr>
            <td>Service emails (verification, password reset, breach notice)</td>
            <td>Art. 6(1)(b) / Art. 6(1)(c)</td>
          </tr>
          <tr>
            <td>Marketing email about the product</td>
            <td>
              Art. 6(1)(a) — your separate, opt-in consent, withdrawable at any
              time
            </td>
          </tr>
          <tr>
            <td>Processing team-member records on your behalf</td>
            <td>
              We act under Art. 28 as processor; the legal basis is your
              organisation&rsquo;s (typically Art. 6(1)(f) or 6(1)(b))
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Under KVKK the corresponding grounds are Art. 5(2)(c) (necessary for
        performance of a contract), Art. 5(2)(ç) (legal obligation), Art. 5(2)(f)
        (legitimate interests, without prejudice to fundamental rights) and, for
        marketing, explicit consent (açık rıza) under Art. 5(1).
      </p>

      <h2>4. What we do not do</h2>
      <ul>
        <li>
          <strong>We do not sell personal information</strong>, and we do not
          share it for cross-context behavioural advertising, as those terms are
          defined by the CCPA/CPRA. We have never done so, including in the
          preceding 12 months.
        </li>
        <li>We do not run advertising or third-party tracking in the product.</li>
        <li>
          We do not use Customer Data to train general-purpose or third-party AI
          models.
        </li>
        <li>
          We do not make automated decisions producing legal or similarly
          significant effects about anyone (GDPR Art. 22). The scores and
          readiness percentages are arithmetic; the human manager decides.
        </li>
      </ul>

      <h2>5. Cookies</h2>
      <p>
        GrowthMatrix sets <strong>one cookie</strong>:{" "}
        <code>gm_session</code> — an httpOnly, SameSite=Lax, Secure-in-production
        signed session token that keeps you logged in for up to 30 days. It is{" "}
        <strong>strictly necessary</strong> to provide a service you explicitly
        requested (logging in), so under the ePrivacy Directive / PECR and KVKK
        guidance it does not require consent.
      </p>
      <p>
        We use <strong>no analytics, advertising, profiling or third-party
        tracking cookies, no pixels, and no fingerprinting</strong>. That is why
        you do not see a cookie consent banner. If we ever add a non-essential
        cookie, we will ask for opt-in consent first and update this policy.
      </p>

      <h2>6. Sub-processors</h2>
      <p>
        We keep the vendor list deliberately short. Current sub-processors:
      </p>
      <table>
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Application hosting provider (Vercel-class PaaS)</td>
            <td>Serving the application, TLS termination, request logs</td>
            <td>IP address, request metadata, account data in transit</td>
          </tr>
          <tr>
            <td>Managed PostgreSQL provider (Neon-class)</td>
            <td>Primary database and encrypted backups</td>
            <td>All account and Customer Data at rest</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>
              Transactional email (verification, password reset) and, if you
              opted in, product updates
            </td>
            <td>Name, email address, message content</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each sub-processor is bound by a written contract with GDPR Art. 28
        terms. We will give workspace owners advance notice of any new
        sub-processor and a reasonable opportunity to object.
      </p>

      <h2>7. International transfers</h2>
      <p>
        We aim to host EU/UK customer data in the EEA or UK. Where a
        sub-processor is located in, or accessible from, a country without an
        adequacy decision (for example the United States), we rely on the
        European Commission&rsquo;s{" "}
        <strong>Standard Contractual Clauses</strong> (Decision 2021/914), the UK
        International Data Transfer Addendum, and a transfer impact assessment,
        together with encryption in transit and at rest.
      </p>
      <p>
        For Türkiye, transfers abroad are made in accordance with KVKK Art. 9 as
        amended — on the basis of an adequacy decision, an appropriate safeguard
        (standard contract notified to the Kurul, binding corporate rules), or an
        applicable exception — and, where required, your explicit consent.
      </p>
      <p>
        For Canada, we tell you plainly that your data may be processed outside
        Canada and is therefore subject to the laws of that jurisdiction
        (PIPEDA transparency expectation).
      </p>

      <h2>8. Retention</h2>
      <ul>
        <li>
          <strong>Account and workspace data:</strong> kept while your account is
          active. When you delete your account we remove it immediately from
          production; if you were the only user in the workspace, the whole
          workspace and every team-member record is deleted with it.
        </li>
        <li>
          <strong>Encrypted backups:</strong> rolling window of up to 30 days,
          then overwritten.
        </li>
        <li>
          <strong>Login attempt records:</strong> up to 90 days, for lockout and
          abuse detection.
        </li>
        <li>
          <strong>Auth tokens</strong> (verification, password reset): expire in
          hours; hashes purged after use or expiry.
        </li>
        <li>
          <strong>Audit logs</strong> of exports and deletions: up to 24 months,
          to evidence our own compliance. The actor reference is nulled when the
          user is deleted.
        </li>
        <li>
          <strong>Billing and invoice records:</strong> as long as tax law
          requires (commonly 7–10 years).
        </li>
        <li>
          <strong>Marketing consent records:</strong> for the duration of consent
          plus 3 years (CASL evidentiary period).
        </li>
      </ul>

      <h2>9. Security</h2>
      <ul>
        <li>TLS 1.2+ for all traffic; encryption at rest for the database.</li>
        <li>Passwords hashed with bcrypt; never stored or logged in plaintext.</li>
        <li>
          Signed, httpOnly session cookies with a server-side invalidation
          timestamp so sessions can be revoked after a password reset.
        </li>
        <li>
          Strict multi-tenant isolation: every query is scoped to the
          workspace&rsquo;s organisation id.
        </li>
        <li>Rate limiting and lockout on repeated failed logins.</li>
        <li>Least-privilege access for staff; audit logging of privileged actions.</li>
      </ul>

      <h2>10. Your rights</h2>

      <h3>EU GDPR and UK GDPR</h3>
      <p>You have the right to:</p>
      <ul>
        <li>access your personal data and get a copy (Art. 15);</li>
        <li>have inaccurate data corrected (Art. 16);</li>
        <li>have data erased — the &ldquo;right to be forgotten&rdquo; (Art. 17);</li>
        <li>restrict processing (Art. 18);</li>
        <li>
          data portability in a structured, commonly used, machine-readable
          format (Art. 20) — our JSON export is designed for this;
        </li>
        <li>
          object to processing based on legitimate interests (Art. 21), including
          direct marketing at any time;
        </li>
        <li>withdraw consent at any time, without affecting past processing (Art. 7(3));</li>
        <li>
          lodge a complaint with your supervisory authority — in the UK, the
          Information Commissioner&rsquo;s Office (ICO).
        </li>
      </ul>

      <h3>Türkiye — KVKK Art. 11 (İlgili kişinin hakları)</h3>
      <p>
        As a data subject (ilgili kişi) under Law No. 6698, you may apply to the
        data controller (veri sorumlusu) to:
      </p>
      <ul>
        <li>learn whether your personal data is being processed;</li>
        <li>request information if it has been processed;</li>
        <li>
          learn the purpose of processing and whether the data is used in
          accordance with that purpose;
        </li>
        <li>
          know the third parties to whom personal data is transferred, in the
          country or abroad;
        </li>
        <li>
          request correction of incomplete or inaccurate data, and request that
          the correction be notified to third parties to whom the data was
          transferred;
        </li>
        <li>
          request deletion or destruction (silinmesi veya yok edilmesi) under the
          conditions of Art. 7, and that this be notified to third parties;
        </li>
        <li>
          object to a result arising against you from analysis solely by
          automated systems;
        </li>
        <li>
          claim compensation for damage arising from unlawful processing.
        </li>
      </ul>
      <p>
        Applications must be made in accordance with the Communiqué on
        Application Procedures. We respond within{" "}
        <strong>30 days</strong> at the latest. You may then complain to the
        Personal Data Protection Board (Kişisel Verileri Koruma Kurulu). Where{" "}
        {company} acts only as processor (team-member records), the employer is
        the veri sorumlusu and your KVKK Art. 11 application should be addressed
        to them; we will support them.
      </p>

      <h3>California — CCPA / CPRA</h3>
      <p>If you are a California resident you have the right to:</p>
      <ul>
        <li>
          know what personal information we collect, the categories of sources,
          the business purpose, and the categories of third parties it is
          disclosed to;
        </li>
        <li>access a portable copy of that information;</li>
        <li>request deletion, subject to legal retention exceptions;</li>
        <li>request correction of inaccurate personal information;</li>
        <li>
          <strong>opt out of sale or sharing</strong> — not applicable here
          because <strong>we do not sell or share personal information</strong>,
          and we do not process sensitive personal information for purposes
          requiring a &ldquo;Limit the Use&rdquo; link;
        </li>
        <li>
          non-discrimination: we will not deny service, charge a different price
          or provide a lesser quality of service because you exercised a right;
        </li>
        <li>use an authorised agent to submit a request on your behalf.</li>
      </ul>
      <p>
        We verify requests by matching them to the email address on the account.
        We respond within 45 days, extendable once by a further 45 days with
        notice.
      </p>

      <h3>Canada — PIPEDA and CASL</h3>
      <ul>
        <li>
          You may access the personal information we hold about you and challenge
          its accuracy and completeness (PIPEDA Principle 9).
        </li>
        <li>
          You may withdraw consent, subject to legal or contractual restrictions
          and reasonable notice (Principle 3).
        </li>
        <li>
          We identify our purposes, limit collection to what is necessary, and
          are accountable through a designated privacy contact (Principles 1, 2,
          4).
        </li>
        <li>
          You may complain to the Office of the Privacy Commissioner of Canada.
        </li>
        <li>
          <strong>CASL:</strong> we only send commercial electronic messages to
          people who gave express opt-in consent — the separate, unticked
          checkbox at signup or the toggle in Account &amp; privacy. Every such
          message identifies us, gives our contact details, and includes a
          working unsubscribe that we honour within 10 business days.
          Transactional messages (verification, password reset, security and
          billing notices) are not marketing and are sent regardless.
        </li>
      </ul>

      <h2>11. How to exercise your rights</h2>
      <ul>
        <li>
          <strong>Access / portability — do it yourself, instantly.</strong> Sign
          in and go to <strong>Account &amp; privacy → Download my data</strong>.
          You get a complete JSON file of your profile and your entire workspace:
          organisation, cycles, roles and levels, skill groups and sub-skills,
          expected scores, members and their scores, log entries, inbox items,
          goals, talking points, checklist items, notes and simulator values.
        </li>
        <li>
          <strong>Erasure — do it yourself.</strong> Account &amp; privacy →{" "}
          <strong>Delete account</strong>. You confirm with your password. If you
          are the only user in the workspace, the whole workspace and all
          team-member records are permanently deleted.
        </li>
        <li>
          <strong>Marketing consent.</strong> Toggle it off in Account &amp;
          privacy, or use the unsubscribe link in any product email.
        </li>
        <li>
          <strong>Anything else</strong> — correction, restriction, objection, a
          KVKK Art. 11 application, a CCPA request, or a request on behalf of a
          team member: email{" "}
          <a href={`mailto:${contact}`}>{contact}</a>. We reply within 30 days
          (45 days for CCPA requests), free of charge unless a request is
          manifestly unfounded or excessive.
        </li>
      </ul>

      <h2>12. Breach notification</h2>
      <p>
        If a personal data breach occurs we will notify the competent supervisory
        authority within 72 hours where required (GDPR/UK GDPR Art. 33), notify
        affected customers without undue delay, and — as processor — notify the
        controlling customer without undue delay so they can meet their own
        deadlines, including the KVKK notification duty (to the Kurul within 72
        hours of becoming aware, and to affected persons as soon as reasonably
        possible).
      </p>

      <h2>13. Children</h2>
      <p>
        GrowthMatrix is a workplace tool for adults. We do not knowingly collect
        personal data from anyone under 16, and workspaces must not be used to
        record data about minors.
      </p>

      <h2>14. Changes to this policy</h2>
      <p>
        We will post updates here with a new &ldquo;Last updated&rdquo; date and,
        for material changes, notify workspace owners by email or in-app at least
        30 days in advance.
      </p>

      <h2>15. Contact</h2>
      <p>
        {company}
        {address ? <> — {address}</> : null}
        <br />
        Privacy contact: <a href={`mailto:${contact}`}>{contact}</a>
        <br />
        See also our <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/dpa">Data Processing Addendum</Link>.
      </p>
    </article>
  );
}
