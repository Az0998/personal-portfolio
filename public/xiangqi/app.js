/* global ort, Xiangqi */
(function () {
  const { FastBoard, decodeAction, NAMES, ROWS, COLS, N_ACTIONS, N } = Xiangqi;

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const btnNew = document.getElementById("btn-new");
  const btnHint = document.getElementById("btn-hint");

  const MARGIN = 36;
  let cell = 0;
  let board = new FastBoard();
  let selected = null;
  let legalTo = [];
  let session = null;
  let thinking = false;
  let humanSide = 1; // red

  function resize() {
    const size = Math.min(window.innerWidth - 24, 560);
    canvas.width = size;
    canvas.height = size * (ROWS / (COLS - 0) ) * 0.95 + MARGIN;
    // board is 9 files x 10 ranks — use square cells
    cell = (size - MARGIN * 2) / (COLS - 1);
    canvas.height = cell * (ROWS - 1) + MARGIN * 2;
    draw();
  }

  function xyToRC(x, y) {
    const c = Math.round((x - MARGIN) / cell);
    const r = Math.round((y - MARGIN) / cell);
    // Display: red at bottom → flip row for screen
    const br = ROWS - 1 - r;
    if (br < 0 || br >= ROWS || c < 0 || c >= COLS) return null;
    return [br, c];
  }

  function rcToXY(r, c) {
    const sr = ROWS - 1 - r;
    return [MARGIN + c * cell, MARGIN + sr * cell];
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = "#e8c98a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#3a2a1a";
    ctx.lineWidth = 1.5;
    for (let r = 0; r < ROWS; r++) {
      const [, y] = rcToXY(r, 0);
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(MARGIN + (COLS - 1) * cell, y);
      ctx.stroke();
    }
    for (let c = 0; c < COLS; c++) {
      const [x0, y0] = rcToXY(0, c);
      const [x1, y1] = rcToXY(ROWS - 1, c);
      // river gap for side files? classic: verticals break at river for edges only — simplify continuous
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    // river text
    ctx.fillStyle = "#8b5a2b";
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    const midY = (rcToXY(4, 0)[1] + rcToXY(5, 0)[1]) / 2;
    ctx.fillText("楚 河          汉 界", w / 2, midY + 5);

    // palace diagonals
    drawPalace(0, 3); drawPalace(7, 3);

    if (selected) {
      const [x, y] = rcToXY(selected[0], selected[1]);
      ctx.strokeStyle = "#1a7f37";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, cell * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const [tr, tc] of legalTo) {
      const [x, y] = rcToXY(tr, tc);
      ctx.fillStyle = "rgba(26,127,55,0.35)";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = board.at(r, c);
        if (!p) continue;
        const [x, y] = rcToXY(r, c);
        const red = p > 0;
        ctx.beginPath();
        ctx.fillStyle = red ? "#f5f0e6" : "#1c1c1c";
        ctx.strokeStyle = red ? "#b33" : "#222";
        ctx.lineWidth = 2;
        ctx.arc(x, y, cell * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = red ? "#b01010" : "#f0f0f0";
        ctx.font = `bold ${Math.floor(cell * 0.42)}px "Songti SC","SimSun",serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(NAMES[String(p)] || "?", x, y + 1);
      }
    }
  }

  function drawPalace(r0, c0) {
    const a = rcToXY(r0, c0);
    const b = rcToXY(r0 + 2, c0 + 2);
    const c = rcToXY(r0, c0 + 2);
    const d = rcToXY(r0 + 2, c0);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
    ctx.stroke();
  }

  function setStatus(t) { statusEl.textContent = t; }

  function syncLegal() {
    legalTo = [];
    if (!selected) return;
    const [sr, sc] = selected;
    for (const a of board.legalMoves()) {
      const [[fr, fc], [tr, tc]] = decodeAction(a);
      if (fr === sr && fc === sc) legalTo.push([tr, tc]);
    }
  }

  async function loadModel() {
    setStatus("加载 ONNX 模型…");
    try {
      ort.env.wasm.numThreads = 1;
      session = await ort.InferenceSession.create("./xiangqi.onnx", {
        executionProviders: ["wasm"],
      });
      setStatus("模型就绪 — 红方先行（你）");
    } catch (e) {
      console.error(e);
      session = null;
      setStatus("模型未加载，AI 将随机走合法着");
    }
  }

  async function policyMove() {
    const legal = board.legalMoves();
    if (!legal.length) return null;
    if (!session) return legal[Math.floor(Math.random() * legal.length)];

    const data = board.encode();
    const input = new ort.Tensor("float32", data, [1, 15, 10, 9]);
    const out = await session.run({ board: input });
    const logits = out.policy_logits.data;
    let best = legal[0], bestScore = -1e9;
    for (const a of legal) {
      const s = logits[a];
      if (s > bestScore) { bestScore = s; best = a; }
    }
    return best;
  }

  async function aiTurn() {
    if (board.side === humanSide) return;
    thinking = true;
    setStatus("AI 思考中…");
    const a = await policyMove();
    if (a != null) board.push(a);
    thinking = false;
    afterMove();
  }

  function afterMove() {
    selected = null;
    legalTo = [];
    draw();
    const t = board.terminal();
    if (t != null) {
      if (t > 0) setStatus("红方胜");
      else if (t < 0) setStatus("黑方胜");
      else setStatus("和棋");
      return;
    }
    setStatus(board.side === 1 ? "红方行棋" : "黑方（AI）行棋");
    if (board.side !== humanSide) setTimeout(aiTurn, 80);
  }

  canvas.addEventListener("click", (ev) => {
    if (thinking || board.side !== humanSide || board.terminal() != null) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pos = xyToRC((ev.clientX - rect.left) * scaleX, (ev.clientY - rect.top) * scaleY);
    if (!pos) return;
    const [r, c] = pos;
    const p = board.at(r, c);

    if (selected) {
      const [sr, sc] = selected;
      if (legalTo.some(([tr, tc]) => tr === r && tc === c)) {
        board.push(Xiangqi.encodeAction(sr, sc, r, c));
        afterMove();
        return;
      }
    }
    if (p && Math.sign(p) === board.side) {
      selected = [r, c];
      syncLegal();
      draw();
    } else {
      selected = null;
      legalTo = [];
      draw();
    }
  });

  btnNew.addEventListener("click", () => {
    board = new FastBoard();
    selected = null;
    legalTo = [];
    draw();
    setStatus("新局 — 红方先行");
  });

  btnHint.addEventListener("click", async () => {
    if (board.side !== humanSide || thinking) return;
    const a = await policyMove();
    if (a == null) return;
    const [[fr, fc], [tr, tc]] = decodeAction(a);
    selected = [fr, fc];
    legalTo = [[tr, tc]];
    draw();
    setStatus(`提示: (${fr},${fc}) → (${tr},${tc})`);
  });

  window.addEventListener("resize", resize);
  resize();
  loadModel();
})();
