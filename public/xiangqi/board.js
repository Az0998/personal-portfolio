/**
 * Compact Xiangqi rules engine (mirrors game/fast_board.py).
 * grid: Int8 10x9, +red -black; side: 1 red / -1 black
 */
(function (global) {
  const ROWS = 10, COLS = 9, N = 90, N_ACTIONS = 8100;
  const EMPTY = 0, KING = 1, ADVISOR = 2, ELEPHANT = 3, HORSE = 4, ROOK = 5, CANNON = 6, PAWN = 7;

  function posToSq(r, c) { return r * COLS + c; }
  function sqToPos(sq) { return [Math.floor(sq / COLS), sq % COLS]; }
  function encodeAction(fr, fc, tr, tc) { return posToSq(fr, fc) * N + posToSq(tr, tc); }
  function decodeAction(a) {
    const frm = Math.floor(a / N), to = a % N;
    return [sqToPos(frm), sqToPos(to)];
  }

  class FastBoard {
    constructor() {
      this.grid = new Int8Array(ROWS * COLS);
      this.side = 1;
      this.ply = 0;
      this.reset();
    }

    idx(r, c) { return r * COLS + c; }
    at(r, c) { return this.grid[this.idx(r, c)]; }
    set(r, c, v) { this.grid[this.idx(r, c)] = v; }

    reset() {
      this.grid.fill(0);
      const back = [ROOK, HORSE, ELEPHANT, ADVISOR, KING, ADVISOR, ELEPHANT, HORSE, ROOK];
      for (let c = 0; c < 9; c++) {
        this.set(0, c, back[c]);
        this.set(9, c, -back[c]);
      }
      this.set(2, 1, CANNON); this.set(2, 7, CANNON);
      this.set(7, 1, -CANNON); this.set(7, 7, -CANNON);
      for (const c of [0, 2, 4, 6, 8]) {
        this.set(3, c, PAWN);
        this.set(6, c, -PAWN);
      }
      this.side = 1;
      this.ply = 0;
    }

    copy() {
      const b = new FastBoard();
      b.grid.set(this.grid);
      b.side = this.side;
      b.ply = this.ply;
      return b;
    }

    pathCount(fr, fc, tr, tc) {
      if (fr === tr) {
        let n = 0, a = Math.min(fc, tc), z = Math.max(fc, tc);
        for (let c = a + 1; c < z; c++) if (this.at(fr, c)) n++;
        return n;
      }
      if (fc === tc) {
        let n = 0, a = Math.min(fr, tr), z = Math.max(fr, tr);
        for (let r = a + 1; r < z; r++) if (this.at(r, fc)) n++;
        return n;
      }
      return -1;
    }

    findKing(side) {
      const code = KING * side;
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (this.at(r, c) === code) return [r, c];
      return null;
    }

    kingsFace() {
      const rk = this.findKing(1), bk = this.findKing(-1);
      if (!rk || !bk || rk[1] !== bk[1]) return false;
      return this.pathCount(rk[0], rk[1], bk[0], bk[1]) === 0;
    }

    pseudoLegal(fr, fc, tr, tc) {
      if (tr < 0 || tr >= ROWS || tc < 0 || tc >= COLS) return false;
      const p = this.at(fr, fc);
      if (!p || Math.sign(p) !== this.side) return false;
      const target = this.at(tr, tc);
      if (target && Math.sign(target) === Math.sign(p)) return false;
      const code = Math.abs(p);
      const side = Math.sign(p);
      const dr = tr - fr, dc = tc - fc;
      const adr = Math.abs(dr), adc = Math.abs(dc);

      if (code === KING) {
        const pr = side > 0 ? [0, 2] : [7, 9];
        if (tr < pr[0] || tr > pr[1] || tc < 3 || tc > 5) return false;
        return (adr === 1 && adc === 0) || (adr === 0 && adc === 1);
      }
      if (code === ADVISOR) {
        const pr = side > 0 ? [0, 2] : [7, 9];
        if (tr < pr[0] || tr > pr[1] || tc < 3 || tc > 5) return false;
        return adr === 1 && adc === 1;
      }
      if (code === ELEPHANT) {
        if (side > 0 && tr > 4) return false;
        if (side < 0 && tr < 5) return false;
        if (adr !== 2 || adc !== 2) return false;
        return this.at((fr + tr) >> 1, (fc + tc) >> 1) === 0;
      }
      if (code === HORSE) {
        if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;
        if (adr === 2) return this.at(fr + (dr >> 1), fc) === 0;
        return this.at(fr, fc + (dc >> 1)) === 0;
      }
      if (code === ROOK) {
        if (fr !== tr && fc !== tc) return false;
        return this.pathCount(fr, fc, tr, tc) === 0;
      }
      if (code === CANNON) {
        if (fr !== tr && fc !== tc) return false;
        const n = this.pathCount(fr, fc, tr, tc);
        return target ? n === 1 : n === 0;
      }
      if (code === PAWN) {
        if (adr + adc !== 1) return false;
        const forward = side > 0 ? 1 : -1;
        const crossed = side > 0 ? fr >= 5 : fr <= 4;
        if (dr === forward && dc === 0) return true;
        if (crossed && dr === 0 && adc === 1) return true;
        return false;
      }
      return false;
    }

    pushRaw(fr, fc, tr, tc) {
      const captured = this.at(tr, tc);
      const mover = this.at(fr, fc);
      this._undo = this._undo || [];
      this._undo.push([fr, fc, tr, tc, captured, this.side, this.ply]);
      this.set(tr, tc, mover);
      this.set(fr, fc, 0);
      this.side = -this.side;
      this.ply++;
    }

    undo() {
      const [fr, fc, tr, tc, captured, side, ply] = this._undo.pop();
      const mover = this.at(tr, tc);
      this.set(fr, fc, mover);
      this.set(tr, tc, captured);
      this.side = side;
      this.ply = ply;
    }

    inCheck(side) {
      side = side === undefined ? this.side : side;
      const king = this.findKing(side);
      if (!king) return true;
      const [kr, kc] = king;
      const opp = -side;
      const saved = this.side;
      this.side = opp;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const p = this.at(r, c);
          if (p && Math.sign(p) === opp && this.pseudoLegal(r, c, kr, kc)) {
            this.side = saved;
            return true;
          }
        }
      }
      this.side = saved;
      return this.kingsFace();
    }

    isLegal(fr, fc, tr, tc) {
      if (!this.pseudoLegal(fr, fc, tr, tc)) return false;
      this.pushRaw(fr, fc, tr, tc);
      const prev = -this.side;
      const bad = this.inCheck(prev) || this.kingsFace();
      this.undo();
      return !bad;
    }

    genTargets(r, c, code, side) {
      const out = [];
      const add = (tr, tc) => out.push([tr, tc]);
      if (code === KING) {
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc]) => add(r+dr,c+dc));
      } else if (code === ADVISOR) {
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc]) => add(r+dr,c+dc));
      } else if (code === ELEPHANT) {
        [[2,2],[2,-2],[-2,2],[-2,-2]].forEach(([dr,dc]) => add(r+dr,c+dc));
      } else if (code === HORSE) {
        [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(([dr,dc]) => add(r+dr,c+dc));
      } else if (code === ROOK || code === CANNON) {
        for (let rr = 0; rr < ROWS; rr++) if (rr !== r) add(rr, c);
        for (let cc = 0; cc < COLS; cc++) if (cc !== c) add(r, cc);
      } else if (code === PAWN) {
        const forward = side > 0 ? 1 : -1;
        add(r + forward, c);
        const crossed = side > 0 ? r >= 5 : r <= 4;
        if (crossed) { add(r, c + 1); add(r, c - 1); }
      }
      return out;
    }

    legalMoves() {
      const moves = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const p = this.at(r, c);
          if (!p || Math.sign(p) !== this.side) continue;
          const code = Math.abs(p);
          for (const [tr, tc] of this.genTargets(r, c, code, this.side)) {
            if (this.isLegal(r, c, tr, tc)) moves.push(encodeAction(r, c, tr, tc));
          }
        }
      }
      return moves;
    }

    push(action) {
      const [[fr, fc], [tr, tc]] = decodeAction(action);
      if (!this.isLegal(fr, fc, tr, tc)) throw new Error("illegal");
      this.pushRaw(fr, fc, tr, tc);
    }

    terminal() {
      if (!this.findKing(1)) return -1;
      if (!this.findKing(-1)) return 1;
      const moves = this.legalMoves();
      if (!moves.length) {
        if (this.inCheck(this.side)) return this.side === 1 ? -1 : 1;
        return 0;
      }
      if (this.ply >= 200) return 0;
      return null;
    }

    /** Float32Array length 15*10*9 for ONNX */
    encode() {
      const planes = new Float32Array(15 * ROWS * COLS);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const p = this.at(r, c);
          if (!p) continue;
          const code = Math.abs(p);
          const ch = (code - 1) + (p > 0 ? 0 : 7);
          planes[ch * N + this.idx(r, c)] = 1;
        }
      }
      const sideFill = this.side > 0 ? 1 : 0;
      for (let i = 0; i < N; i++) planes[14 * N + i] = sideFill;
      return planes;
    }
  }

  const NAMES = {
    1: "帅", 2: "仕", 3: "相", 4: "马", 5: "车", 6: "炮", 7: "兵",
    "-1": "将", "-2": "士", "-3": "象", "-4": "马", "-5": "车", "-6": "炮", "-7": "卒",
  };

  global.Xiangqi = {
    FastBoard, encodeAction, decodeAction, NAMES, ROWS, COLS, N_ACTIONS, N,
  };
})(typeof window !== "undefined" ? window : globalThis);
