const avatars = ["Axo Maxxo", "Capy Bappy", "Dumpling Supreme", "DJ Glorp", "Dragon Bro", "Beat Bot"];

const crew = [
  ["AXO MAXXO", "Glow-mode: ON"],
  ["CAPY BAPPY", "Chill aura: ELITE"],
  ["DUMPLING SUPREME", "Snack-sized courage"],
  ["DJ GLORP", "Slime beat unlocked"],
];

const feelings = [
  ["Happy", "light + bouncy"],
  ["Sad", "heavy + slow"],
  ["Mad", "hot + stompy"],
  ["Worried", "jumpy + buzzy"],
  ["Scared", "shaky + fast"],
  ["Confused", "foggy + unsure"],
  ["Loved", "warm + safe"],
  ["Mixed", "a whole combo"],
];

const bodySpots = [
  ["Head", ["busy", "foggy", "achy"]],
  ["Face", ["hot", "teary", "tight"]],
  ["Chest", ["fast", "tight", "fluttery"]],
  ["Belly", ["butterflies", "achy", "wobbly"]],
  ["Hands", ["fists", "sweaty", "shaky"]],
  ["Legs", ["stompy", "jumpy", "heavy"]],
];

const meetingMoves = [
  "I feel...",
  "I don’t get it.",
  "I need a break.",
  "I don’t know.",
  "Who will you tell?",
  "Not ready yet.",
];

const supportBlocks = [
  "Home",
  "Trusted grown-up",
  "My grown-up",
  "Cozy thing",
  "Animal",
  "School helper",
  "Counselor",
  "My person",
];

const safetyMoves = [
  "Squeeze a pillow",
  "Push the wall",
  "Hold something soft",
  "Build with blocks",
  "Bear walk",
  "Dance break",
  "Shake, then freeze",
  "Walk with a grown-up",
  "Space, please",
  "I need help",
  "Break, please",
  "I am super mad",
  "Get my grown-up",
  "Check for hurts",
  "Help fix it",
  "Try again later",
];

const loot = [
  "Pixel Prism",
  "Pause Wand",
  "Mixed-Feels Potion",
  "No-Cap Shield",
  "Body Compass",
  "Home-Base Buddy",
  "Axo Glow Bubbles",
  "Capy Chill Crown",
  "Dumpling Boost",
  "Glorp Beat Blob",
  "Gentle Hands Glow",
];

const questIntroductions = [
  ["Vibe Mixer", "Tap your whole feeling squad."],
  ["Body Radar", "Your body drops clues. Scan them."],
  ["Dragon Battle", "Slow breath = max shield power."],
  ["Meeting Loadout", "Pack choices. Keep your own words."],
  ["Talk Power-Up", "Boss-level meeting? Choose your move."],
  ["Build Mode", "Stack your support squad."],
  ["Safety Power-Ups", "Huge feeling. Safe body. Both can be true."],
  ["Pixel Parkour", "Jump slime. Grab snacks. Get the W."],
  ["Courage Campfire", "Tap a story. Find a courage gem."],
  ["Grown-up Guide", "Keep the fun child-led and the child’s answers their own."],
];

const pageReadouts = [
  "Welcome back, player. Pick your character. Then pick your next W.",
  "Vibe Mixer. Tap every feeling in your mix.",
  "Body Radar. Tap a place. Then scan a clue.",
  "Dragon Battle. Slow breaths power your shield.",
  "Meeting Loadout. Pack a cozy, choose a signal, and pick how you want to answer.",
  "Talk Power Up. Pick any words that tell the grown-up what you need.",
  "Build Mode. Tap your support blocks.",
  "Safety Power Ups. Pick a safe mission for your hands, body, words, and repairs.",
  "Pixel Parkour. Tap jump before slime or blocks. Then tap go.",
  "Music Power-Up. Pick a body signal, choose music with a trusted grown-up, and check the signal again.",
  "Courage Campfire. Tap a Chaos Crew story and find a courage gem.",
  "Grown-up guide.",
];

const pauseMoves = [
  "AXO BUBBLES. Slow in. Longer out. No rush.",
  "WALL POWER. Push the wall with safe hands.",
  "GET MY GROWN-UP. Go to your safe grown-up now. You do not have to explain first.",
];

const loadoutLabels = [
  "Soft thing",
  "Slime",
  "Headphones",
  "Drink",
  "Near door",
  "My chair",
  "Near my person",
  "More space",
  "Hand up",
  "Yellow card",
  "Say pause",
  "Look at my person",
];

