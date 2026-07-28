export const VALID_EDITIONS = new Set(["REVIEW", "CHILD"]);

export function currentEdition() {
  const edition = (process.env.NEXT_PUBLIC_BRAVE_BLOCKS_EDITION || "REVIEW").trim().toUpperCase();
  if (!VALID_EDITIONS.has(edition)) {
    throw new Error(`NEXT_PUBLIC_BRAVE_BLOCKS_EDITION must be REVIEW or CHILD, received "${edition}".`);
  }
  return edition;
}

export const reviewOnlyNarrationLines = new Set([
  "Grown-up guide.",
  "Grown-up Guide. Keep the fun child-led and the child’s answers their own.",
  "ATTORNEY. My job is to listen and explain my role. Ask me what I keep private and what I may share.",
  "SOCIAL WORKER. My job is to check how things are going. Ask me what I write down or share.",
  "Counselor",
]);

export const childEditionBannedTerms = [
  { label: "professional review organization", pattern: /\bDependency Advocacy Center\b/i },
  { label: "review edition/team language", pattern: /\breview (?:edition|team|checklist|link)\b/i },
  { label: "de-identification language", pattern: /\bde-identified\b/i },
  { label: "professional preview", pattern: /\bprofessional preview\b/i },
  { label: "care-team language", pattern: /\bcare team\b/i },
  { label: "forensic-interview language", pattern: /\bforensic interview\b/i },
  { label: "therapy language", pattern: /\btherapy|therapist\b/i },
  { label: "legal language", pattern: /\blegal (?:advice|outcomes?)\b/i },
  { label: "attorney", pattern: /\battorney\b/i },
  { label: "social worker", pattern: /\bsocial worker\b/i },
  { label: "clinician", pattern: /\bclinician\b/i },
  { label: "pediatrician", pattern: /\bpediatrician\b/i },
  { label: "counselor", pattern: /\bcounselor\b/i },
  { label: "court", pattern: /\bcourt\b/i },
  { label: "judge", pattern: /\bjudge\b/i },
  { label: "TPR", pattern: /\bTPR\b/ },
  { label: "reunification", pattern: /\breunification\b/i },
  { label: "parental rights", pattern: /\bparental rights\b/i },
  { label: "clinical state language", pattern: /\bflooded|activating\b/i },
];
