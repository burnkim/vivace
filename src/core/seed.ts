import type {
  BadgeDef,
  Bean,
  Block,
  FontDef,
  GroupBlock,
  HandDripBlock,
  MenuDocument,
  MenuItem,
  Page,
  SectionBlock,
  TextBlock,
  WordmarkBlock,
} from "./types";
import { DEFAULT_TOKENS, PAPER_SCALE } from "./tokens";

let _n = 0;
const id = (p: string) => `${p}-${++_n}`;

const item = (nameEn: string, nameKr: string, price: string, extra: Partial<MenuItem> = {}): MenuItem => ({
  id: id("it"),
  nameEn,
  nameKr,
  price,
  ...extra,
});

const bean = (nameEn: string, price: string, headCopy: string, desc: string, grade?: string): Bean => ({
  id: id("bn"),
  nameEn,
  grade,
  price,
  headCopy,
  desc,
});

/* --------------------------------------------------------------- content -- */

const coffee = (): SectionBlock => ({
  id: id("sec"),
  type: "section",
  name: "Coffee",
  titleEn: "Coffee",
  titleSub: "Espresso Base",
  note: "⊻ 디카페인 변경 가능합니다.\n⊻ 아메리카노 테이크아웃 : 3.5\n⊻ 샷 추가 + 1.0",
  items: [
    item("Espresso", "에스프레소", "4.0"),
    item("Americano", "아메리카노", "4.0"),
    item("Cremoso", "크레모소", "4.0"),
    item("Machiato", "마끼아또", "4.5"),
    item("Bola", "볼라", "4.5", { badge: "signature" }),
    item("Flat White", "플랫 화이트", "4.5"),
    item("Cappuccino", "카푸치노", "4.5"),
    item("Cafe Latte", "카페라떼", "4.5", { badge: "best" }),
    item("Caramel Machiato", "카라멜 마끼아또", "5.0"),
    item("Saigon Latte", "사이공 라떼", "5.0"),
    item("Vanilla Latte", "수제 바닐라 라떼", "5.0"),
    item("Soy Latte", "소이 라떼", "5.0"),
  ],
});

const tea = (): SectionBlock => ({
  id: id("sec"),
  type: "section",
  name: "Tea",
  titleEn: "Tea",
  titleSub: "Hot / Ice",
  items: [
    item("Cool Herb", "쿨 허브 티", "5.5", { desc: "감초의 단맛, 페퍼민트, 레몬그라스의 화사함" }),
    item("Just Fruit", "저스트 프룻 티", "5.5", { desc: "수레국화 꽃잎, 포도, 로즈힙, 딸기, 새콤달콤" }),
    item("Sandle Baram", "산들바람 티", "5.5", { desc: "그린 루이보스 베이스, 복합적, 상큼함" }),
    item("Pink Cloud", "분홍구름 티", "5.5", { desc: "백차의 가볍고 섬세한 맛, 열대과일의 상큼함" }),
  ],
});

const beverage = (): SectionBlock => ({
  id: id("sec"),
  type: "section",
  name: "Beverage",
  titleEn: "Beverage",
  items: [
    item("London Fog", "런던 포그 티", "5.5", { desc: "베르가못 향의 얼그레이에 따뜻한 우유" }),
    item("Kalona Cocoa", "깔로나 코코아", "5.5", { desc: "Extra 100% 코코아" }),
    item("Fresh Lemon Ade", "착즙 레몬 에이드", "5.5", { desc: "생레몬을 직접 착즙한 상큼한 에이드" }),
    item("Vivace Milky Soda", "비바체 밀키 소다", "5.5", { desc: "건강한 밀키스" }),
  ],
});

const dessert = (): SectionBlock => ({
  id: id("sec"),
  type: "section",
  name: "Dessert",
  titleEn: "Dessert",
  items: [item("Vivace Cheese Cake", "비바체 수제 치즈 케이크", "5.0", { desc: "첨가물을 넣지 않은 치즈 듬뿍 수제 케이크" })],
});

const blendBox = (label: string, body: string): TextBlock => ({
  id: id("txt"),
  type: "text",
  name: label,
  text: `${label}\n${body}`,
  style: {
    borderWidth: 2.6,
    paddingTop: 30,
    paddingRight: 36,
    paddingBottom: 30,
    paddingLeft: 36,
    fontSize: 24,
    lineHeight: 1.55,
  },
});

