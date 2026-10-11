export type Question = {
  id: string;
  level: number;
  title: string;
  type: string;
  tier: "Easy" | "Medium" | "Hard" | "Boss";
  points: number;
  story: string;
  task: string;
  tools: string;
  hints: [string, string];
  answer: string; // normalized flag, compared case-insensitively
  solution: string;
  setup: string;
};

const P = { Easy: 100, Medium: 200, Hard: 300, Boss: 500 } as const;
const q = (o: Omit<Question, "points" | "id"> ): Question => ({ ...o, id: `L${o.level}`, points: P[o.tier] });

export const QUESTIONS: Question[] = [
  q({ level: 1, title: "The Missing Intern", type: "Digital OSINT", tier: "Easy",
    story: "An intern named Riya Kapoor vanished from the Cyber Club after leaving one photo behind.",
    task: "You receive a photo of a red-brick clock tower with a peacock statue in front. Identify the building on campus where she was last seen.",
    tools: "Google Lens", hints: ["Reverse image search the tower.", "The clock tower belongs to the oldest academic block."],
    answer: "SHADOW{CLOCK_TOWER}", solution: "Google Lens matches the photo to the campus Clock Tower page.", setup: "Upload a campus clock tower photo to the college website gallery." }),
  q({ level: 2, title: "Shutter Secrets", type: "Metadata Analysis", tier: "Easy",
    story: "Riya's camera remembers more than she wanted.",
    task: "Download the file riya_last.jpg from the event drive. Find the camera model in its metadata.",
    tools: "EXIF Viewer", hints: ["Look at the 'Make/Model' field.", "It's a Canon EOS model."],
    answer: "SHADOW{CANON_EOS_1500D}", solution: "Open in an EXIF viewer: Model = Canon EOS 1500D.", setup: "Edit EXIF of riya_last.jpg to Canon EOS 1500D." }),
  q({ level: 3, title: "Notice Board Whisper", type: "Physical Search", tier: "Easy",
    story: "A torn poster on a board hides a square of black and white.",
    task: "Go to the notice board outside the Library. Scan the QR code on the 'Lost & Found' poster.",
    tools: "Physical Exploration, QR Scanner", hints: ["Library ground floor entrance.", "Behind the yellow poster."],
    answer: "SHADOW{LOST_NOT_GONE}", solution: "The QR code shows the flag text.", setup: "Pin a Lost & Found poster with a QR encoding SHADOW{LOST_NOT_GONE}." }),
  q({ level: 4, title: "The Deleted Instagram Post", type: "Social Media OSINT", tier: "Easy",
    story: "Her account @riya.traces deleted a post — but a comment survived.",
    task: "Find the Instagram account @riya.traces. Read the pinned comment on the latest post to get a 4-digit locker number.",
    tools: "Instagram", hints: ["Check the comments, not captions.", "The comment is by @shadow_watcher_07."],
    answer: "SHADOW{LOCKER_4417}", solution: "Pinned comment: 'locker 4417'.", setup: "Create @riya.traces with one post and pinned comment from @shadow_watcher_07." }),
  q({ level: 5, title: "Coordinates in the Sky", type: "Metadata Analysis", tier: "Easy",
    story: "A drone photo carries a GPS tag.",
    task: "Extract GPS coordinates from drone_shot.jpg and find the named campus spot on Google Maps.",
    tools: "EXIF Viewer, Google Maps", hints: ["GPS Latitude/Longitude fields.", "It's a place where students eat."],
    answer: "SHADOW{CANTEEN}", solution: "Coordinates point to the main canteen.", setup: "Embed canteen GPS into drone_shot.jpg." }),
  q({ level: 6, title: "Wayback Whispers", type: "Web Archiving", tier: "Medium",
    story: "The club website once listed a member who no longer exists.",
    task: "Look up shadowtrace-club.github.io on the Wayback Machine. The 2024 snapshot lists a 'Vice-Lead'. Give their surname.",
    tools: "Wayback Machine", hints: ["Use web.archive.org.", "Check the Team page of the earliest snapshot."],
    answer: "SHADOW{MEHRA}", solution: "Archived Team page lists Vice-Lead: Arjun Mehra.", setup: "Publish and archive a page listing Arjun Mehra, then remove it." }),
  q({ level: 7, title: "LinkedIn Ghost", type: "Social Media OSINT", tier: "Medium",
    story: "Arjun Mehra has a professional profile with a strange skill.",
    task: "Find 'Arjun Mehra – Security Analyst at NullByte Labs' on LinkedIn. One endorsed skill is a code word.",
    tools: "LinkedIn", hints: ["Look at the Skills section.", "It's a bird."],
    answer: "SHADOW{NIGHTJAR}", solution: "Skill listed: 'Nightjar'.", setup: "Create a mock LinkedIn profile with skill 'Nightjar'." }),
  q({ level: 8, title: "Caesar's Note", type: "Cipher", tier: "Medium",
    story: "A note in Arjun's handwriting: 'VKDGRZ JDUGHQ'.",
    task: "Decode the text VKDGRZ JDUGHQ.",
    tools: "CyberChef (ROT/Caesar)", hints: ["Shift letters back.", "Shift of 3."],
    answer: "SHADOW{SHADOW_GARDEN}", solution: "Caesar -3 → SHADOW GARDEN.", setup: "None." }),
  q({ level: 9, title: "Garden Seat 12", type: "Physical Search", tier: "Medium",
    story: "In the garden, one bench remembers.",
    task: "Go to the campus garden. Under bench number 12 is an envelope with a word.",
    tools: "Physical Exploration", hints: ["Benches are numbered on metal tags.", "Near the fountain."],
    answer: "SHADOW{ECHO}", solution: "Envelope contains 'ECHO'.", setup: "Tape an envelope with ECHO under bench 12." }),
  q({ level: 10, title: "Locked PDF", type: "Password-protected PDF", tier: "Medium",
    story: "A file named dossier.pdf asks for a password.",
    task: "Open dossier.pdf from the drive. Password = locker number from Level 4 + the word from Level 9. Read the agent name inside.",
    tools: "PDF Reader", hints: ["Combine like 4417ECHO.", "All caps, no spaces."],
    answer: "SHADOW{AGENT_KESTREL}", solution: "Password 4417ECHO, PDF reveals Agent Kestrel.", setup: "Protect dossier.pdf with 4417ECHO." }),
  q({ level: 11, title: "X Marks the Tweet", type: "Social Media OSINT", tier: "Medium",
    story: "Agent Kestrel posts only in riddles.",
    task: "Find @kestrel_ops on X. One post has Base64 text. Decode it.",
    tools: "X, CyberChef", hints: ["Text ends with '='.", "From Base64 recipe."],
    answer: "SHADOW{TRUST_NO_ONE}", solution: "Base64 decode gives TRUST_NO_ONE.", setup: "Post 'VFJVU1RfTk9fT05F' from @kestrel_ops." }),
  q({ level: 12, title: "Vigenère Lab", type: "Cipher", tier: "Medium",
    story: "Lab 3 whiteboard: 'TPUZM' with key written as a bird.",
    task: "Decrypt TPUZM using Vigenère with key from Level 7.",
    tools: "CyberChef (Vigenère)", hints: ["Key = NIGHTJAR.", "Result is a 5-letter word."],
    answer: "SHADOW{GHOST}", solution: "Vigenère decode with key NIGHTJAR.", setup: "Write TPUZM on Lab 3 whiteboard." }),
  q({ level: 13, title: "Double Layer", type: "Multi-layer Cipher", tier: "Hard",
    story: "The message is wrapped twice.",
    task: "Decode: 'RlVOUUJKe1lOTFJFRl9CU19ZVlJGfQ==' (Base64 then ROT13).",
    tools: "CyberChef", hints: ["Base64 first.", "Then ROT13."],
    answer: "SHADOW{LAYERS_OF_LIES}", solution: "Base64 → ROT13 → SHADOW{LAYERS_OF_LIES}.", setup: "Regenerate this string in CyberChef with your own final flag." }),
  q({ level: 14, title: "Triangulation", type: "GPS Cross-reference", tier: "Hard",
    story: "Three photos, three places, one center.",
    task: "Three images (A, B, C) have GPS tags. The campus building at the center of the triangle is the answer.",
    tools: "EXIF Viewer, Google Maps", hints: ["Plot all three pins.", "It's an auditorium."],
    answer: "SHADOW{MAIN_AUDITORIUM}", solution: "Centroid of three points lies on the Main Auditorium.", setup: "Tag 3 images around the auditorium." }),
  q({ level: 15, title: "Spectrogram Song", type: "Audio Spectrogram", tier: "Hard",
    story: "An audio file hums a hidden word.",
    task: "Open signal.wav in a spectrogram viewer and read the word.",
    tools: "Spectrogram viewer (e.g. online)", hints: ["View frequencies, not waveform.", "Look between 5–10 kHz."],
    answer: "SHADOW{PHANTOM}", solution: "Spectrogram shows PHANTOM.", setup: "Generate signal.wav with an image-to-audio tool spelling PHANTOM." }),
  q({ level: 16, title: "The Ghost Domain", type: "Multi-tool OSINT", tier: "Hard",
    story: "PHANTOM is also a website… once.",
    task: "Find the archived page phantom-shadowtrace.netlify.app. Its footer has a reg number of a vehicle.",
    tools: "Wayback Machine", hints: ["Scroll to footer.", "Format: XX00XX0000."],
    answer: "SHADOW{MH12SK0420}", solution: "Archived footer shows MH12SK0420.", setup: "Deploy and archive this page." }),
  q({ level: 17, title: "Parking Lot P2", type: "Physical Search", tier: "Hard",
    story: "The plate leads to a parked scooter.",
    task: "In parking lot P2, find a scooter with plate MH12SK0420. A sticker on its seat has a word.",
    tools: "Physical Exploration", hints: ["Row near the gate.", "Grey scooter."],
    answer: "SHADOW{MIRROR}", solution: "Sticker reads MIRROR.", setup: "Place sticker on a volunteer scooter (or printed plate prop)." }),
  q({ level: 18, title: "Mirror Text", type: "Cipher", tier: "Hard",
    story: "Read it the other way.",
    task: "Decode: 'GNIDLIUB_ECNEICS' (it's a mirror) then give the place.",
    tools: "Logic", hints: ["Reverse the string.", "SCIENCE BUILDING."],
    answer: "SHADOW{SCIENCE_BUILDING}", solution: "Reverse gives SCIENCE_BUILDING.", setup: "None." }),
  q({ level: 19, title: "Boss I – Room 204", type: "Physical + OSINT", tier: "Boss",
    story: "Riya was held in a room only the archive knows.",
    task: "In the Science Building, find room numbers listed on the archived page from Level 6 (Events tab). Visit that room; on the desk is a QR leading to a password-protected note. Password = Level 15 answer. Submit the final word.",
    tools: "Wayback Machine, Physical, QR", hints: ["Room 204.", "Password: PHANTOM."],
    answer: "SHADOW{RESCUE_IMMINENT}", solution: "Room 204 → QR → note unlocked with PHANTOM.", setup: "Archive Events tab mentioning Room 204; place QR to a locked note." }),
  q({ level: 20, title: "Boss II – ShadowTrace Unmasked", type: "Multi-stage", tier: "Boss",
    story: "Who is behind it all?",
    task: "Combine first letters of answers from Levels 7, 1, 11, 4, 5, 9 (inside braces) to name the mastermind's codename.",
    tools: "Logic", hints: ["Use words like NIGHTJAR, CLOCK…", "N C T L C E."],
    answer: "SHADOW{NCTLCE}", solution: "N(ightjar) C(lock) T(rust) L(ocker) C(anteen) E(cho).", setup: "Replace with your own reveal and change this flag." }),
];

export const byId = (id: string) => QUESTIONS.find((x) => x.id === id);
export const normalize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

export async function loadQuestions(): Promise<Question[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { questionSchema } = await import("./question-schema");
  const { data, error } = await supabaseAdmin.from("question_overrides").select("id,content");
  if (error) throw new Error("Could not load questions");
  const overrides = new Map<string, Question>();
  for (const row of data ?? []) {
    const parsed = questionSchema.safeParse(row.content);
    if (!parsed.success || parsed.data.id !== row.id) throw new Error("Invalid saved question");
    overrides.set(row.id, parsed.data);
  }
  return QUESTIONS.map((q) => overrides.get(q.id) ?? q);
}
