import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — GrowthMatrix",
  description: "The terms that govern your use of GrowthMatrix.",
};

const LAST_UPDATED = "13 August 2026";

export default function TermsPage() {
  const company = process.env.COMPANY_NAME || "GrowthMatrix";
  const contact = process.env.COMPANY_CONTACT_EMAIL || "legal@growthmatrix.app";
  const address = process.env.COMPANY_ADDRESS || "";

  return (
    <article>
      <p className="text-xs italic text-slate-500 mb-4">
        Template notice: this document is a good-faith, product-specific
        template. It must be reviewed and adapted by a qualified lawyer in your
        jurisdiction before you launch commercially.
      </p>

      <h1>Terms of Service</h1>
      <p className="text-xs text-slate-500 mt-1 mb-6">
        Last updated: {LAST_UPDATED}
      </p>

      <p>
        These Terms of Service (the <strong>&ldquo;Terms&rdquo;</strong>) are a
        binding agreement between {company} (<strong>&ldquo;we&rdquo;</strong>,{" "}
        <strong>&ldquo;us&rdquo;</strong>, the provider of GrowthMatrix) and the
        organisation or individual that creates a GrowthMatrix workspace (
        <strong>&ldquo;you&rdquo;</strong>, <strong>&ldquo;Customer&rdquo;</strong>
        ). By creating an account, ticking the acceptance box at signup, or using
        the Service, you accept these Terms. If you accept on behalf of a company,
        you confirm you are authorised to bind that company.
      </p>

      <h2>1. The Service</h2>
      <p>
        GrowthMatrix is a web application that helps a manager evaluate and
        develop the people who report to them. It lets you define job roles and
        levels, build a skill framework of skill groups and sub-skills, set
        expected scores per role and level, rate each team member on a 1–5 scale,
        track gaps against target, simulate growth scenarios, compare a member&rsquo;s
        self-assessment against your rating, prepare 1:1 conversations, capture
        observations in an inbox, and keep a history log of rating changes.
      </p>
      <p>
        The Service is delivered as software-as-a-service. We may add, change or
        remove features to improve the product. We will not materially degrade
        core functionality you rely on without notice to the workspace owner.
      </p>

      <h2>2. Accounts and eligibility</h2>
      <ul>
        <li>
          You must be at least 18 years old and legally able to enter into a
          contract. GrowthMatrix is a workplace tool and is not directed at
          children.
        </li>
        <li>
          One signup creates one <strong>workspace</strong> (an organisation) and
          one owner account. Data is strictly scoped to the workspace; users of
          one workspace cannot see another workspace&rsquo;s data.
        </li>
        <li>
          You are responsible for keeping your password confidential and for all
          activity under your account. Tell us at{" "}
          <a href={`mailto:${contact}`}>{contact}</a> immediately if you suspect
          unauthorised access.
        </li>
        <li>
          You must give accurate account information and keep it current.
        </li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          use the Service to store special-category personal data (for example
          health, trade-union membership, religious belief, sexual orientation,
          biometric or genetic data) about your team members — GrowthMatrix is
          not designed or secured for that purpose;
        </li>
        <li>
          use the Service for unlawful discrimination, harassment, surveillance
          of employees beyond what is lawful in their jurisdiction, or for any
          purpose which you have not informed your team members about where such
          notice is legally required;
        </li>
        <li>
          attempt to access another workspace&rsquo;s data, probe or bypass our
          authentication, rate limits or tenancy boundaries;
        </li>
        <li>
          reverse engineer, scrape, resell, sublicense or white-label the Service
          without our written permission;
        </li>
        <li>
          upload malware, or content that infringes someone else&rsquo;s
          intellectual property or privacy rights;
        </li>
        <li>
          use automated means to place unreasonable load on the Service.
        </li>
      </ul>
      <p>
        We may suspend a workspace that we reasonably believe breaches this
        section, and will tell the owner why.
      </p>

      <h2>4. Your data, and who owns it</h2>
      <p>
        <strong>You own your Customer Data.</strong> Customer Data means
        everything you put into the Service: your framework (roles, levels, skill
        groups, sub-skills, expected scores), your team members&rsquo; names,
        titles, skill ratings, self-assessments, coaching notes, goals, talking
        points, inbox captures and history log entries.
      </p>
      <p>
        We claim no ownership of Customer Data. We use it only to provide,
        secure, support and improve the Service for you, and as instructed by
        you. We do not sell it, and we do not use it to train third-party or
        general-purpose AI models.
      </p>
      <p>
        Your team members&rsquo; records contain personal data about people who
        are not our customers. For that data you are the{" "}
        <strong>data controller</strong> and we act as your{" "}
        <strong>processor</strong>. You are responsible for having a lawful basis
        to record ratings and notes about them, and for telling them that you do.
        Our processing commitments are set out in the{" "}
        <Link href="/dpa">Data Processing Addendum</Link> and the{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
      <p>
        You can export a full JSON copy of your workspace data at any time from
        Account &amp; privacy inside the app.
      </p>

      <h2>5. Subscription, fees and taxes</h2>
      <p>
        <em>
          Placeholder — commercial terms to be completed before launch and
          confirmed at the point of purchase.
        </em>{" "}
        The Service may be offered on a free tier and on paid subscription plans
        billed monthly or annually in advance. Prices, plan limits and any trial
        period will be shown at checkout and form part of these Terms. Fees are
        exclusive of VAT, KDV, sales tax, GST/HST and similar taxes, which we
        will add where required. Unless local consumer law says otherwise,
        payments are non-refundable for the period already started; you may
        cancel at any time and your plan continues until the end of the paid
        period. We will give at least 30 days&rsquo; notice before a price change
        takes effect for you.
      </p>

      <h2>6. Service availability and support</h2>
      <p>
        We aim for high availability but do not promise uninterrupted service on
        non-enterprise plans. We may perform maintenance, ideally outside common
        working hours. Support is provided by email at{" "}
        <a href={`mailto:${contact}`}>{contact}</a> on business days.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The Service is provided <strong>&ldquo;as is&rdquo;</strong> and{" "}
        <strong>&ldquo;as available&rdquo;</strong>. To the maximum extent
        permitted by law we disclaim all implied warranties, including
        merchantability, fitness for a particular purpose and non-infringement.
      </p>
      <p>
        <strong>GrowthMatrix does not make employment decisions.</strong> Scores,
        gap calculations, readiness percentages and growth simulations are
        arithmetic aids based on the numbers you enter. They are not advice, not
        a validated psychometric instrument, and must not be treated as an
        automated decision about a person. Any decision on promotion, pay,
        performance management or termination is yours, must involve human
        judgement, and must comply with the employment and equality law that
        applies to that person.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the extent permitted by law, neither party is liable for indirect,
        incidental, special or consequential loss, loss of profit, revenue,
        goodwill or anticipated savings. Our total aggregate liability arising
        out of or related to these Terms is limited to the greater of (a) the
        fees you paid us in the twelve months before the event giving rise to the
        claim, or (b) one hundred euro (EUR 100).
      </p>
      <p>
        Nothing in these Terms excludes liability that cannot be excluded by law,
        including death or personal injury caused by negligence, fraud, or — where
        applicable — a party&rsquo;s liability under data protection law to a data
        subject.
      </p>

      <h2>9. Term, suspension and termination</h2>
      <ul>
        <li>
          These Terms run from account creation until terminated.
        </li>
        <li>
          You may terminate at any time by deleting your account in Account &amp;
          privacy. If you are the only user in your workspace, deleting your
          account permanently deletes the entire workspace and every team member
          record in it.
        </li>
        <li>
          We may suspend or terminate for material breach, non-payment, or where
          required by law. Except for serious breach or a legal requirement, we
          will give you notice and a reasonable chance to fix the problem.
        </li>
        <li>
          Export your data before you terminate. After termination we delete
          Customer Data as described in the{" "}
          <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/dpa">DPA</Link>.
        </li>
      </ul>

      <h2>10. Confidentiality</h2>
      <p>
        Each party will protect the other&rsquo;s non-public information with at
        least reasonable care and use it only to perform this agreement. Customer
        Data is your confidential information.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms. For material changes we will notify workspace
        owners by email or in-app at least 30 days before they take effect.
        Continuing to use the Service after that date means you accept the
        updated Terms.
      </p>

      <h2>12. Governing law and disputes</h2>
      <p>
        <em>Placeholder — complete with your company&rsquo;s home jurisdiction.</em>{" "}
        These Terms are governed by the laws of [GOVERNING LAW JURISDICTION],
        excluding its conflict-of-law rules, and the courts of [COURTS /
        VENUE] have exclusive jurisdiction. Nothing here removes the protection
        of mandatory consumer-law rights, or the right of an EU/UK/Turkish data
        subject to complain to their own supervisory authority.
      </p>

      <h2>13. General</h2>
      <p>
        If a clause is held unenforceable, the rest stays in force. Failure to
        enforce a right is not a waiver of it. You may not assign these Terms
        without our consent; we may assign them to a successor in a merger or
        sale of the business. These Terms, together with the Privacy Policy and
        the DPA, are the entire agreement between us.
      </p>

      <h2>14. Contact</h2>
      <p>
        {company}
        {address ? <> — {address}</> : null}
        <br />
        Email: <a href={`mailto:${contact}`}>{contact}</a>
      </p>
    </article>
  );
}
