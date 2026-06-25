# Vivace Menu System

카페 Vivace 메뉴를 **하나의 데이터로 통합**하고, 웹뷰 · 입력 패널 · PDF 5종 내보내기를
하나의 시스템에서 운영하기 위한 프로젝트.

## 핵심 원칙
> **하나의 데이터(`data/menu.json`) → 디자인 토큰 → 공유 컴포넌트 → 5개 레이아웃**

메뉴를 한 곳에서만 고치면 5개 산출물이 항상 자동으로 동기화된다.

## 5개 레이아웃 (같은 데이터의 뷰)
| 뷰 | 크기 | 내용 |
|---|---|---|
| `A4.All` | A4 | 핸드드립 짧은버전 포함 전체 메뉴 |
| `A4.L` | A4 | 에스프레소·티·음료·디저트 + [A]/[B] 블렌드 |
| `A4.R` | A5(반) | 핸드드립 상세(긴 시적 설명) |
| `A3.L` | A3 | A4.L 확대 (외부 패널용) |
| `A3.R` | A3 | 핸드드립 풀 A3 확장 (패널이 A2라 반쪽 A3 불가) |

## 디렉토리
```
data/menu.json          단일 소스 (모든 레이아웃의 원천). _review에 통합 시 결정사항 표시
prototype/              MVP 렌더러 (의존성 없이 브라우저에서 동작)
  styles/tokens.css     디자인 토큰 = 시스템화의 핵심 (폰트크기/여백/뱃지/스케일)
  styles/menu.css       공유 컴포넌트 스타일
  scripts/render.js     데이터 → HTML 렌더링 엔진 (layout composer)
  assets/droplet.svg    핸드드립(R) 패널 로고
  index.html            A4.All 미리보기
reference/              원본 PDF에서 추출한 SVG + 렌더 스크린샷 (대조용)
```

## 실행 (메인 앱)
실제 앱은 `figmamvp/` 에 있습니다. 루트에서 바로 실행됩니다:
```bash
cd /Users/burnkim/Dev/vivace
npm run setup    # 최초 1회: figmamvp 의존성 설치
npm run dev      # → http://localhost:5173
```
루트 `package.json` 의 스크립트(`dev`/`build`/`preview`/`setup`)가 `figmamvp/` 로 위임합니다.

> `prototype/` 는 초기 정적 MVP(참고용). 현재 개발은 `figmamvp/` 의 Vite+React 앱에서 진행합니다.

## 진행 상태
- [x] **1단계** 데이터 모델 + 토큰 + A4.All 렌더러 (MVP) ← 완료
- [ ] **2단계** 나머지 4개 레이아웃 (A4.L / A4.R / A3.L / A3.R)
- [ ] **3단계** 가로 풀스크린 웹뷰 (A3.L + A3.R 나란히)
- [ ] **4단계** 관리자 입력 패널 + DB 연결 (Supabase/Vercel KV)
- [ ] **5단계** PDF 5종 내보내기 (Playwright `page.pdf`, 정확한 mm)
- [ ] **6단계** Next.js 이관 + Vercel 배포

## 통합 시 확인 필요 (data/menu.json `_review` 참고)
1. Caramel Machiato 포함 여부 (포함으로 처리)
2. Americano take-out 3.5 표기 (포함)
3. Beverage: Dark Choco Latte(5.0) vs Kalona Cocoa(5.5) → Kalona Cocoa로 통일
4. Best 뱃지: Cappuccino vs Cafe Latte → Cafe Latte
5. 핸드드립 라인업: A4.R 기준 6종으로 통일 (현재 운영 원두 확정 필요)
6. 원두명 철자: Tres Dragons / Kenya Gathaithi (확인 필요)

## 디자인 자산 (재현 방식)
- 폰트: 원본은 아웃라인 처리되어 추출 불가 → **Playfair Display**(영문) + **Pretendard**(한글)로 매칭
- 로고: `reference/*.svg`에 원본 벡터 보관. `Viyace` 워드마크 정밀 추출은 후속 작업
