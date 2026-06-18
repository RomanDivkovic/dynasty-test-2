export interface RandomSource {
  next(): number;
}

export class SeededRandom implements RandomSource {
  private seed: number;

  constructor(seed = Date.now()) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) {
      this.seed += 2147483646;
    }
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

export function chance(rng: RandomSource, probability: number) {
  return rng.next() < probability;
}

export function pickWeighted<T>(rng: RandomSource, items: Array<{ item: T; weight: number }>) {
  const total = items.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  let roll = rng.next() * total;

  for (const entry of items) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry.item;
  }

  return items[items.length - 1].item;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
