import { describe, it, expect } from "vitest";
import { pickReminders, type ReminderCandidate } from "./reminders";

function cand(p: Partial<ReminderCandidate> & { productId: string }): ReminderCandidate {
  return {
    name: p.productId,
    intervals: 2,
    avgIntervalDays: 10,
    stddevDays: 1,
    daysSince: 12,
    lastCompletedAt: "2026-08-01T00:00:00.000Z",
    ...p,
  };
}

describe("pickReminders", () => {
  it("inclui vencido (daysSince >= avg)", () => {
    expect(pickReminders([cand({ productId: "cafe", avgIntervalDays: 9, daysSince: 12 })]).map((r) => r.productId)).toEqual(["cafe"]);
  });
  it("exclui não-vencido (daysSince < avg)", () => {
    expect(pickReminders([cand({ productId: "x", avgIntervalDays: 30, daysSince: 5 })])).toEqual([]);
  });
  it("exclui abandonado (daysSince > avg*3)", () => {
    expect(pickReminders([cand({ productId: "x", avgIntervalDays: 10, daysSince: 40 })])).toEqual([]);
  });
  it("exclui cadência irregular (stddev > avg)", () => {
    expect(pickReminders([cand({ productId: "x", avgIntervalDays: 10, daysSince: 15, stddevDays: 20 })])).toEqual([]);
  });
  it("ordena por atraso relativo (mais atrasado primeiro)", () => {
    const out = pickReminders([
      cand({ productId: "a", avgIntervalDays: 10, daysSince: 12 }), // 1.2x
      cand({ productId: "b", avgIntervalDays: 10, daysSince: 20 }), // 2.0x
    ]);
    expect(out.map((r) => r.productId)).toEqual(["b", "a"]);
  });
  it("limita ao top N", () => {
    const many = Array.from({ length: 8 }, (_, i) => cand({ productId: `p${i}`, avgIntervalDays: 10, daysSince: 12 + i }));
    expect(pickReminders(many, { limit: 5 })).toHaveLength(5);
  });
  it("arredonda dias para exibição", () => {
    const [r] = pickReminders([cand({ productId: "x", avgIntervalDays: 9.4, daysSince: 12.6 })]);
    expect(r.daysSince).toBe(13);
    expect(r.avgIntervalDays).toBe(9);
  });
  it("ignora avg<=0 (sem divisão por zero)", () => {
    expect(pickReminders([cand({ productId: "x", avgIntervalDays: 0, daysSince: 5 })])).toEqual([]);
  });
});
