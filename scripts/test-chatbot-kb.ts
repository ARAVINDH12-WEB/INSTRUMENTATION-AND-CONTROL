import { queryConsoleChatbot } from "@/lib/console-chatbot-kb";

const originalQueries = [
  "What is a pressure transmitter?",
  "How does the PID Lab work?",
  "What's in the Intelligence section?",
  "How do I scale a 4-20mA signal?",
  "What case studies are in Projects?",
  "what's the weather today",
];

const check1Queries = [
  "sensor",
  "what is the price of this",
  "tell me a joke",
  "pressure",
  "how does a valve work in a loop",
];

const THRESHOLD = 0.262;

function evaluateQuery(q: string) {
  const res = queryConsoleChatbot(q);
  const diff = Math.abs(res.confidence - THRESHOLD);
  const isNearMiss = diff <= 0.03;

  return {
    ...res,
    isNearMiss,
    diff,
  };
}

console.log("===============================================================================");
console.log("PART A: ORIGINAL BENCHMARK QUERIES (Regression Check)");
console.log("===============================================================================\n");

originalQueries.forEach((q, idx) => {
  const res = evaluateQuery(q);
  console.log(`--- BENCHMARK ${idx + 1} ---`);
  console.log(`QUERY: "${q}"`);
  console.log(`MATCHED: ${res.matched}`);
  console.log(`RAW RELEVANCE SCORE: ${res.rawScore !== undefined ? res.rawScore.toFixed(3) : "N/A"}`);
  console.log(`LOG-SCALED CONFIDENCE: ${res.confidence.toFixed(3)} (Threshold: 0.262, S_ref: 16.0)`);
  console.log(`NEAR-MISS FLAG (within ±0.03 of 0.262): ${res.isNearMiss ? "YES [NEAR MISS]" : "NO"}`);
  if (res.entry) {
    console.log(`ENTRY ID: ${res.entry.id} (${res.entry.title})`);
    console.log(`ROUTE: ${res.entry.routeRef}`);
  }
  console.log(`ANSWER:\n${res.answer}\n`);
});

console.log("===============================================================================");
console.log("PART B: CHECK 1 THRESHOLD ROBUSTNESS QUERIES");
console.log("===============================================================================\n");

check1Queries.forEach((q, idx) => {
  const res = evaluateQuery(q);
  console.log(`--- CHECK 1.${idx + 1} ---`);
  console.log(`QUERY: "${q}"`);
  console.log(`MATCHED: ${res.matched}`);
  console.log(`RAW RELEVANCE SCORE: ${res.rawScore !== undefined ? res.rawScore.toFixed(3) : "N/A"}`);
  console.log(`LOG-SCALED CONFIDENCE: ${res.confidence.toFixed(3)} (Threshold: 0.262, S_ref: 16.0)`);
  console.log(`NEAR-MISS FLAG (within ±0.03 of 0.262): ${res.isNearMiss ? "YES [RISKY NEAR-MISS]" : "NO"}`);
  if (res.entry) {
    console.log(`ENTRY ID: ${res.entry.id} (${res.entry.title})`);
    console.log(`ROUTE: ${res.entry.routeRef}`);
  }
  console.log(`ANSWER:\n${res.answer}\n`);
});