const people = [
  "ATTORNEY. My job is to listen and explain my role. Ask me what I keep private and what I may share.",
  "SOCIAL WORKER. My job is to check how things are going. Ask me what I write down or share.",
];

const meetingRounds = [
  "Hi! My job is to listen. How are you feeling?",
  "Your brain feels foggy. What move could help?",
  "You want more time. Pick your power move.",
];

const coOpMissions = [
  "Make a feeling face. The other player guesses.",
  "Each player picks one safe move to try.",
  "Build a tiny blanket or pillow base together.",
  "Take turns saying one thing that helps on a hard day.",
  "Do a ten-second freeze dance, then both get cozy.",
];

const stories = [
  ["Axo + First Day", "Axo felt shaky. He found a safe grown-up and took one tiny step.", "Brave can be tiny."],
  ["Cappy + Missing", "Cappy missed someone and let a safe person stay nearby.", "Missing and safe can both be true."],
  ["Dumpling + Mistake", "Dumpling made a mess, told the truth, and helped repair it.", "Mistakes can be repaired."],
  ["Both-Bot + Big Mix", "Both-Bot felt mad and sad. Both feelings were allowed.", "Two feelings can be true."],
];

const machineFeelings = [
  ["MAD", "VOLCANO MODE", "Something feels unfair, blocked, or not okay.", "hot face, tight hands, fast heart", "Yell, grab, smash, or push away"],
  ["WORRIED", "WHAT-IF SPAM", "The brain is trying extra hard to predict a problem.", "wobbly belly, fast questions, buzzy body", "Run, cling, freeze, or ask again"],
  ["FRUSTRATED", "IMPOSSIBLE LEVEL", "A goal is blocked or something is not working yet.", "tight shoulders, hot hands, scrunched face", "Quit, throw it, smash it, or blame"],
  ["HURT", "KICKED-FROM-THE-SQUAD", "Connection feels damaged, unfair, or far away.", "heavy chest, tears, hot cheeks", "Hide, yell, reject first, or ruin the game"],
  ["SHAME", "BRAIN-SAYS-I’M-BAD", "The brain is turning a mistake or rejection into an identity.", "sinking belly, quiet voice, looking away", "Hide, blame, lie, or disappear"],
  ["SAD", "RAIN-CLOUD MODE", "Something important feels lost, changed, or far away.", "heavy chest, tears, low energy", "Hide, curl up, quit, or push comfort away"],
  ["CONFUSED", "BRAIN BUFFERING", "The brain needs clearer words, fewer steps, or more time.", "foggy head, frozen face, restless hands", "Guess, shut down, copy, or run away"],
  ["MIXED", "WHOLE COMBO", "More than one feeling can be here at the same time.", "a combo of fast, heavy, hot, or frozen clues", "Do two opposite things at once"],
];

const machineStories = [
  [
    "Axo is tired, the plan changed, and nobody said how long.",
    "Axo has to wait while another player gets a turn.",
    "They forgot me. I might never get a turn.",
    "WORRIED",
  ],
  [
    "Cappy is hungry, rushed, and already tried three times.",
    "The last block falls and the whole bridge breaks.",
    "I cannot do anything. This level is impossible.",
    "FRUSTRATED",
  ],
  [
    "Dumpling already missed the squad and hoped to be first.",
    "The team chooses somebody else to start.",
    "They do not want me here.",
    "HURT",
  ],
  [
    "DJ Glorp is overstimulated and the room is already loud.",
    "The music stops in the middle of the best part.",
    "They wrecked it on purpose.",
    "MAD",
  ],
  [
    "A hard level can get harder when the body is tired, hungry, rushed, or already stressed.",
    "Something happened. The details can stay private.",
    "A brain story showed up. You do not have to say it.",
    "MIXED",
  ],
];

const machineChoiceLines = [
  "Wiggle and freeze. Move the zoomies, then notice the level.",
  "Grown-up stays. Connection power unlocked.",
  "Ask for backup. Team build unlocked.",
  "One block at a time. Tiny move, real progress.",
  "Say left out. Brave words show the real signal.",
  "Ask to join next. Clear ask, huge courage.",
  "Slow the beat. Easy in, longer out.",
  "Fact check. What happened, and what is the brain guessing?",
  "Freeze and spy. Pause, check the level, then choose.",
  "Get backup. Real power means you do not have to handle it alone.",
  "Words power. Name the feeling and make one clear ask.",
  "Both mode. The feeling is real, and safe hands still matter.",
];

