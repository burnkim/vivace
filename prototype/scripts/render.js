/* =====================================================================
   Vivace Menu — Rendering engine (prototype)
   Pure functions: menu data -> HTML. The SAME helpers power every layout,
   which is what keeps the 5 outputs visually consistent ("systematized").
   ===================================================================== */

const price = (n) => Number(n).toFixed(1);

function badge(type) {
  if (!type) return "";
  const label = type === "best" ? "Best" : type === "signature" ? "signature" : type;
  return `<span class="badge badge--${type}">${label}</span>`;
}

/* A simple menu item row: EN  KR  [badge]  ......  price */
function itemRow(it, { withDesc = false } = {}) {
  const takeout = it.takeout
    ? `<span class="item__takeout">take out<br>${price(it.takeout)}</span>` : "";
  const desc = withDesc && it.desc
    ? `<div class="item__desc">${it.desc}</div>` : "";
  return `
    <div class="item ${withDesc && it.desc ? "item--desc" : ""}">
      <div class="item__main">
        <span class="item__en">${it.en}</span>
        <span class="item__kr">${it.kr}</span>
        ${badge(it.badge)}
      </div>
      <div class="item__price">${price(it.price)}${takeout}</div>
      ${desc}
    </div>`;
}

function sectionHead(title, sub, withBadge) {
  return `
    <div class="section__head">
      <div class="section__title">${title}${withBadge ? " " + badge(withBadge) : ""}</div>
      ${sub ? `<div class="section__sub">${sub}</div>` : ""}
    </div>`;
}

/* Espresso / Tea / Beverage / Dessert generic section */
function genericSection(sec, { withDesc = false, className = "" } = {}) {
  const rows = sec.items.map((it) => itemRow(it, { withDesc })).join("");
  const foot = sec.footnotes
    ? `<div class="footnotes">${sec.footnotes.map((f) => `<div>&#8744; ${f}</div>`).join("")}</div>`
    : "";
  return `<div class="section ${className}">${sectionHead(sec.label, sec.sublabel)}${rows}${foot}</div>`;
}

/* Hand drip — short descriptor variant (used by A4.All) */
function dripShort(hd) {
  const rows = hd.items.filter((b) => b.on).map((b) => `
    <div class="drip">
      <div class="drip__head">
        <span class="drip__name">${b.origin} ${b.name} <span class="drip__process">${b.process}</span></span>
        <span class="drip__price">${price(b.price)}</span>
      </div>
      <div class="drip__short">${b.shortDesc || ""}</div>
    </div>`).join("");
  return `
    <div class="section">
      ${sectionHead(hd.label, hd.sublabelShort, hd.badge)}
      ${rows}
      <div class="note-inline">&#8744; ${hd.footnoteShort}</div>
    </div>`;
}

/* Hand drip — long poetic variant (used by A4.R / A3.R) */
function dripLong(hd) {
  return hd.items.filter((b) => b.on).map((b) => `
    <div class="drip">
      <div class="drip__head">
        <span class="drip__name">${b.origin} ${b.name} <span class="drip__process">${b.process}</span></span>
        <span class="drip__price">${price(b.price)}</span>
      </div>
      <div class="drip__headline">"${b.headline}"</div>
      <div class="drip__long">${b.longDesc}</div>
    </div>`).join("");
}

function roast(brand) {
  return `
    <div class="roast">
      <div class="roast__lead">${brand.roastingNote.lead}</div>
      <div class="roast__sub">${brand.roastingNote.sub}</div>
    </div>`;
}

/* ---------- Layout composers ---------- */

function layoutA4All(menu) {
  return `
    <div class="page size-a4">
      <div class="wordmark">${menu.brand.wordmark}</div>
      <div class="cols">
        <div class="col">
          ${genericSection(menu.espresso)}
          ${genericSection(menu.beverage, { withDesc: true, className: "section--beverage" })}
        </div>
        <div class="col">
          ${dripShort(menu.handdrip)}
          ${genericSection(menu.tea, { withDesc: true })}
          ${genericSection(menu.dessert, { withDesc: true })}
        </div>
      </div>
      ${roast(menu.brand)}
    </div>`;
}

const LAYOUTS = { "A4.All": layoutA4All };

async function main() {
  const menu = await fetch("../data/menu.json").then((r) => r.json());
  const which = document.body.dataset.layout || "A4.All";
  document.getElementById("stage").innerHTML = LAYOUTS[which](menu);
}
main();
