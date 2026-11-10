/** Teaching frequency curve: moments + Wilson–Hilferty P-III. Not a review fit. */

export type FreqStats = {
  n: number;
  mean: number;
  cv: number;
  cs: number;
  series: number[];
};

export type DesignRow = {
  /** Exceedance probability, e.g. 0.01 = 1% */
  p: number;
  phi: number;
  value: number;
};

const DESIGN_P = [0.01, 0.02, 0.05, 0.1, 0.2];

/** Acklam inverse normal CDF, p in (0, 1). */
export function normsinv(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number;
  let r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  q = p - 0.5;
  r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

/** Off-mean frequency factor Φ for Pearson type III (Wilson–Hilferty). */
export function phiP3(cs: number, exceedance: number): number {
  const z = normsinv(Math.min(1 - 1e-12, Math.max(1e-12, 1 - exceedance)));
  if (!Number.isFinite(cs) || Math.abs(cs) < 0.02) return z;
  const inner = 1 + (cs * z) / 6 - (cs * cs) / 36;
  if (inner <= 0) return z;
  return (2 / cs) * inner ** 3 - 2 / cs;
}

export function parseSeries(text: string): number[] {
  return text
    .split(/[\s,，;；]+/)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function moments(series: number[]): FreqStats | null {
  const n = series.length;
  if (n < 5) return null;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  if (mean <= 0) return null;
  let m2 = 0;
  let m3 = 0;
  for (const x of series) {
    const k = x / mean - 1;
    m2 += k * k;
    m3 += k * k * k;
  }
  const cv = Math.sqrt(m2 / (n - 1));
  const cs = cv < 1e-8 ? 0 : (n * m3) / ((n - 1) * (n - 2) * cv ** 3);
  return { n, mean, cv, cs, series };
}

export function designTable(stats: FreqStats, ps = DESIGN_P): DesignRow[] {
  return ps.map((p) => {
    const phi = phiP3(stats.cs, p);
    return { p, phi, value: stats.mean * (1 + stats.cv * phi) };
  });
}

/** Weibull exceedance plotting position, largest = rank 1. */
export function empiricalPoints(series: number[]): { p: number; value: number }[] {
  const sorted = [...series].sort((a, b) => b - a);
  const n = sorted.length;
  return sorted.map((value, i) => ({ p: (i + 1) / (n + 1), value }));
}

export const SAMPLE_SERIES = `1260
980
1540
870
2100
1320
760
1680
1190
940
1430
1880
1010
1120
790
2050
1360
990
1210
860`;
