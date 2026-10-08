import type { LifeRun, StatMap } from "./types";
import { NIGHT_POOL, NIGHT_STATS } from "./tales";

export { NIGHT_POOL, NIGHT_STATS };

export function createNightRun(seed = `${Date.now()}`): LifeRun {
  const stats: StatMap = {
    luck: 40 + Math.floor(Math.random() * 30),
    nerve: 40 + Math.floor(Math.random() * 30),
    soft: 45 + Math.floor(Math.random() * 30),
    edge: 35 + Math.floor(Math.random() * 30),
    coin: 35 + Math.floor(Math.random() * 35),
    dawn: 40 + Math.floor(Math.random() * 40),
  };
  return {
    domainId: "night",
    age: 18,
    stats,
    flags: [],
    log: [],
    queue: [],
    ended: false,
    seed,
  };
}
