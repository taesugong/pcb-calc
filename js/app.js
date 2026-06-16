import { calcMicrostrip, calcStripline, milToMm, mmToMil, ozToMil } from './formulas.js';
import { drawMicrostrip, drawStripline } from './crosssection.js';

// ── State ─────────────────────────────────────────────────
const state = {
  type: 'microstrip',
  unit: 'mil',
  // Internal values are always stored in mil
  vals: {
    microstrip: { W: 10,  H: 5,  T: 1.4, er: 4.3 },
    stripline:  { W: 8,   B: 20, T: 1.4, er: 4.3 },
  },
};

// ── Preset values (typical real-world constants) ─────────
// er: typical dielectric constants for common PCB substrate materials
// T:  typical copper foil thicknesses in oz (converted to mil for storage)
const PRESETS = {
  er: [
    { label: 'FR-4',         value: 4.3  },
    { label: 'FR-4 (HF)',    value: 3.8  },
    { label: 'Rogers 4350B', value: 3.48 },
    { label: 'Rogers 5880',  value: 2.2  },
    { label: 'Polyimide',    value: 3.5  },
    { label: 'Air/PTFE',     value: 2.1  },
  ],
  T: [
    { label: '1/3 oz', value: ozToMil(1 / 3) },
    { label: '1/2 oz', value: ozToMil(1 / 2) },
    { label: '1 oz',   value: ozToMil(1)     },
    { label: '2 oz',   value: ozToMil(2)     },
    { label: '3 oz',   value: ozToMil(3)     },
  ],
};

// ── Field definitions (ranges are in mil) ────────────────
const FIELDS = {
  microstrip: [
    { key: 'W',  label: 'W',  desc: 'Trace width',        min: 1,   max: 50,  step: 0.5, hasDim: true  },
    { key: 'H',  label: 'H',  desc: 'Dielectric height',  min: 1,   max: 50,  step: 0.5, hasDim: true  },
    { key: 'T',  label: 'T',  desc: 'Copper thickness',   min: 0.3, max: 4.5, step: 0.1, hasDim: true,  presets: 'T'  },
    { key: 'er', label: 'εr', desc: 'Dielectric constant', min: 2,  max: 10,  step: 0.1, hasDim: false, presets: 'er' },
  ],
  stripline: [
    { key: 'W',  label: 'W',  desc: 'Trace width',        min: 1,   max: 50,  step: 0.5, hasDim: true  },
    { key: 'B',  label: 'B',  desc: 'Total dielectric thickness', min: 2, max: 100, step: 0.5, hasDim: true },
    { key: 'T',  label: 'T',  desc: 'Copper thickness',   min: 0.3, max: 4.5, step: 0.1, hasDim: true,  presets: 'T'  },
    { key: 'er', label: 'εr', desc: 'Dielectric constant', min: 2,  max: 10,  step: 0.1, hasDim: false, presets: 'er' },
  ],
};

// ── Unit helpers ──────────────────────────────────────────

// mil internal value → display value
function toDisp(milValue, hasDim) {
  return hasDim && state.unit === 'mm' ? milToMm(milValue) : milValue;
}

// display value → mil internal value
function toMilInternal(dispValue, hasDim) {
  return hasDim && state.unit === 'mm' ? mmToMil(dispValue) : dispValue;
}

// slider/number input step (in display unit)
function dispStep(field) {
  if (!field.hasDim || state.unit === 'mil') return field.step;
  return parseFloat(milToMm(field.step).toFixed(4));
}

// decimal places: mil=1dp, mm=4dp, er=2dp
function fmt(val, hasDim) {
  if (!hasDim) return val.toFixed(2);
  return state.unit === 'mm' ? val.toFixed(4) : val.toFixed(1);
}

function unitSuffix(hasDim) {
  return hasDim ? ` ${state.unit}` : '';
}

// ── SVG reference (created once on init) ─────────────────
let crossSVG = null;

function initCrossSection() {
  const panel = document.getElementById('cross-section');
  panel.innerHTML = '';
  crossSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  panel.appendChild(crossSVG);
}

function updateCrossSection() {
  if (!crossSVG) return;
  const v = state.vals[state.type];
  if (state.type === 'microstrip') {
    drawMicrostrip(crossSVG, v);
  } else {
    drawStripline(crossSVG, v);
  }
}

// ── Calculation ───────────────────────────────────────────

function calculate() {
  const v = state.vals[state.type];
  const result = state.type === 'microstrip'
    ? calcMicrostrip(v)
    : calcStripline(v);
  renderResult(result);
  updateCrossSection();
}

// ── Result rendering ──────────────────────────────────────

