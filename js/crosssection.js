const SVG_NS = 'http://www.w3.org/2000/svg';

// ── ViewBox / 레이아웃 상수 ───────────────────────────────
const VB_W = 420;
const VB_H = 260;
const LX   = 72;                   // 그림 왼쪽 경계 (H/B 라벨 공간)
const RX   = 372;                  // 그림 오른쪽 경계
const BY   = 240;                  // GND 하단 y
const CX   = (LX + RX) / 2;       // 222, 수평 중심
const GND_H      = 20;             // GND 플레인 시각적 높이 (고정 px)
const DIEL_H_MAX = 130;            // 유전체 최대 시각적 높이 (px)
const MAX_W_PX   = (RX - LX) * 0.70; // 트레이스 최대 너비 (≈210 px)

// ── SVG 요소 생성 헬퍼 ────────────────────────────────────

function e(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

// ── 색상 팔레트 (다크모드 자동 감지) ────────────────────

function palette() {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    gnd:          dark ? '#45475a' : '#868e96',
    gndHatch:     dark ? '#585b70' : '#adb5bd',
    gndBorder:    dark ? '#6c7086' : '#495057',
    gndText:      dark ? '#6c7086' : '#adb5bd',
    diel:         dark ? 'rgba(166,227,161,0.18)' : 'rgba(40,167,69,0.11)',
    dielBorder:   dark ? '#a6e3a1' : '#2f9e44',
    copper:       dark ? '#fab387' : '#cd7f32',
    copperBorder: dark ? '#fe640b' : '#9a5423',
    dim:          dark ? '#89b4fa' : '#1a73e8',
    subText:      dark ? '#585b70' : '#ced4da',
  };
}

// ── SVG 초기화 ────────────────────────────────────────────

