import type { EditionContent } from "./edition-content.types";

const content: EditionContent = {
  supportBlocks: [{ icon: "🧑‍⚕️", label: "Counselor" }],
  meeting: {
    kicker: "MEET THE NPCs",
    heading: "Ask what their job means",
    people: [
      {
        icon: "⚖️",
        name: "ATTORNEY",
        line: "My job is to listen and explain my role. Ask me what I keep private and what I may share.",
        spoken: "ATTORNEY. My job is to listen and explain my role. Ask me what I keep private and what I may share.",
      },
      {
        icon: "🧑‍💼",
        name: "SOCIAL WORKER",
        line: "My job is to check how things are going. Ask me what I write down or share.",
        spoken: "SOCIAL WORKER. My job is to check how things are going. Ask me what I write down or share.",
      },
    ],
    listenLabel: "HEAR INTRO",
    note: "Grown-up note: these are placeholders. Each professional should approve their own role and privacy wording.",
  },
  installLink: "Open the public Brave Blocks review link.",
  installPrivacy: "This review edition does not save or send a child’s game choices.",
  grownupRouteSpeech: "Grown-up guide.",
  grownupGateName: "Grown-Up Guide",
  grownupButtonAriaLabel: "Grown-ups: open the Grown-Up Guide",
  grownupButtonTarget: "guide",
  reviewBanner: {
    title: "DEPENDENCY ADVOCACY CENTER REVIEW EDITION",
    subtitle: "Independent, de-identified prototype · no responses are saved or sent",
  },
  grownupGuide: {
    title: "Grown-up Guide",
    subtitle: "Keep the fun child-led and the child’s answers their own.",
    kicker: "DEPENDENCY ADVOCACY CENTER REVIEW",
    heading: "What should attorneys and support teams notice?",
    checklist: [
      "Does the language feel neutral, concrete, and right for this early reader?",
      "Could any activity feel leading, activating, or too close to a forensic interview?",
      "Which coping choices match the child’s existing support and safety plans?",
      "Should the Pause Portal or Meeting Loadout choices be renamed for this child?",
      "Can each professional approve the wording that describes their role, confidentiality, and privacy limits?",
      "What should be added, simplified, or removed before the child uses it?",
    ],
    checklistNote: "Please share observations with the caregiver outside this game. This preview does not collect responses.",
    cards: [
      { icon: "🧭", title: "Follow, don’t lead", body: "Let the child choose. Reflect their exact words without suggesting feelings, facts, people, or outcomes." },
      { icon: "🫶", title: "Connection first", body: "Play for 5–10 minutes. Stop if he becomes flooded, frozen, avoidant, or simply wants to stop." },
      { icon: "🔐", title: "Protect privacy", body: "Do not ask the child to report what they told their attorney. Have each professional explain their role and privacy limits directly." },
      { icon: "🌱", title: "Welcome loyalty", body: "He can love, miss, fear, or feel angry with anyone while also loving and attaching to you." },
      { icon: "🗣️", title: "Helpful phrases", body: "“All feelings are allowed.” “You don’t have to fix grown-up feelings.” “I’ll love you after any answer.”" },
      { icon: "🤝", title: "Share the tool", body: "Let the child’s clinician, attorney, and social worker adjust meeting language for the child’s developmental needs." },
      { icon: "✨", title: "Stories without pressure", body: "Courage Campfire uses fictional character stories. It never asks the child to match a story to their family or case." },
      { icon: "🎵", title: "Familiar music", body: "Music Power-Up opens a music site only after a deliberate tap. It never embeds, autoplays, tracks listening activity, or records the child’s signal check." },
      { icon: "👐", title: "Safe, not suppressed", body: "Validate the feeling first, then offer two safe choices. Practice the Safety Power-Ups when he is regulated—not as a demand during peak distress." },
      { icon: "🛡️", title: "Safety plan", body: "If anyone is in immediate danger, move people and unsafe objects apart, get help, and follow the safety plan made with his clinician or pediatrician." },
      { icon: "🎙️", title: "Original voice only", body: "The prerecorded narrator sounds consistent across devices and does not imitate a celebrity, artist, influencer, or copyrighted character." },
      { icon: "⏭️", title: "Passing still counts", body: "Reward practicing a choice—not disclosure, agreement, or a particular feeling. “Pass” should remain a complete and respected response." },
    ],
    noticeLead: "Important:",
    noticeBody: "Brave Blocks supports play and skills practice. It is not therapy, a forensic interview, legal advice, or a substitute for case-specific safety planning. This independent prototype is prepared for DAC review and is not yet an official DAC service.",
  },
};

export default content;
