# Vivace 카페 메뉴 통합 시스템

## Context (배경)

Vivace 카페는 같은 메뉴를 여러 인쇄 포맷으로 운영한다:
- **A4 All** — 핸드드립 제외 전체 메뉴 한 장
- **A4 L / A4 R** — A4를 둘로 나눈 버전 (L: 메인 메뉴, R: A4 절반 크기 핸드드립)
- **A3 L / A3 R** — 외부 패널(A2)용으로 키운 버전. L은 A4를 확대, R은 절반 A3를 못 쓰므로 핸드드립을 **꽉 찬 A3로 확장**

현재 Figma에서 가져온 5개 디자인(`src/imports/VivaceMenu*`)은 **레이아웃 틀만** 있고(제목/블렌드 설명/안내문/로고/뱃지), 실제 음료 항목 리스트는 빈 `<div>` placeholder다. 또 변형마다 글자 크기·안내문 포맷·정렬이 제각각이라(예: A3에서 "디카페인" 안내문만 2배로 스케일, 좌/우 페이지 정렬 불일치) 일관성이 없다.

**목표 4가지:**
1. 모든 메뉴 텍스트 크기·부가설명 포맷을 **하나의 토큰 시스템**으로 통일 (A4=기준, A3=동일 디자인 × 스케일)
2. A3 L/R 두 장이 **가로 풀스크린**으로 한 화면에 나오는 웹 뷰
3. 웹/앱 **입력 패널**로 핸드드립·메뉴 내용 수정 → 미리보기 즉시 반영, **Supabase 클라우드 동기화**
4. **5종 PDF 내보내기**: A4 All / A4 L / A4 R / A3 L / A3 R (정확한 용지 치수)

**사용자 확정 사항:**
- 저장: **Supabase** (여러 기기 공유) — 구현 시 `make:supabase` 스킬로 연결 진행
- 메뉴 데이터: 실제 메뉴 제공됨 (아래 시드 데이터)
- 폰트: **무료 대체 폰트** 사용 (Kepler 3 VF Display → 무료 세리프 디스플레이, Merge One → 무료 산세리프, 한글 → Noto Sans KR). 라이선스 안전.

---

## 핵심 설계 원칙

**"하나의 데이터 + 하나의 토큰 세트 × 스케일 = 5개 레이아웃"**
- 메뉴 내용은 한 곳(데이터 모델/Supabase)에만 존재
- 디자인 토큰(글자 크기·여백·선 굵기·용지 치수)은 A4 기준 1세트만 작성하고 `scale` 배수로 파생. **측정된 A3:A4 = 1.3612** (제목 84.033→114.388px, 선 2.626→3.575px)
- 인쇄 정합성을 위해 rem이 아닌 **px@DPI** 사용. A4=210×297mm, A3=297×420mm

---

## 시드 데이터 (PDF에서 추출한 실제 메뉴)

가격은 천원 단위 표기(`4.0` = 4,000원). 화면/PDF에는 PDF와 동일하게 `4.0` 형식 그대로 출력.

### Coffee — Espresso Base
| EN | KR | 가격 | 뱃지 |
|---|---|---|---|
| Espresso | 에스프레소 | 4.0 | |
| Americano | 아메리카노 | 4.0 (take out 3.5) | |
| Cremoso | 크레모소 | 4.0 | |
| Machiato | 마끼아또 | 4.5 | |
| Bola | 볼라 | 4.5 | signature |
| Flat White | 플랫 화이트 | 4.5 | |
| Cappuccino | 카푸치노 | 4.5 | |
| Cafe Latte | 카페라떼 | 4.5 | Best |
| Caramel Machiato | 카라멜 마끼아또 | 5.0 | |
| Saigon Latte | 사이공 라떼 | 5.0 | |
| Vanilla Latte | 수제 바닐라 라떼 | 5.0 | |
| Soy Latte | 소이 라떼 | 5.0 | |

섹션 안내문: `⊻ 디카페인 변경 가능합니다.` / `⊻ 샷 추가 + 1.0`

### Tea — Hot / Ice (모두 5.5)
- Cool Herb / 쿨 허브 티 — 감초의 단맛, 페퍼민트, 레몬그라스의 화사함
- Just Fruit / 저스트 프룻 티 — 수레국화 꽃잎, 포도, 로즈힙, 딸기, 새콤달콤
- Sandle Baram / 산들바람 티 — 그린 루이보스 베이스, 복합적, 상큼함
- Pink Cloud / 분홍구름 티 — 백차의 가볍고 섬세한 맛, 열대과일의 상큼함

