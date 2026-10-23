<script setup lang="ts">
defineProps<{ p?: number; et?: number; d?: number; ds?: number }>()
</script>

<template>
  <figure class="overflow-hidden rounded-lg border border-line bg-white">
    <figcaption class="border-b border-line bg-panel px-4 py-3">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-base text-navy">蒸渗仪水平衡（教材剖面）</h3>
        <span class="rounded bg-hydro/10 px-2 py-0.5 text-xs text-hydro">机理示意</span>
      </div>
      <p class="mt-2 text-sm leading-6 text-slate-600">
        把土柱看成一个控制体。进入的只有降雨 P（和必要时的底部补水 I），离开的是蒸散 ET 与渗漏 D，柱内变化是 ΔS。
        泵只在土柱和补水桶之间倒水，净通量对系统为 0，所以不能记成雨或 ET。闭合式：P − ET = ΔS + (D − I)。
      </p>
    </figcaption>
    <div class="grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr]">
      <svg viewBox="0 0 720 460" class="h-auto w-full" role="img" aria-label="微型蒸渗仪剖面与水平衡">
        <rect x="0" y="0" width="720" height="460" fill="#f6f9fc" />
        <!-- sky / rain -->
        <path d="M250 18 q12 18 0 36 M280 10 q12 18 0 36 M310 18 q12 18 0 36 M340 10 q12 18 0 36" stroke="#1565a8" stroke-width="3" fill="none" />
        <text x="360" y="28" font-size="14" fill="#1565a8" font-weight="600">① P 降雨 {{ p == null ? '' : p.toFixed(1) + ' mm' }}</text>
        <!-- vegetation ET -->
        <path d="M200 70 C190 40 170 40 165 70" stroke="#2e7d32" stroke-width="2" fill="none" />
        <path d="M188 48 L175 28" stroke="#d55e00" stroke-width="2.4" marker-end="url(#et)" />
        <path d="M210 70 C220 38 245 38 248 70" stroke="#2e7d32" stroke-width="2" fill="none" />
        <text x="40" y="40" font-size="14" fill="#d55e00" font-weight="600">② ET 蒸散 {{ et == null ? '' : et.toFixed(1) + ' mm' }}</text>
        <!-- cylinder -->
        <rect x="160" y="78" width="240" height="300" rx="8" fill="#efe6d6" stroke="#0b3d5c" stroke-width="2" />
        <rect x="160" y="78" width="240" height="88" fill="#c4a574" opacity="0.85" />
        <text x="280" y="118" text-anchor="middle" font-size="13">15 cm 浅层（先响应降雨）</text>
        <rect x="160" y="166" width="240" height="88" fill="#b08968" opacity="0.9" />
        <text x="280" y="206" text-anchor="middle" font-size="13">35 cm 中层</text>
        <rect x="160" y="254" width="240" height="88" fill="#9c6644" opacity="0.9" />
        <text x="280" y="294" text-anchor="middle" font-size="13">55 cm 深层（滞后）</text>
        <text x="280" y="360" text-anchor="middle" font-size="14" fill="#0b3d5c" font-weight="600">③ 土柱 ΔS {{ ds == null ? '' : ds.toFixed(1) + ' mm' }}</text>
        <!-- load cell -->
        <rect x="210" y="382" width="140" height="22" rx="3" fill="#0b3d5c" />
        <text x="280" y="398" text-anchor="middle" font-size="11" fill="#fff">称重传感器 LYW</text>
        <!-- bottle -->
        <rect x="500" y="250" width="150" height="120" rx="8" fill="#e8f1fa" stroke="#1565a8" stroke-width="2" />
        <text x="575" y="292" text-anchor="middle" font-size="13">补水桶 SWW</text>
        <text x="575" y="314" text-anchor="middle" font-size="12" fill="#1565a8">④ 渗漏 D {{ d == null ? '' : d.toFixed(2) + ' mm' }}</text>
        <text x="575" y="336" text-anchor="middle" font-size="12">⑤ 补水 I</text>
        <path d="M400 300 L500 300" stroke="#009e73" stroke-width="3" marker-end="url(#d)" />
        <path d="M500 330 L400 330" stroke="#cc79a7" stroke-width="3" marker-end="url(#i)" />
        <text x="420" y="288" font-size="12" fill="#009e73">D / Pump_out</text>
        <text x="418" y="348" font-size="12" fill="#cc79a7">I / Pump_in</text>
        <text x="24" y="444" font-size="13" fill="#334e68">⑥ 系统重量 = LYW + SWW。泵在两者间移动质量，系统重量不变。</text>
        <defs>
          <marker id="et" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#d55e00" /></marker>
          <marker id="d" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#009e73" /></marker>
          <marker id="i" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#cc79a7" /></marker>
        </defs>
      </svg>
      <ol class="space-y-3 text-sm leading-6 text-slate-700">
        <li><b class="text-navy">① 降雨 P</b> 落到土柱表面，称重增加。只用过门限（5 g ≈ 0.071 mm）的增重，泵脉冲不算。</li>
        <li><b class="text-navy">② 蒸散 ET</b> 从土面/植株离开。正式日 ET 用相邻午夜系统重量，无雨日才示范。</li>
        <li><b class="text-navy">③ ΔS</b> 用蒸渗桶质量变化。三层 θ 积分只作剖面对照。</li>
        <li><b class="text-navy">④ 渗漏 D</b> 重力水进入补水桶（Pump_out）。</li>
        <li><b class="text-navy">⑤ 补水 I</b> 从桶打回土柱底部（Pump_in），不是雨。</li>
        <li><b class="text-navy">⑥ 闭合</b> P − ET 应等于 ΔS + (D − I)。差大时先查台阶和泵，不改面积。</li>
      </ol>
    </div>
  </figure>
</template>
