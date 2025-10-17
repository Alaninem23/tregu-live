export type Avatar = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  colors: [string, string]; // gradient
};

export const AVATARS: Avatar[] = [
  { id: "zen-fox",   name: "Zen Fox",   emoji: "🦊", tagline: "calm coach",            colors: ["#34d399","#10b981"] },
  { id: "byte-panda",name: "Byte Panda",emoji: "🐼", tagline: "cozy coder",            colors: ["#93c5fd","#60a5fa"] },
  { id: "rocket-owl",name: "Rocket Owl",emoji: "🦉", tagline: "night-shift strategist",colors: ["#f59e0b","#ef4444"] },
  { id: "neon-whale",name: "Neon Whale",emoji: "🐋", tagline: "deep-diver explainer",  colors: ["#22d3ee","#38bdf8"] },
  { id: "tinker-cat",name: "Tinker Cat",emoji: "🐱", tagline: "curious fixer",         colors: ["#f472b6","#a78bfa"] },
  { id: "sage-turtle",name:"Sage Turtle",emoji:"🐢", tagline:"slow & thorough",        colors: ["#16a34a","#065f46"] },
  { id: "spark-bot", name:"Spark Bot",  emoji:"🤖", tagline:"rapid ideator",           colors: ["#f97316","#f43f5e"] },
  { id: "astro-raccoon",name:"Astro Raccoon",emoji:"🦝",tagline:"scrappy researcher",  colors: ["#8b5cf6","#22d3ee"] },
  { id: "mercury-dolphin",name:"Mercury Dolphin",emoji:"🐬",tagline:"swift helper",    colors: ["#06b6d4","#14b8a6"] },
  { id: "quantum-llama",name:"Quantum Llama",emoji:"🦙",tagline:"logic untangler",     colors: ["#f43f5e","#ef4444"] },
  { id: "pixel-dragon",name:"Pixel Dragon",emoji:"🐲",tagline:"bold problem slayer",   colors: ["#22c55e","#84cc16"] },
  { id: "storm-koala",name:"Storm Koala",emoji:"🐨",tagline:"gentle but powerful",     colors: ["#38bdf8","#a78bfa"] },
];

export function getAvatar(id?: string | null) {
  return id ? AVATARS.find(a => a.id === id) ?? null : null;
}