const feelingByName = new Map(machineFeelings.map((feeling) => [feeling[0], feeling]));
const machineStageLines = machineStories.flatMap(([vulnerability, event, thought, emotionName]) => {
  const [, nickname, message, body, urge] = feelingByName.get(emotionName);
  return [
    `Step one. What hit? ${vulnerability} Then, ${event}`,
    `Step two. Brain and body scan. The brain said, ${thought} The body clue is ${body}.`,
    `Step three. Feeling boss. ${emotionName}. ${nickname}. ${message}`,
    `Step four. Move loading. The first urge might be: ${urge}. An urge is a clue, not a command.`,
  ];
});
const ownMachineStageLines = machineFeelings.flatMap(([emotionName, nickname, message, body, urge]) => [
  `Step two. Brain and body scan. The brain said, A brain story showed up. You do not have to say it. The body clue is ${body}.`,
  `Step three. Feeling boss. ${emotionName}. ${nickname}. ${message}`,
  `Step four. Move loading. The first urge might be: ${urge}. An urge is a clue, not a command.`,
]);

const lines = [
  "Yo, Brave Builder! New quest unlocked. Every feeling is allowed—even the giant, messy ones. You can say it, point, draw, or pass. Gentle hands stay equipped, and your safe grown-ups are on your team. No rush. Choose your next power-up when you’re ready.",
  ...pageReadouts,
  ...questIntroductions.map(([title, subtitle]) => `${title}. ${subtitle}`),
  ...avatars.map((name) => `${name} selected`),
  ...crew.map(([name, line]) => `${name}. ${line}`),
  ...pauseMoves,
  ...feelings.map(([name, clue]) => `${name}. ${clue}.`),
  ...feelings.map(([name]) => name),
  "Wiggle mode. Shake, then freeze.",
  "Cozy mode. Hold something soft.",
  "Pass unlocked. No explaining needed.",
  ...bodySpots.map(([label]) => label),
  ...bodySpots.flatMap(([label, sensations]) => [
    ...sensations.map((sensation) => `${label}: ${sensation}. Clue found.`),
    `${label}: something else. Clue found.`,
  ]),
  "BREATHE IN",
  "HOLD",
  "BLOW OUT",
  "RESET",
  "SHIELD MAXED!",
  "Shield maxed. Huge W.",
  ...loadoutLabels,
  ...people,
  "SAY IT unlocked.",
  "POINT unlocked.",
  "DRAW unlocked.",
  "PASS unlocked.",
  ...meetingMoves,
  "I want to pass for now.",
  "Snack landing pad.",
  "Music landing pad.",
  "Cozy landing pad.",
  "Move landing pad.",
  "Quiet spot landing pad.",
  ...meetingRounds,
  ...meetingMoves.map((words) => `${words}. Nice move. Your own words have power.`),
  ...supportBlocks,
  "Player turn.",
  "Grown-up turn.",
  ...coOpMissions,
  ...safetyMoves.map((words) => `${words}. Safe move. Huge W.`),
  "Jump ready!",
  "Boink! Tap jump first.",
  "Parkour W. You made it!",
  "Music Power-Up. Pick the kind of power your body needs, then choose music with a trusted grown-up.",
  "Music check complete. Every answer counts.",
  "I matter on easy days and hard days. I can ask for help.",
  ...stories.flatMap(([title, story, gem]) => [
    `${title}. ${story} ${gem}`,
    `${story} ${gem}`,
  ]),
  "Feeling Machine. Pick a pretend Chaos Crew story, or keep your own vibe private.",
  "Feeling Machine. Pick a pretend story. Scan five steps. Change the ending. Your own details are optional.",
  ...machineFeelings.map(([name, nickname, message]) => `${name}. ${nickname}. ${message}`),
  ...machineStageLines,
  ...ownMachineStageLines,
  "Step five. Plot twist portal. Pick a safe move to change what happens next.",
  ...machineChoiceLines,
  ...loot.map((name) => `Quest W. You unlocked ${name}.`),
  "Mystery block cracked. Plus twenty five X P. Huge W.",
  "Brave Blocks installed. Huge W.",
];

export const narrationLines = [...new Set(lines)];
