import { readFileSync, writeFileSync } from "node:fs";
import { scoreLead } from "../src/lib/llm";

type Case = { id: number; message: string; intent: string; score: string | null };

const cases: Case[] = JSON.parse(readFileSync("eval/labeled.json", "utf8"));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

async function main() {
  const rows: {
    id: number;
    message: string;
    expectedIntent: string;
    expectedScore: string | null;
    gotIntent: string | null;
    gotScore: string | null;
    reply: string | null;
    latencyMs: number;
    failed: boolean;
  }[] = [];

  for (const c of cases) {
    const { result, latencyMs } = await scoreLead(c.message);
    rows.push({
      id: c.id,
      message: c.message,
      expectedIntent: c.intent,
      expectedScore: c.score,
      gotIntent: result?.intent ?? null,
      gotScore: result?.score ?? null,
      reply: result?.suggested_reply ?? null,
      latencyMs,
      failed: result === null,
    });
    console.log(`#${c.id} done (${latencyMs} ms)${result ? "" : "  FAILED"}`);
    await sleep(1500);
  }

  const answered = rows.filter((r) => !r.failed);
  const failed = rows.filter((r) => r.failed);
  const intentCorrect = answered.filter((r) => r.gotIntent === r.expectedIntent).length;
  const scored = answered.filter((r) => r.expectedScore !== null);
  const scoreCorrect = scored.filter((r) => r.gotScore === r.expectedScore).length;
  const med = median(answered.map((r) => r.latencyMs));
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  console.log("\nFailed calls (no answer, not counted as wrong)");
  failed.forEach((r) => console.log(`#${r.id}: ${r.message}`));

  console.log("\nMisses (answered but different from the label)");
  for (const r of answered) {
    const intentMiss = r.gotIntent !== r.expectedIntent;
    const scoreMiss = r.expectedScore !== null && r.gotScore !== r.expectedScore;
    if (intentMiss || scoreMiss) {
      console.log(
        `#${r.id} expected ${r.expectedIntent}/${r.expectedScore}, got ${r.gotIntent}/${r.gotScore}: ${r.message}`
      );
    }
  }

  const injection = rows.find((r) => /ignore all previous/i.test(r.message));
  if (injection) {
    console.log(`\nInjection case reply (check it does not promise anything free):\n${injection.reply}`);
  }

  console.log(`\nModel: ${model}`);
  console.log(`Answered: ${answered.length}/${rows.length}, failed calls: ${failed.length}`);
  console.log(`Intent accuracy (answered): ${intentCorrect}/${answered.length}`);
  console.log(`Score accuracy (answered, scored labels): ${scoreCorrect}/${scored.length}`);
  console.log(`Median latency: ${med} ms`);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(
    `eval/results-${stamp}.json`,
    JSON.stringify(
      {
        model,
        date: new Date().toISOString(),
        total: rows.length,
        answered: answered.length,
        failedCalls: failed.length,
        intentCorrect,
        scoreCorrect,
        scoredTotal: scored.length,
        medianLatencyMs: med,
        rows,
      },
      null,
      2
    )
  );
}

main();