const blendA = () =>
  blendBox(
    "[A] Blend",
    "초콜릿과 홍차 사이의 은은한 쌉싸래함이 먼저 다가오고 뒤이어 구운 땅콩과 아몬드의 고소함, 살짝 올라오는 꿀의 단맛이 조화롭게 어우러집니다. 묵직한 볼륨감과 바디감, 그리고 끝까지 이어지는 여운과 감칠맛이 특징인 산미없는 원두.",
  );
const blendB = () =>
  blendBox(
    "[B] Blend",
    "고소함과 둥근 산미가 밸런스있고 적당한 볼륨감과 맛의 흐름이 이어지는 재미있는 구조의 풍미가 매력적인 블렌드. 좋은 향미와 오일리한 바디감 그리고 마일드하고 부드러운 마무리가 특징입니다.",
  );

const handdrip = (variant: "detailed" | "compact"): HandDripBlock => ({
  id: id("hd"),
  type: "handdrip",
  name: "Filter Coffee",
  titleEn: "Filter Coffee",
  titleSub: "Hot / Ice",
  badge: "best",
  variant,
  footerNote:
    "비바체에서는 생두가 가진 텍스쳐, 과즙의 단맛, 볼륨감의 밸런스에 집중해서 로스팅하고 있습니다.\n로스팅 날짜 기준 17~20일 이후, 원두 컨디션에 따라 폐기 처리합니다.",
  beans: [
    bean("Peru El Diamante Geisha", "6.5", "입안에 피어나는 맑고 화사한 아카시아꽃", "우아한 향기가 열리는 195도의 찰나를 온전히 담아냈습니다. 은은한 아카시아향과 꿀의 늬앙스를 즐겨보세요.", "Washed"),
    bean("Colombia Campo Hermoso Caturra", "6.5", "코끝을 스치는 폭발적인 트로피컬 넥타", "밀려오는 짙은 열대과일 향기가 먼저 감각을 자극합니다. 밝게 떨어지는 단맛의 기분 좋은 자극을 경험해 보세요.", "Passion Fruits"),
    bean("Ethiopia Yirgacheffe Gersi G1", "6.5", "입안 가득 번지는 햇살을 머금은 보라빛 포도", "화사한 들꽃 향기와, 입술을 적시는 달콤한 와인의 풍미가 매혹적입니다. 햇살 아래 바짝 말려 농축된 깊은 단맛이 아주 부드럽고 우아한 여운을 남깁니다.", "Natural"),
    bean("Colombia Tres Dragons", "6.5", "라즈베리를 띄운 향긋한 위스키 한 잔", "첫 모금에 피어나는 붉은 라즈베리 과즙 뒤로, 초콜릿과 위스키의 깊은 풍미가 우아하게 중심을 잡아줍니다. 카모마일의 은은한 향기가 기분 좋은 위로를 건네는 매혹적인 커피입니다.", "Natural"),
    bean("Ethiopia Guji Dimtu G1", "6.0", "코코아 파우더를 듬뿍 얹은 부드러운 블루베리 트러플", "입안을 포근하게 감싸는 파우더리한 초콜릿 질감이 아주 매력적입니다. 튀지 않는 단정한 산미와 짙은 고소함 속에서, 은은하게 피어나는 블루베리의 향기가 기분 좋은 감칠맛을 선사합니다.", "Natural"),
    bean("Kenya Gathaithi Nyeri AA", "6.0", "오랜 열기가 응축된 묵직함, 그리고 생기 넘치는 블루베리", "가볍게 스쳐 가는 맛이 아닌, 입안에 깊고 진하게 남는 바디감. 정성스러운 뜸 들이기가 완성한 묵직한 달콤함 속에서 톡 터지는 과즙의 매력을 만끽해 보세요.", "Full Washed"),
  ],
});

const roastingNote = (): TextBlock => ({
  id: id("txt"),
  type: "text",
  name: "Roasting note",
  text: "비바체에서는 생두가 가진 텍스쳐, 과즙의 단맛, 볼륨감의 밸런스에 집중해서 로스팅하고 있습니다.\n로스팅 날짜 기준 17~20일 이후, 원두 컨디션에 따라 폐기 처리합니다.",
  style: { fontSize: 22, textAlign: "right", color: "#6b6b6b", lineHeight: 1.5 },
});

