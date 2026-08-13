// The Product-Manager starter framework, lifted from the prototype's CATALOG.
// Used only when a user explicitly clicks "Load PM starter framework" — the
// database is otherwise a clean slate.

export const PM_LEVELS = [
  "Associate (L3)",
  "Mid (L4)",
  "Senior (L5)",
  "Lead (L6)",
  "Principal (L7)",
  "VP (L8)",
];

// [group, icon, [subSkill, ...]]
export const STARTER_SKILL_GROUPS: {
  name: string;
  icon: string;
  subSkills: string[];
}[] = [
  {
    name: "Soft Skills",
    icon: "💬",
    subSkills: [
      "Doer", "Critical Thinking", "Leadership", "Growth Mindset",
      "Learning Curve", "Motivation", "Detail Orientation", "Empathy",
      "Communication Style",
    ],
  },
  {
    name: "Discovery",
    icon: "🔍",
    subSkills: [
      "Customer Obsession", "Research", "Understanding User Needs",
      "Defining User Needs", "Trends", "Domain Knowledge", "Competitor Analysis",
    ],
  },
  {
    name: "Design",
    icon: "✏️",
    subSkills: [
      "UX Focus", "Product Strategy", "Decision-Making", "PRDs",
      "Success Metrics", "Solution Design", "Business Modeling",
    ],
  },
  {
    name: "Delivery",
    icon: "🚚",
    subSkills: [
      "Communication", "Cross-functional Mgmt", "Tech Knowledge",
      "Planning / Prioritization", "Data Orientation", "PDLC",
      "Stakeholder Mgmt",
    ],
  },
  {
    name: "Adoption",
    icon: "🚀",
    subSkills: [
      "Product Iteration", "GTM Strategy", "KPI Tracking", "Training & Demos",
      "Launch Checklists", "Customer Support", "Documentation", "Release Notes",
      "Feedback Loops", "Sales Enablement", "Marketing Liaison", "Pricing",
      "Onboarding", "Lifecycle Comms",
    ],
  },
];

export const PROMOTION_CHECKLIST_ITEMS = [
  "Hard worker",
  "Delivers results",
  "Strong network",
  "Business understanding",
  "Effective communicator",
  "Takes additional responsibilities",
  "Continuous learning",
  "Team player",
  "Proactive",
];

export const DEFAULT_TALKING_POINTS = [
  "Walk through H1 goals — on track?",
  "Pairing / mentoring — kicked off?",
  "How did the last stretch task feel? Comfortable doing more?",
  "Career check-in: still aiming for the next level this year?",
  "Anything blocking that I'm not seeing?",
];

export const DEFAULT_INBOX_SOURCES: Record<string, boolean> = {
  "Quick keyboard": true,
  "Calendar (1:1s, reviews)": true,
  "Slack starred": true,
  "Linear / Jira closes": true,
  "GitHub PR reviews": false,
  "1:1 transcripts (beta)": false,
};

/**
 * Default expected score for a (levelIndex, subSkill) — a smooth ramp from
 * junior to senior, matching the prototype's `expectedFor` heuristic.
 */
export function defaultExpected(levelIdx: number, subSkill: string): number {
  const seed = (subSkill.length * 3 + levelIdx * 7) % 11;
  return Math.min(5, Math.max(1, Math.round(1 + (levelIdx / 5) * 4 + (seed - 5) * 0.15)));
}
