import { describe, it, expect, vi, afterEach } from "vitest";
import { generateMonster, generateBoss, pickMonsters, MONSTER_BASE, BOSS_DATA, getBossData } from "./monsters";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateMonster balance scale", () => {
  it("applies the HP/ATK/reward scale for a common(none-rarity) monster at floor 1", () => {
    // Math.random()=0 forces rollRarity -> "none" (mul 1.0) and rollTitles -> [none]
    vi.spyOn(Math, "random").mockReturnValue(0);
    const slime = MONSTER_BASE.find(m => m.id === "slime");
    const mon = generateMonster(slime, 1, 0);

    // fm = 1 at floor 1, rarity.mul = 1.0 -> only the tuned scale constants apply
    expect(mon.hp).toBe(Math.floor(slime.hp * 1.4));    // MONSTER_HP_SCALE
    expect(mon.atk).toBe(Math.floor(slime.atk * 1.15)); // MONSTER_ATK_SCALE
    expect(mon.expGain).toBe(Math.floor(10 * slime.expMul * 1.25));
    expect(mon.goldGain).toBe(Math.floor(20 * slime.gMul * 1.25));
  });

  it("scales stats up with dungeon depth (fm)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const slime = MONSTER_BASE.find(m => m.id === "slime");
    const shallow = generateMonster(slime, 1, 0);
    const deep = generateMonster(slime, 30, 0);
    expect(deep.hp).toBeGreaterThan(shallow.hp);
    expect(deep.atk).toBeGreaterThan(shallow.atk);
  });
});

describe("generateBoss balance scale", () => {
  it("applies the boss HP/ATK/reward scale on top of hpMul/atkMul", () => {
    const bossData = getBossData(1, 5); // 大スライム
    const base = MONSTER_BASE.find(m => m.id === bossData.baseId);
    const boss = generateBoss(bossData);

    expect(boss.hp).toBe(Math.floor(base.hp * bossData.hpMul * 1.4));    // BOSS_HP_SCALE
    expect(boss.atk).toBe(Math.floor(base.atk * bossData.atkMul * 1.15)); // BOSS_ATK_SCALE
    expect(boss.expGain).toBe(Math.floor(10 * base.expMul * bossData.hpMul * 1.25));
  });

  it("resolves every BOSS_DATA entry to a valid, positive-HP boss", () => {
    BOSS_DATA.forEach(bd => {
      const boss = generateBoss(bd);
      expect(boss).not.toBeNull();
      expect(boss.hp).toBeGreaterThan(0);
      expect(boss.atk).toBeGreaterThan(0);
    });
  });

  it("returns null for an unknown baseId", () => {
    expect(generateBoss({ baseId: "no_such_monster", hpMul: 1, atkMul: 1, defMul: 1 })).toBeNull();
  });
});

describe("star rank probability curve (difficulty ramps with dungeon depth)", () => {
  it("mostly produces low-star monsters near the dungeon entrance (floor 1)", () => {
    const N = 2000;
    let starSum = 0;
    for (let i = 0; i < N; i++) starSum += pickMonsters(1, 1, 0)[0].star;
    // EARLY_STAR_PROBS weighted average is 1.31; generous margin against sampling noise
    expect(starSum / N).toBeLessThan(1.6);
  });

  it("produces meaningfully higher-star monsters at the dungeon's deepest floor (floor 30)", () => {
    const N = 2000;
    let starSum = 0;
    for (let i = 0; i < N; i++) starSum += pickMonsters(30, 1, 0)[0].star;
    // LATE_STAR_PROBS weighted average is 2.10; generous margin against sampling noise
    expect(starSum / N).toBeGreaterThan(1.8);
  });
});