const wordmark = (artVariant: "text" | "symbol" = "text"): WordmarkBlock => ({
  id: id("wm"),
  type: "wordmark",
  name: artVariant === "symbol" ? "Symbol" : "Wordmark",
  text: "Vivace",
  artVariant,
  style: { marginBottom: 40 },
});

const group = (children: Block[], style: GroupBlock["style"], name?: string): GroupBlock => ({
  id: id("grp"),
  type: "group",
  name,
  style,
  children,
});

/* ----------------------------------------------------------------- pages -- */

/** Main menu page (espresso/tea/beverage/dessert + blend boxes). */
function mainRoot(): GroupBlock {
  return group(
    [
      wordmark("text"),
      group(
        [
          group([coffee()], { width: "fill", grow: 1 }, "왼쪽 단"),
          group([tea(), beverage(), dessert()], { width: "fill", grow: 1 }, "오른쪽 단"),
        ],
        { direction: "row", align: "start" },
        "본문 2단",
      ),
      group([blendA(), blendB()], { direction: "row", marginTop: 40 }, "블렌드 박스"),
    ],
    { direction: "column", height: "fill" },
    "페이지 루트",
  );
}

/** Hand-drip detail page. */
function handDripRoot(): GroupBlock {
  return group(
    [wordmark("symbol"), handdrip("detailed"), group([roastingNote()], { marginTop: 40, justify: "end" }, "하단")],
    { direction: "column", height: "fill" },
    "페이지 루트",
  );
}

/** Everything-on-one-sheet page. */
function allRoot(): GroupBlock {
  return group(
    [
      wordmark("text"),
      group(
        [
          group([coffee(), beverage()], { width: "fill", grow: 1 }, "왼쪽 단"),
          group([handdrip("compact"), tea(), dessert()], { width: "fill", grow: 1 }, "오른쪽 단"),
        ],
        { direction: "row", align: "start" },
        "본문 2단",
      ),
    ],
    { direction: "column", height: "fill" },
    "페이지 루트",
  );
}

const page = (
  pid: string,
  name: string,
  paper: Page["paper"],
  scale: number,
  root: GroupBlock,
  margin = { top: 150, right: 130, bottom: 150, left: 130 },
): Page => ({ id: pid, name, paper, orientation: "portrait", scale, margin, root });

const BADGES: BadgeDef[] = [
  { id: "best", label: "Best", bg: "#111111", fg: "#ffffff", shape: "pill" },
  { id: "signature", label: "signature", bg: "#111111", fg: "#ffffff", shape: "pill" },
];

const FONTS: FontDef[] = [
  { id: "f-playfair", family: "Playfair Display", role: "display", source: "google" },
  { id: "f-pretendard", family: "Pretendard", role: "body", source: "custom" },
  { id: "f-cormorant", family: "Cormorant Garamond", role: "display", source: "google" },
  { id: "f-eb-garamond", family: "EB Garamond", role: "display", source: "google" },
  { id: "f-bodoni", family: "Bodoni Moda", role: "display", source: "google" },
  // Korean faces (for tokens.fonts.kr — Hangul rendering)
  { id: "f-noto-serif-kr", family: "Noto Serif KR", role: "display", source: "google" },
  { id: "f-nanum-myeongjo", family: "Nanum Myeongjo", role: "display", source: "google" },
  { id: "f-gowun-batang", family: "Gowun Batang", role: "display", source: "google" },
];

export function makeSeedDocument(): MenuDocument {
  _n = 0;
  return {
    id: "vivace",
    name: "Vivace",
    schemaVersion: 3,
    tokens: structuredClone(DEFAULT_TOKENS),
    fonts: structuredClone(FONTS),
    badges: structuredClone(BADGES),
    pages: [
      page("a4all", "A4 전체", "a4", PAPER_SCALE.a4, allRoot()),
      page("a4l", "A4 좌 (메인)", "a4", PAPER_SCALE.a4, mainRoot()),
      page("a4r", "A4 우 (핸드드립)", "a4", PAPER_SCALE.a4, handDripRoot()),
      { ...page("a3l", "A3 좌 (메인)", "a3", PAPER_SCALE.a3, group([], undefined, "(A4 좌 미러)")), mirror: "a4l" },
      { ...page("a3r", "A3 우 (핸드드립)", "a3", PAPER_SCALE.a3, group([], undefined, "(A4 우 미러)")), mirror: "a4r" },
    ],
  };
}
