# PCB 임피던스 계산기

PCB 전송선로의 특성 임피던스(Z₀)를 계산하는 정적 웹 앱입니다.  
외부 라이브러리 없이 Vanilla HTML/CSS/JS(ES Modules)만 사용합니다.

## 지원 구조 (Phase 1)

| 구조 | 공식 | 상태 |
|------|------|------|
| Microstrip | IPC-2141A | ✅ 지원 |
| Symmetric Stripline | IPC-2141A | ✅ 지원 |
| CPWG / CPW / CPS | — | 🔜 Phase 2 예정 |

## 기능

- Z₀, εeff, tpd(전파 지연) 실시간 계산
- mil / mm 단위 전환
- 입력 범위 이탈 시 경고 배지
- 실시간 단면도 SVG (치수선 포함)
- 결과 클립보드 복사
- 다크 모드 자동 감지 (`prefers-color-scheme`)
- 모바일 반응형 (768 px / 480 px 브레이크포인트)
- `<iframe>` 임베드 지원 (`body { background: transparent }`)

## 로컬 실행 방법

ES Modules(`<script type="module">`)을 사용하므로 로컬 서버가 필요합니다.  
`file://` 프로토콜로 직접 열면 CORS 오류가 발생합니다.

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
# Live Server 익스텐션 → "Open with Live Server"
```

브라우저에서 `http://localhost:8080` 으로 접속합니다.

## 배포 (GitHub Pages)

```bash
git push origin main
```

Settings → Pages → Source: `main` 브랜치 / `/ (root)`로 설정하면  
`https://<your-username>.github.io/pcb-calc/` 에서 접근 가능합니다.

## iframe 임베드

```html
<iframe
  src="https://<your-username>.github.io/pcb-calc/"
  width="900"
  height="560"
  style="border: none; width: 100%; min-height: 500px;"
  title="PCB 임피던스 계산기"
  loading="lazy">
</iframe>
```

## 검증 결과

`test.html` 을 로컬 서버에서 열면 브라우저 내에서 공식 검증을 실행합니다.  
아래 값은 직접 손으로 계산(IPC-2141A 공식 적용)한 기준값입니다.

### Microstrip — IPC-2141A: Z₀ = 87/√(εr+1.41) × ln(5.98H / (0.8W+T))

| # | W (mil) | H (mil) | T (mil) | εr | Z₀ (Ω) | εeff | tpd (ps/in) | 유효범위 |
|---|---------|---------|---------|-----|---------|------|-------------|---------|
| MS1 | 10 | 5 | 1.4 | 4.3 | **42.1** | 3.274 | 153.8 | ✅ W/H=2.0 |
| MS2 | 20 | 10 | 1.4 | 4.3 | **44.9** | 3.274 | 153.8 | ✅ W/H=2.0 |

> **MS1 vs MS2 분석**  
> W/H 비율이 동일(2.0)하므로 **εeff는 3.274로 동일**합니다.  
> 그러나 Z₀는 ≈2.8 Ω 차이납니다. 원인: `T = 1.4 mil`이 고정되어 W, H가 2배가 되어도  
> 분모 `0.8W + T`에서 T의 비중이 달라지기 때문입니다 — 공식의 **정확한 물리적 동작**입니다.

### Stripline — IPC-2141A: Z₀ = 60/√εr × ln(4B / (π·(0.8W+T)))

| # | W (mil) | B (mil) | T (mil) | εr | Z₀ (Ω) | εeff | tpd (ps/in) | 유효범위 |
|---|---------|---------|---------|-----|---------|------|-------------|---------|
| SL1 | 8 | 20 | 1.4 | 4.3 | **34.2** | 4.300 | 176.3 | ⚠️ W/B=0.40>0.35 |

> SL1은 W/B = 0.40 > 0.35 (IPC-2141A 적용 한계)로 유효 범위를 벗어납니다.  
> 계산기에서 경고 배지가 표시되며, 결과는 참고용으로만 사용하십시오.

## 공식 출처

- **IPC-2141A** — *Controlled Impedance Circuit Boards and High Speed Logic Design*  
  IPC (Association Connecting Electronics Industries), 2004.
- Hammerstad 유효 유전율 근사식 (Microstrip εeff 계산에 적용)

## 파일 구조

```
pcb-calc/
├── index.html          # 앱 진입점
├── style.css           # CSS 변수 기반 테마, 반응형
├── js/
│   ├── app.js          # UI 로직, 상태 관리
│   ├── formulas.js     # 계산 엔진 (순수 함수, DOM 없음)
│   └── crosssection.js # SVG 단면도 드로잉 엔진
└── test.html           # 공식 검증 테스트 (로컬 서버 필요)
```

## Phase 2 계획

- [ ] **CPWG** (Coplanar Waveguide with Ground): Hammerstad 공식
- [ ] **CPW** (Coplanar Waveguide): Gupta 공식
- [ ] **CPS** (Coplanar Strip): 대칭 CPS 공식
- [ ] 입력값 저장 (localStorage)
- [ ] 인쇄/PDF 내보내기

## 라이선스

MIT