function renderResult(r) {
  const panel = document.getElementById('result-panel');
  panel.classList.toggle('result-panel--warn', !r.isValidRange);

  const structName = state.type === 'microstrip' ? 'Microstrip' : 'Symmetric Stripline';
  const copyText = `Z0 = ${r.Z0.toFixed(1)} Ω (εeff=${r.eEff.toFixed(2)}, ${structName}, IPC-2141A)`;

  const warningBadge = r.isValidRange ? '' : `
    <div class="result-warning" role="alert">
      <span class="result-warning-icon">⚠</span>
      <span>Input is outside the valid range — use for reference only</span>
    </div>`;

  panel.innerHTML = `
    <div class="result-content">
      ${warningBadge}
      <div class="result-z0-block">
        <div class="result-z0-label">Characteristic Impedance Z₀</div>
        <div class="result-z0-value">${r.Z0.toFixed(1)}<span class="result-z0-unit"> Ω</span></div>
      </div>
      <div class="result-secondary">
        <div class="result-item">
          <span class="result-item-label">εeff</span>
          <span class="result-item-value">${r.eEff.toFixed(3)}</span>
        </div>
        <div class="result-item">
          <span class="result-item-label">tpd</span>
          <span class="result-item-value">${r.tpd.toFixed(1)}<span class="result-item-unit"> ps/in</span></span>
        </div>
      </div>
      <div class="result-formula-name">${r.formulaName}</div>
      <button class="result-copy-btn" data-copy="${copyText}">Copy result</button>
    </div>
  `;
}

// ── Clipboard copy (event delegation) ─────────────────────

function initResultPanel() {
  document.getElementById('result-panel').addEventListener('click', (ev) => {
    const btn = ev.target.closest('.result-copy-btn');
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copy).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
      }, 1500);
    });
  });
}

// ── Input panel rendering ─────────────────────────────────

function renderInputPanel() {
  const panel = document.getElementById('input-panel');
  panel.innerHTML = '';

  // Unit toggle
  const unitRow = document.createElement('div');
  unitRow.className = 'unit-toggle-row';
  unitRow.innerHTML = `
    <span class="unit-toggle-label">Display unit</span>
    <div class="unit-btn-group" role="group" aria-label="Select unit">
      <button class="unit-btn${state.unit === 'mil' ? ' active' : ''}" data-unit="mil">mil</button>
      <button class="unit-btn${state.unit === 'mm'  ? ' active' : ''}" data-unit="mm">mm</button>
    </div>
  `;
  unitRow.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.unit === btn.dataset.unit) return;
      state.unit = btn.dataset.unit;
      renderInputPanel(); // only the display unit changes, no recalculation needed
    });
  });
  panel.appendChild(unitRow);

  // Parameter fields
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
          min="${dMin}" max="${dMax}" step="${dStep}" value="${dCur}"
          aria-label="${field.desc}">
        <input type="number" id="num-${field.key}" class="field-num"
          min="${dMin}" max="${dMax}" step="${dStep}" value="${fmt(dCur, field.hasDim)}"
          aria-label="${field.desc} numeric input">
        <span class="field-unit-tag" aria-hidden="true">${field.hasDim ? state.unit : ''}</span>
      </div>
    `;

    const slider = row.querySelector(`#slider-${field.key}`);
    const numEl  = row.querySelector(`#num-${field.key}`);
    const curEl  = row.querySelector(`#cur-${field.key}`);

    let presetRow = null;

    const commit = (dv) => {
      state.vals[state.type][field.key] = toMilInternal(dv, field.hasDim);
      curEl.textContent = fmt(dv, field.hasDim) + unitSuffix(field.hasDim);
      if (presetRow) syncPresetActiveState(presetRow, field);
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

    // Preset chips (typical real-world constants for this field)
    if (field.presets) {
      presetRow = document.createElement('div');
      presetRow.className = 'field-presets';
      presetRow.setAttribute('role', 'group');
      presetRow.setAttribute('aria-label', `${field.desc} presets`);

      PRESETS[field.presets].forEach(p => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'preset-chip';
        chip.textContent = p.label;
        chip.dataset.value = p.value; // always stored in mil (T) or as-is (er)

        chip.addEventListener('click', () => {
          const dv = toDisp(p.value, field.hasDim);
          const clampedDv = Math.min(Math.max(dv, dMin), dMax);
          slider.value = clampedDv;
          numEl.value = fmt(clampedDv, field.hasDim);
          commit(clampedDv);
        });

        presetRow.appendChild(chip);
      });

      panel.appendChild(presetRow);
      syncPresetActiveState(presetRow, field);
    }
  });
}

// Highlights the preset chip matching the current value (if any)
function syncPresetActiveState(presetRow, field) {
  const milCur = state.vals[state.type][field.key];
  const EPS = 1e-3;
  presetRow.querySelectorAll('.preset-chip').forEach(chip => {
    const chipVal = parseFloat(chip.dataset.value);
    chip.classList.toggle('active', Math.abs(chipVal - milCur) < EPS);
  });
}

// ── Tab initialization ─────────────────────────────────────

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

// ── Entry point ─────────────────────────────────────────────

initTabs();
initCrossSection();
initResultPanel();
renderInputPanel();
calculate();
