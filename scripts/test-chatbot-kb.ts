import { queryConsoleChatbot } from "@/lib/console-chatbot-kb";

const testQueries = [
  "What is a pressure transmitter?",
  "How does the PID Lab work?",
  "What's in the Intelligence section?",
  "How do I scale a 4-20mA signal?",
  "What case studies are in Projects?",
  "what's the weather today", // Deliberate out-of-scope query
];

console.log("===============================================================================");
console.log("CONTROLFORGE SCOPED CHATBOT KB TEST SUITE (scripts/test-chatbot-kb.ts)");
console.log("===============================================================================\n");

testQueries.forEach((q, idx) => {
  const res = queryConsoleChatbot(q);
  console.log(`--- TEST ${idx + 1} ---`);
  console.log(`QUERY: "${q}"`);
  console.log(`MATCHED: ${res.matched}`);
  console.log(`RAW RELEVANCE SCORE: ${res.rawScore !== undefined ? res.rawScore.toFixed(3) : "N/A"}`);
  console.log(`NORMALIZED CONFIDENCE: ${res.confidence.toFixed(3)} (Threshold: 0.275, equiv. to raw score 1.10)`);
  if (res.entry) {
    console.log(`ENTRY ID: ${res.entry.id} (${res.entry.title})`);
    console.log(`ROUTE: ${res.entry.routeRef}`);
  }
  console.log(`ANSWER:\n${res.answer}\n`);
});
