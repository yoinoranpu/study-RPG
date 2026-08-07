import { describe, it, expect } from "vitest";
import { calcDamage } from "./battle";

describe("calcDamage", () => {
  it("deals full attack when defense is 0", () => {
    expect(calcDamage(50, 0)).toBe(50);
  });

  it("halves damage when defense equals attack's reference (def=100)", () => {
    expect(calcDamage(100, 100)).toBe(50);
  });

  it("never drops below 1, even against huge defense", () => {
    expect(calcDamage(1, 100000)).toBe(1);
    expect(calcDamage(0, 50)).toBe(1);
  });

  it("is monotonically decreasing as defense rises", () => {
    let prev = calcDamage(80, 0);
    for (const def of [10, 25, 50, 100, 200]) {
      const dmg = calcDamage(80, def);
      expect(dmg).toBeLessThanOrEqual(prev);
      prev = dmg;
    }
  });
});
