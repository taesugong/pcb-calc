import { calcMicrostrip, calcStripline, milToMm, mmToMil } from './formulas.js';

// ── 상태 ──────────────────────────────────────────────────
const state = {
  type: 'microstrip',
  unit: 'mil',
  // 내부값은 항상 mil로 보관
  vals: {
    microstrip: { W: 10,  H: 5,  T: 1.4, er: 4.3 },
    stripline:  { W: 8,   B: 20, T: 1.4, er: 4.3 },
  },
};

// ── 필드 정의 (범위는 mil 기준) ──────────────────────────
const FIELDS = {
  microstrip: [
    { key: 'W',  label: 'W',  desc: '선폭',          min: 1,   max: 50,  step: 0.5, hasDim: true  },
    { key: 'H',  label: 'H',  desc: '유전체 두께',    min: 1,   max: 50,  step: 0.5, hasDim: true  },
    { key: 'T',  label: 'T',  desc: '동박 두께',      min: 0.5, max: 3,   step: 0.1, hasDim: true  },
    { key: 'er', label: 'εr', desc: '비유전율',       min: 2,   max: 10,  step: 0.1, hasDim: false },
  ],
  stripline: [
    { key: 'W',  label: 'W',  desc: '선폭',          min: 1,   max: 50,  step: 0.5, hasDim: true  },
    { key: 'B',  label: 'B',  desc: '유전체 총 두께', min: 2,   max: 100, step: 0.5, hasDim: true  },
    { key: 'T',  label: 'T',  desc: '동박 두께',      min: 0.5, max: 3,   step: 0.1, hasDim: true  },
    { key: 'er', label: 'εr', desc: '비유전율',       min: 2,   max: 10,  step: 0.1, hasDim: false },
  ],
};

// ── 단위 헬퍼 ─────────────────────────────────────────────

// mil 내부값 → 표시값
function toDisp(milValue, hasDim) {
  return hasDim && state.unit === 'mm' ? milToMm(milValue) : milValue;
}

// 표시값 → mil 내부값
function toMilInternal(dispValue, hasDim) {
  return hasDim && state.unit === 'mm' ? mmToMil(dispValue) : dispValue;
}

// 슬라이더/number 입력의 step (표시 단위 기준)
function dispStep(field) {
  if (!field.hasDim || state.unit === 'mil') return field.step;
  return parseFloat(milToMm(field.step).toFixed(4));
}

// 소수점 자리수: mil=1dp, mm=4dp, er=2dp
function fmt(val, hasDim) {
  if (!hasDim) return val.toFixed(2);
  return state.unit === 'mm' ? val.toFixed(4) : val.toFixed(1);
}

function unitSuffix(hasDim) {
  return hasDim ? ` ${state.unit}` : '';
}

// ── 계산 ─────────────────────────────────────────────────

function calculate() {
  const v = state.vals[state.type];
  const result = state.type === 'microstrip'
    ? calcMicrostrip(v)
    : calcStripline(v);
  renderResult(result);
}

// ── 결과 렌더링 ───────────────────────────────────────────

function renderResult(r) {
  const panel = document.getElementById('result-panel');
  const warning = r.isValidRange ? '' : `
    <p class="range-warning">⚠ 입력값이 공식의 유효 범위를 벗어났습니다</p>`;

  panel.innerHTML = `
    <div class="result-content">
      ${warning}
      <p class="result-formula">${r.formulaName}</p>
      <div class="result-row">
        <span class="result-label">특성 임피던스 Z₀</span>
        <span class="result-val">${r.Z0.toFixed(2)} Ω</span>
      </div>
      <div class="result-row">
        <span class="result-label">실효 유전율 εeff</span>
        <span class="result-val">${r.eEff.toFixed(3)}</span>
      </div>
      <div class="result-row">
        <span class="result-label">전파 지연 tpd</span>
        <span class="result-val">${r.tpd.toFixed(1)} ps/in</span>
      </div>
    </div>
  `;
}

// ── 입력 패널 렌더링 ──────────────────────────────────────

function renderInputPanel() {
  const panel = document.getElementById('input-panel');
  panel.innerHTML = '';

  // 단위 토글
  const unitRow = document.createElement('div');
  unitRow.className = 'unit-toggle-row';
  unitRow.innerHTML = `
    <span class="unit-toggle-label">표시 단위</span>
    <div class="unit-btn-group" role="group" aria-label="단위 선택">
      <button class="unit-btn${state.unit === 'mil' ? ' active' : ''}" data-unit="mil">mil</button>
      <button class="unit-btn${state.unit === 'mm'  ? ' active' : ''}" data-unit="mm">mm</button>
    </div>
  `;
  unitRow.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.unit === btn.dataset.unit) return;
      state.unit = btn.dataset.unit;
      renderInputPanel(); // 표시 단위만 바뀌므로 재계산 불필요
    });
  });
  panel.appendChild(unitRow);

  // 파라미터 필드
  FIELDS[state.type].forEach(field => {
    const milCur = state.vals[state.type][field.key];
    const dCur   = toDisp(milCur, field.hasDim);
    const dMin   = toDisp(field.min, field.hasDim);
    const dMax   = toDisp(field.max, field.hasDim);
    const dStep  = dispStep(field);

    const row = document.createElement('div');
    row.className = 'field-row';
    row.innerHTML = `
      <div class="field-header">
        <label class="field-label" for="num-${field.key}">
          <span class="field-symbol">${field.label}</span>
          <span class="field-desc">${field.desc}</span>
        </label>
        <span class="field-cur" id="cur-${field.key}">${fmt(dCur, field.hasDim)}${unitSuffix(field.hasDim)}</span>
      </div>
      <div class="field-inputs">
        <input type="range" id="slider-${field.key}" class="field-slider"
          min="${dMin}" max="${dMax}" step="${dStep}" value="${dCur}">
        <input type="number" id="num-${field.key}" class="field-num"
          min="${dMin}" max="${dMax}" step="${dStep}" value="${fmt(dCur, field.hasDim)}">
      </div>
    `;

    const slider = row.querySelector(`#slider-${field.key}`);
    const numEl  = row.querySelector(`#num-${field.key}`);
    const curEl  = row.querySelector(`#cur-${field.key}`);

    const commit = (dv) => {
      state.vals[state.type][field.key] = toMilInternal(dv, field.hasDim);
      curEl.textContent = fmt(dv, field.hasDim) + unitSuffix(field.hasDim);
      calculate();
    };

    slider.addEventListener('input', () => {
      const dv = parseFloat(slider.value);
      numEl.value = fmt(dv, field.hasDim);
      commit(dv);
    });

    numEl.addEventListener('input', () => {
      const dv = parseFloat(numEl.value);
      if (isNaN(dv)) return;
      const clamped = Math.min(Math.max(dv, dMin), dMax);
      slider.value = clamped;
      commit(clamped);
    });

    panel.appendChild(row);
  });
}

// ── 탭 초기화 ─────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      state.type = btn.dataset.type;
      renderInputPanel();
      calculate();
    });
  });
}

// ── 진입점 ───────────────────────────────────────────────

initTabs();
renderInputPanel();
calculate();