### Beverage (모두 5.5)
- London Fog / 런던 포그 티 — 베르가못 향의 얼그레이에 따뜻한 우유
- Kalona Cocoa / 깔로나 코코아 — Extra 100% 코코아
- Fresh Lemon Ade / 착즙 레몬 에이드 — 생레몬을 직접 착즙한 상큼한 에이드
- Vivace Milky Soda / 비바체 밀키 소다 — 건강한 밀키스

### Dessert
- Vivace Cheese Cake / 비바체 수제 치즈 케이크 — 5.0 — 첨가물을 넣지 않은 치즈 듬뿍 수제 케이크

### Blends (설명 박스)
- **[A] Blend**: 초콜릿과 홍차 사이의 은은한 쌉싸래함이 먼저 다가오고 뒤이어 구운 땅콩과 아몬드의 고소함, 살짝 올라오는 꿀의 단맛이 조화롭게 어우러집니다. 묵직한 볼륨감과 바디감, 그리고 끝까지 이어지는 여운과 감칠맛이 특징인 산미없는 원두
- **[B] Blend**: 고소함과 둥근 산미가 밸런스있고 적당한 볼륨감과 맛의 흐름이 이어지는 재미있는 구조의 풍미가 매력적인 블렌드. 좋은 향미와 오일리한 바디감 그리고 마일드하고 부드러운 마무리가 특징입니다.

### Filter Coffee / Specialty Hand drip — Hot / Ice (섹션 뱃지: Best)
| 원두 | 등급/가공 | 가격 | 헤드카피 + 설명 |
|---|---|---|---|
| Peru El Diamante Geisha | Washed | 6.5 | "입안에 피어나는 맑고 화사한 아카시아꽃" / 우아한 향기가 열리는 195도의 찰나를 온전히 담아냈습니다. 은은한 아카시아향과 꿀의 늬앙스를 즐겨보세요. |
| Colombia Campo Hermoso Caturra | Passion Fruits | 6.5 | "코끝을 스치는 폭발적인 트로피컬 넥타" / 밀려오는 짙은 열대과일 향기가 먼저 감각을 자극합니다. 밝게 떨어지는 단맛의 기분 좋은 자극을 경험해 보세요. |
| Ethiopia Yirgacheffe Gersi G1 | Natural | 6.5 | "입안 가득 번지는 햇살을 머금은 보라빛 포도" / 화사한 들꽃 향기와, 입술을 적시는 달콤한 와인의 풍미가 매혹적입니다. 햇살 아래 바짝 말려 농축된 깊은 단맛이 아주 부드럽고 우아한 여운을 남깁니다. |
| Colombia Potosi Tres Dragons | Natural | 6.5 | "라즈베리를 띄운 향긋한 위스키 한 잔" / 첫 모금에 피어나는 붉은 라즈베리 과즙 뒤로, 초콜릿과 위스키의 깊은 풍미가 우아하게 중심을 잡아줍니다. 카모마일의 은은한 향기가 기분 좋은 위로를 건네는 매혹적인 커피입니다. |
| Ethiopia Guji Dimtu G1 | Natural | 6.0 | "코코아 파우더를 듬뿍 얹은 부드러운 블루베리 트러플" / 입안을 포근하게 감싸는 파우더리한 초콜릿 질감이 아주 매력적입니다. 튀지 않는 단정한 산미와 짙은 고소함 속에서, 은은하게 피어나는 블루베리의 향기가 기분 좋은 감칠맛을 선사합니다. |
| Kenya Gathaithi Nyeri AA | — | 6.0 | "오랜 열기가 응축된 묵직함, 그리고 생기 넘치는 블루베리" / 가볍게 스쳐 가는 맛이 아닌, 입안에 깊고 진하게 남는 바디감. 정성스러운 뜸 들이기가 완성한 묵직한 달콤함 속에서 톡 터지는 과즙의 매력을 만끽해 보세요. |

핸드드립 푸터 안내문: `비바체에서는 생두가 가진 텍스쳐, 과즙의 단맛, 볼륨감의 밸런스에 집중해서 로스팅하고 있습니다.` / `로스팅 날짜 기준 17~20일 이후, 원두 컨디션에 따라 폐기 처리합니다.`

