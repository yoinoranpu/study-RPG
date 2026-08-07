import { describe, it, expect } from "vitest";
import { calcExp, calcGold, calcFloorProgress, expToLevel, expForLevel, expUsedUpTo } from "./timer";

describe("calcExp", () => {
  it("uses the <10min rate", () => {
    expect(calcExp(5)).toBe(2); // floor(5*0.5)
  });
  it("uses the <20min rate", () => {
    expect(calcExp(15)).toBe(15); // floor(15*1.0)
  });
  it("uses the >=20min rate", () => {
    expect(calcExp(25)).toBe(37); // floor(25*1.5)
  });
});

describe("calcGold", () => {
  it("stays within the documented 25min range (100-300G)", () => {
    for (let i = 0; i < 200; i++) {
      const g = calcGold(25);
      expect(g).toBeGreaterThanOrEqual(100);
      expect(g).toBeLessThan(300);
    }
  });
});

describe("calcFloorProgress", () => {
  it("accumulates without crossing 100", () => {
    expect(calcFloorProgress(50, 20)).toEqual({ newFloor: false, mapping: 70 });
  });
  it("wraps and flags a new floor at exactly 100", () => {
    expect(calcFloorProgress(80, 20)).toEqual({ newFloor: true, mapping: 0 });
  });
  it("carries the overflow into the next floor's mapping", () => {
    expect(calcFloorProgress(90, 25)).toEqual({ newFloor: true, mapping: 15 });
  });
});

describe("level curve", () => {
  it("expForLevel matches the growth formula", () => {
    expect(expForLevel(1)).toBe(7);
    expect(expForLevel(10)).toBe(Math.floor(7 * Math.pow(10, 1.3)));
  });

  it("expUsedUpTo(1) is 0 (no exp consumed before level 1)", () => {
    expect(expUsedUpTo(1)).toBe(0);
  });

  it("expToLevel is monotonically non-decreasing with more exp", () => {
    let prevLv = 1;
    for (let exp = 0; exp <= 5000; exp += 137) {
      const lv = expToLevel(exp);
      expect(lv).toBeGreaterThanOrEqual(prevLv);
      prevLv = lv;
    }
  });

  it("expUsedUpTo(expToLevel(x)) never exceeds x (level reflects exp actually spent)", () => {
    for (const exp of [0, 1, 50, 500, 4100, 10000]) {
      const lv = expToLevel(exp);
      expect(expUsedUpTo(lv)).toBeLessThanOrEqual(exp);
    }
  });

  it("roughly hits Lv23 around 4100 total exp (design target: 2 sets/day for 30 days)", () => {
    const lv = expToLevel(4100);
    expect(lv).toBeGreaterThanOrEqual(20);
    expect(lv).toBeLessThanOrEqual(26);
  });
});