function initSVG(svg) {
  svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

// ── Defs: 화살표 마커 + GND 해칭 패턴 ────────────────────

function addDefs(svg, c) {
  const defs = e('defs');

  // GND 대각선 해칭
  const pat = e('pattern', {
    id: 'gnd-hatch', patternUnits: 'userSpaceOnUse', width: 8, height: 8,
  });
  pat.appendChild(e('line', {
    x1: 0, y1: 8, x2: 8, y2: 0, stroke: c.gndHatch, 'stroke-width': 1.5,
  }));
  defs.appendChild(pat);

  // → 전방 화살촉 (marker-end용)
  const mFwd = e('marker', {
    id: 'dim-fwd', markerWidth: 8, markerHeight: 6,
    refX: 7, refY: 3, orient: 'auto',
  });
  mFwd.appendChild(e('path', { d: 'M0,0 L8,3 L0,6 Z', fill: c.dim }));
  defs.appendChild(mFwd);

  // ← 후방 화살촉 (marker-start용)
  const mBwd = e('marker', {
    id: 'dim-bwd', markerWidth: 8, markerHeight: 6,
    refX: 1, refY: 3, orient: 'auto',
  });
  mBwd.appendChild(e('path', { d: 'M8,0 L0,3 L8,6 Z', fill: c.dim }));
  defs.appendChild(mBwd);

  svg.appendChild(defs);
}

// ── 레이어 드로잉 ─────────────────────────────────────────

function drawGND(svg, x, y, w, h, c) {
  svg.appendChild(e('rect', { x, y, width: w, height: h, fill: c.gnd }));
  svg.appendChild(e('rect', {
    x, y, width: w, height: h,
    fill: 'url(#gnd-hatch)', opacity: 0.5,
  }));
  svg.appendChild(e('rect', {
    x, y, width: w, height: h,
    fill: 'none', stroke: c.gndBorder, 'stroke-width': 1,
  }));
  const t = e('text', {
    x: x + w / 2, y: y + h / 2,
    'text-anchor': 'middle', 'dominant-baseline': 'central',
    'font-size': 10, 'font-family': 'sans-serif', fill: c.gndText,
    'font-weight': 600, 'letter-spacing': 1,
  });
  t.textContent = 'GND';
  svg.appendChild(t);
}

function drawDielectric(svg, x, y, w, h, c) {
  svg.appendChild(e('rect', { x, y, width: w, height: h, fill: c.diel }));
  svg.appendChild(e('rect', {
    x, y, width: w, height: h,
    fill: 'none', stroke: c.dielBorder,
    'stroke-width': 1, 'stroke-dasharray': '5 3',
  }));
}

function drawCopper(svg, x, y, w, h, c) {
  svg.appendChild(e('rect', { x, y, width: w, height: h, fill: c.copper }));
  svg.appendChild(e('rect', {
    x, y, width: w, height: h,
    fill: 'none', stroke: c.copperBorder, 'stroke-width': 1,
  }));
}

function drawSubLabel(svg, x, y, c) {
  const t = e('text', {
    x, y,
    'text-anchor': 'middle', 'dominant-baseline': 'central',
    'font-size': 11, 'font-family': 'sans-serif',
    'font-style': 'italic', fill: c.subText,
  });
  t.textContent = 'Substrate';
  svg.appendChild(t);
}

// ── 치수선 ────────────────────────────────────────────────

// 수평 치수선: x1↔x2, 높이 y, 라벨 위쪽
function dimH(svg, x1, x2, y, label, c) {
  const T = 6; // 단부 틱 크기
  svg.appendChild(e('line', { x1, y1: y - T, x2: x1, y2: y + T, stroke: c.dim, 'stroke-width': 1 }));
  svg.appendChild(e('line', { x1: x2, y1: y - T, x2, y2: y + T, stroke: c.dim, 'stroke-width': 1 }));
  svg.appendChild(e('line', {
    x1, y1: y, x2, y2: y,
    stroke: c.dim, 'stroke-width': 1.3,
    'marker-start': 'url(#dim-bwd)', 'marker-end': 'url(#dim-fwd)',
  }));
  const t = e('text', {
    x: (x1 + x2) / 2, y: y - 9,
    'text-anchor': 'middle', 'dominant-baseline': 'auto',
    'font-size': 13, 'font-weight': 700, fill: c.dim,
    'font-family': "'Courier New', Consolas, monospace",
  });
  t.textContent = label;
  svg.appendChild(t);
}

// 수직 치수선: y1↔y2, x 위치, 라벨은 side('left'|'right')에 배치
function dimV(svg, x, y1, y2, label, c, side = 'left') {
  const T = 6;
  svg.appendChild(e('line', { x1: x - T, y1, x2: x + T, y2: y1, stroke: c.dim, 'stroke-width': 1 }));
  svg.appendChild(e('line', { x1: x - T, y1: y2, x2: x + T, y2, stroke: c.dim, 'stroke-width': 1 }));
  svg.appendChild(e('line', {
    x1: x, y1, x2: x, y2,
    stroke: c.dim, 'stroke-width': 1.3,
    'marker-start': 'url(#dim-bwd)', 'marker-end': 'url(#dim-fwd)',
  }));
  const midY = (y1 + y2) / 2;
  const lx     = side === 'left' ? x - 9 : x + 9;
  const anchor = side === 'left' ? 'end'  : 'start';
  const t = e('text', {
    x: lx, y: midY,
    'text-anchor': anchor, 'dominant-baseline': 'central',
    'font-size': 13, 'font-weight': 700, fill: c.dim,
    'font-family': "'Courier New', Consolas, monospace",
  });
  t.textContent = label;
  svg.appendChild(t);
}

// T가 너무 얇아 치수선을 그리기 어려울 때 사용하는 리더 라벨
function thinLeader(svg, fromX, atY, toX, label, c) {
  svg.appendChild(e('line', {
    x1: fromX, y1: atY, x2: toX - 2, y2: atY,
    stroke: c.dim, 'stroke-width': 1,
    'marker-end': 'url(#dim-fwd)',
  }));
  const t = e('text', {
    x: toX + 4, y: atY,
    'text-anchor': 'start', 'dominant-baseline': 'central',
    'font-size': 13, 'font-weight': 700, fill: c.dim,
    'font-family': "'Courier New', Consolas, monospace",
  });
  t.textContent = label;
  svg.appendChild(t);
}

// ── 스케일 계산 ───────────────────────────────────────────
//
// mainDim(H 또는 B) → DIEL_H_MAX px 기준.
// traceDim(W)이 MAX_W_PX를 넘으면 전체를 축소.
// T가 매우 클 경우도 고려해 추가 축소.

function calcScale(mainDim, traceDim, thickness) {
  let sc = DIEL_H_MAX / mainDim;
  if (traceDim * sc > MAX_W_PX)           sc = MAX_W_PX / traceDim;
  // T가 유전체 높이의 55% 이상 되지 않도록
  if (thickness * sc > mainDim * sc * 0.55) sc = (mainDim * 0.55) / thickness * sc;
  // 재확인: W 여전히 OK?
  if (traceDim * sc > MAX_W_PX)           sc = MAX_W_PX / traceDim;
  return sc;
}

// ── 공개 API ──────────────────────────────────────────────

/**
 * Microstrip 단면도를 SVG 요소에 그린다.
 * @param {SVGSVGElement} svgElement
 * @param {{ W: number, H: number, T: number }} params  (단위: mil)
 */
export function drawMicrostrip(svgElement, { W, H, T }) {
  initSVG(svgElement);
  const c  = palette();
  addDefs(svgElement, c);

  const sc   = calcScale(H, W, T);
  const H_px = H * sc;
  const T_px = Math.max(T * sc, 8);
  const W_px = Math.max(W * sc, 30);

  const yGndBot  = BY;
  const yGndTop  = yGndBot - GND_H;       // 하단 GND 상단 = 유전체 하단
  const yDielTop = yGndTop - H_px;        // 유전체 상단  = 트레이스 하단
  const yTracBot = yDielTop;
  const yTracTop = yTracBot - T_px;
  const tx1 = CX - W_px / 2;
  const tx2 = CX + W_px / 2;

  // 레이어 (아래 → 위 순)
  drawGND(svgElement, LX, yGndTop, RX - LX, GND_H, c);
  drawDielectric(svgElement, LX, yDielTop, RX - LX, H_px, c);
  drawCopper(svgElement, tx1, yTracTop, W_px, T_px, c);

  // 유전체 라벨
  if (H_px > 26) drawSubLabel(svgElement, CX, yDielTop + H_px / 2, c);

  // ── 치수선 ──

  // W: 트레이스 위 수평선
  const yW = Math.max(yTracTop - 14, 12);
  dimH(svgElement, tx1, tx2, yW, 'W', c);

  // H: 왼쪽 수직선 (유전체 구간)
  dimV(svgElement, LX - 22, yDielTop, yGndTop, 'H', c, 'left');

  // T: 트레이스 오른쪽 수직선
  const xT = Math.min(tx2 + 22, RX - 6);
  if (T_px >= 14) {
    dimV(svgElement, xT, yTracTop, yTracBot, 'T', c, 'right');
  } else {
    thinLeader(svgElement, tx2 + 3, (yTracTop + yTracBot) / 2, xT, 'T', c);
  }
}

/**
 * Symmetric Stripline 단면도를 SVG 요소에 그린다.
 * @param {SVGSVGElement} svgElement
 * @param {{ W: number, B: number, T: number }} params  (단위: mil)
 */
export function drawStripline(svgElement, { W, B, T }) {
  initSVG(svgElement);
  const c  = palette();
  addDefs(svgElement, c);

  const sc   = calcScale(B, W, T);
  const B_px = B * sc;
  const T_px = Math.max(T * sc, 8);
  const W_px = Math.max(W * sc, 30);

  const yBotGndBot = BY;
  const yBotGndTop = yBotGndBot - GND_H;
  const yTopGndBot = yBotGndTop - B_px;
  const yTopGndTop = yTopGndBot - GND_H;
  const yMid       = (yBotGndTop + yTopGndBot) / 2;  // 트레이스 중심
  const yTracTop   = yMid - T_px / 2;
  const yTracBot   = yMid + T_px / 2;
  const tx1 = CX - W_px / 2;
  const tx2 = CX + W_px / 2;

  // 레이어
  drawGND(svgElement, LX, yTopGndTop, RX - LX, GND_H, c);
  drawDielectric(svgElement, LX, yTopGndBot, RX - LX, B_px, c);
  drawCopper(svgElement, tx1, yTracTop, W_px, T_px, c);
  drawGND(svgElement, LX, yBotGndTop, RX - LX, GND_H, c);

  // 유전체 라벨 (트레이스와 겹치지 않는 위치)
  if (B_px > 40) {
    const lblY = yTopGndBot + (yTracTop - yTopGndBot) / 2;
    if (yTracTop - yTopGndBot > 16) drawSubLabel(svgElement, CX, lblY, c);
  }

  // ── 치수선 ──

  // W: 트레이스 위 수평선 (상단 GND와 겹치지 않도록 클램프)
  const yW = Math.max(yTracTop - 14, yTopGndBot + 10);
  dimH(svgElement, tx1, tx2, yW, 'W', c);

  // B: 왼쪽 수직선 (두 GND 사이 유전체 전체)
  dimV(svgElement, LX - 22, yTopGndBot, yBotGndTop, 'B', c, 'left');

  // T: 트레이스 오른쪽
  const xT = Math.min(tx2 + 22, RX - 6);
  if (T_px >= 14) {
    dimV(svgElement, xT, yTracTop, yTracBot, 'T', c, 'right');
  } else {
    thinLeader(svgElement, tx2 + 3, yMid, xT, 'T', c);
  }
}