---

## 구현 계획 (파일별, 단계별)

### Phase 0 — 폰트 & 토큰 기반
- `src/styles/fonts.css`: 무료 대체 폰트 `@font-face`/`@import` (예: 디스플레이 세리프 = Playfair Display 또는 EB Garamond, 산세리프 뱃지 = Inter, 한글 = Noto Sans KR). 임포트는 이 파일 최상단에만.
- `src/app/menu/tokens.ts`: A4 기준 토큰 1세트 — `fontSize`(헤더 84.033 / 서브 47.27 / 블렌드제목 66 / 블렌드본문 40 / 아이템명 / 가격 / 설명 / 안내문), `tracking`, `gap`, `stroke 2.626`, 용지 `{a4:{w:210,h:297}, a3:{w:297,h:420}}` mm, `DPI=96`(화면) / 300(인쇄). `tokensForScale(scale)` 헬퍼로 전 토큰 × scale 반환. `SCALE = { a4:1, a3:1.3612 }`.
- `src/app/menu/ScaleContext.tsx`: `{ scale, tokens, pageWidthPx, pageHeightPx }` 제공하는 Context + Provider.

### Phase 1 — 데이터 모델 & 시드
- `src/app/data/menu-types.ts`: `MenuItem { id, nameEn, nameKr, price, priceNote?, desc?, badge? }`, `MenuSection { id, titleEn, titleSub?, badge?, items[], note? }`, `BlendBox { id, label, desc }`, `MenuData { sections, blends, handdripSection, globalNotes }`.
- `src/app/data/menu-seed.ts`: 위 시드 데이터를 그대로 입력.
- `src/app/data/section-layout.ts`: 어떤 섹션이 어느 페이지(All / L / R)에 들어가는지, A3R 핸드드립 확장 플래그 선언 — 5개 레이아웃 동기화의 단일 출처.

### Phase 2 — 재사용 표현 컴포넌트 (`src/app/components/menu/`)
모두 `ScaleContext`에서 토큰을 읽어 크기 결정 (개별 px 하드코딩 제거):
- `VivaceLogo.tsx` — `src/imports/VivaceMenu01A4All/svg-*.ts`(가로형) 및 `VivaceMenu02A4R/svg-*.ts`(세로 심볼형) path 재사용, viewBox 기반이라 스케일 무관. `variant: 'full' | 'symbol'`.
- `SectionHeader.tsx` — 제목 + 서브타이틀(Espresso Base / Hot/Ice) + 하단 구분선 + 옵션 뱃지.
- `MenuItemRow.tsx` — EN명/KR명/가격/뱃지/설명. 핸드드립용 변형(헤드카피 + 다줄 설명).
- `Badge.tsx` — signature / Best 회색 타원 뱃지(Merge One 대체 폰트).
- `BlendBox.tsx` — 테두리 박스 [A]/[B] Blend.
- `NoteBlock.tsx` — 디카페인/로스팅 안내문. **정렬·크기를 토큰으로 통일**(기존 불일치 해소).

### Phase 3 — 레이아웃 합성 (`src/app/components/pages/`)
공통 섹션 컴포넌트로 5개 페이지 조립:
- `PageFrame.tsx` — 흰 배경 + 고정 px 용지 크기 + 로고 배치. `paper: 'a4'|'a3'`, `scale` 적용.
- `MenuColumn.tsx` — 컬럼 단위 섹션 묶음.
- `PageA4All.tsx` — 2컬럼, 전체(핸드드립 제외 메인 + Tea/Beverage/Dessert). *주의: A4All 원본엔 Filter 헤더가 있으나 사용자 정의("핸드드립 제외 전체")에 맞춰 구성은 구현 시 확인.*
- `PageA4L.tsx` — 메인 메뉴(Coffee/Tea/Beverage/Dessert + Blend).
- `PageA4R.tsx` — 핸드드립(반 A4).
- `PageA3L.tsx` — `PageA4L` × scale a3.
- `PageA3R.tsx` — 핸드드립, `expand` 플래그로 항목 간격을 flex-grow 시켜 꽉 찬 A3 채움.

### Phase 4 — 상태관리 & Supabase
- **`make:supabase` 스킬 실행** → 사용자 Supabase 프로젝트 연결, `menu_data` 테이블(단일 JSON 문서 또는 정규화 테이블) 생성.
- `src/app/state/menu-store.tsx`: Context + `useReducer`. 초기값 = Supabase fetch(없으면 시드). 수정 시 Supabase upsert + 낙관적 업데이트. 실시간 구독(선택)으로 다기기 반영. `sonner` 토스트로 저장 피드백.
- 모든 페이지/에디터가 같은 스토어 구독 → 편집 즉시 미리보기 반영.

### Phase 5 — 입력 패널 (`src/app/components/editor/`)
- `EditorPanel.tsx` — shadcn `Tabs`(Coffee/Tea/Beverage/Dessert/Hand drip/안내문) + `react-hook-form`@7.55.0 `useFieldArray`로 항목 추가/삭제/순서변경/수정. 가격·뱃지·설명 필드.
- 좌측 폼 / 우측 라이브 미리보기 분할 레이아웃.

### Phase 6 — 가로 풀스크린 웹 뷰
- `src/app/components/view/ScaleToFit.tsx` — 컨테이너 크기 측정(ResizeObserver) → 고정 px 페이지에 `transform: scale()` 적용해 뷰포트에 맞춤.
- `WebHorizontal.tsx` — A3 L + A3 R을 가로로 나란히, 화면 꽉 차게.

### Phase 7 — PDF 내보내기
- 패키지 추가: `jspdf` + `html2canvas` (pnpm).
- `src/app/export/pdf.ts` — 각 페이지를 화면 밖에서 네이티브 px(300DPI 기준)로 렌더 → `html2canvas` 캡처 → mm 치수(A4 210×297 / A3 297×420)의 `jsPDF` 페이지에 `addImage` → 저장. 5개 파일 개별 내보내기 + "전체 5종" 일괄 버튼.
- **캡처 전 `await document.fonts.ready`** 로 폰트 로드 보장.
- `src/app/components/export/ExportPanel.tsx` — 5종 미리보기 썸네일 + 개별/일괄 다운로드 버튼.

### Phase 8 — 라우팅 & App
- `src/app/App.tsx` — `react-router`(이미 설치됨)로 `/`(가로 미리보기), `/editor`, `/export`, `/preview/:layout` 구성. 전체를 `MenuStoreProvider`로 감쌈. 기본 export 유지.
- 상단 네비게이션(shadcn 버튼)으로 뷰 전환.

---

## 재사용 / 주의

- **로고 SVG 재사용**: `src/imports/VivaceMenu01A4All/svg-o5zzswhb7v.ts`(가로형), `src/imports/VivaceMenu02A4R/svg-c0mmww8jrk.ts`(세로 심볼). 새로 그리지 말고 import.
- **imports/ 원본은 참고용**(빈 placeholder)이라 직접 렌더하지 않고, 새 토큰 기반 컴포넌트로 대체. 단 로고 path만 추출 재사용.
- shadcn/ui(`src/app/components/ui/`) 컴포넌트 우선 사용(Tabs, Button, Input, Card, Toast 등).

## 리스크

1. **무료 폰트 메트릭 차이** — Kepler 대체 폰트는 글자 폭이 달라 줄바꿈/길이가 변함. 토큰 값을 대체 폰트 기준으로 한 번 미세조정 필요.
2. **html2canvas 충실도** — `font-variation-settings`(wdth/weight), `text-box-trim` 일부 미지원 가능. 초기에 PDF 1종 먼저 검증 후 진행.
3. **mm↔px 인쇄 정확도** — 실제 출력 시 A4가 210mm로 나오는지, 1.3612 배율이 모든 토큰에 유지되는지 검증.
4. **Supabase 연결 의존** — 스킬 플로우로 사용자가 프로젝트 연결해야 시작 가능. 미연결 시 시드 데이터로 폴백 동작하게 구현.

## 검증 방법 (end-to-end)

1. 개발 서버(이미 구동 중) 미리보기에서 `/`(A3 L/R 가로 풀스크린) 렌더 확인.
2. `/editor`에서 핸드드립 항목 수정 → 미리보기 즉시 반영 + Supabase 저장(다른 탭 새로고침 시 유지) 확인.
3. `/export`에서 5종 PDF 다운로드 → 각 PDF의 용지 크기(A4/A3)와 내용이 PDF 원본과 일치하는지 확인. 특히 A4 L/R 내용이 PDF와 동일한지 대조.
4. A3 R 핸드드립이 꽉 찬 A3로 확장되는지 확인.
