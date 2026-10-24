export const PALETTE = {
  cream: "#F5E6C8",
  peach: "#F2A96E",
  brown: "#7B4A1E",
  darkBrown: "#2B1A0E",
};
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
const rect = (x, y, w, h, c) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const cache = new Map();
function draw(type, state) {
  const burnt = state === "burnt",
    raw = state === "raw";
  const dark = burnt ? "#130E0B" : "#7B4A1E";
  let art = "";
  if (type === "rice") {
    art = `<path d="M3 24v-8h3v-5h4V7h12v4h4v5h3v8h-3v3H6v-3Z" fill="${dark}"/><path d="M5 22v-6h4v-5h4V9h8v4h4v5h2v5H9v-1Z" fill="${burnt ? "#493022" : raw ? "#DDC69A" : "#FFF5D9"}"/>`;
    art += rect(8, 23, 18, 2, burnt ? "#251912" : "#D8AB68");
    [
      [11, 12],
      [17, 11],
      [21, 15],
      [8, 18],
      [14, 17],
      [19, 20],
      [23, 21],
      [11, 21],
    ].forEach(([x, y]) => {
      art += rect(x, y, 2, 1, burnt ? "#97704C" : "#BA8A4D");
    });
    art += rect(13, 10, 3, 1, burnt ? "#493022" : "#FFFBEA");
  } else if (type === "egg") {
    art = `<path d="M3 15h3v-4h5V8h8v3h6v4h4v9h-4v3H10v-2H4v-4H2v-4h1Z" fill="${dark}"/><path d="M5 16h3v-4h5v-2h5v3h6v4h3v6h-4v2H11v-2H6v-3H4v-3h1Z" fill="${burnt ? "#60432C" : "#FFF5D9"}"/><path d="M12 15h3v-2h6v3h2v6h-3v2h-7v-3h-2v-4h1Z" fill="${burnt ? "#251912" : "#E9A329"}"/>`;
    art +=
      rect(14, 15, 6, 5, burnt ? "#3A271B" : "#F8CC4B") +
      rect(14, 15, 3, 2, burnt ? "#60432C" : "#FFF0A0") +
      rect(7, 21, 2, 1, "#C18848") +
      rect(23, 19, 2, 2, "#C18848");
  } else {
    const colors = {
      tapa: ["#CE8664", "#A4512B", "#864321"],
      tocino: ["#ED9A82", "#D55C3C", "#B5422C"],
      longganisa: ["#D9A16C", "#B36737", "#9B4A29"],
    };
    const c = burnt
      ? "#302018"
      : colors[type][raw ? 0 : state === "cooking" ? 1 : 2];
    art =
      type === "longganisa"
        ? `<path d="M5 9h7v3h2v12h-2v3H5v-3H3V12h2Zm15 0h7v3h2v12h-2v3h-7v-3h-2V12h2Z" fill="${dark}"/>${rect(5, 12, 7, 11, c)}${rect(20, 12, 7, 11, c)}`
        : `<path d="M3 12h4V9h15v3h5v3h3v8h-4v4H10v-2H4v-4H2v-6h1Z" fill="${dark}"/><path d="M5 14h4v-3h12v3h5v3h2v5h-4v3H11v-2H6v-3H4v-4h1Z" fill="${c}"/>`;
    const shine = burnt ? "#60432C" : type === "tocino" ? "#F6B078" : "#DC9B61";
    art +=
      rect(7, 14, 5, 2, shine) +
      rect(8, 16, 2, 2, shine) +
      rect(20, 20, 5, 2, shine);
    if (!raw)
      [11, 16, 21].forEach((x) => {
        art += rect(x, 16, 2, 7, burnt ? "#130E0B" : "#582A19");
      });
  }
  return svg(art);
}
for (const type of ["rice", "egg", "tapa", "tocino", "longganisa"])
  for (const state of ["raw", "cooking", "cooked", "burnt"])
    cache.set(`${type}:${state}`, draw(type, state));
export const foodSprite = (type, state = "raw") =>
  cache.get(`${type}:${state}`) || cache.get("tapa:raw");
export const riceSprite = (state = "raw") => foodSprite("rice", state);
export const eggSprite = (state = "raw") => foodSprite("egg", state);
export const meatSprite = (type = "tapa", state = "raw") =>
  foodSprite(type, state);
const coin = svg(
  `<path d="M10 3h12v3h4v4h3v12h-3v4h-4v3H10v-3H6v-4H3V10h3V6h4Z" fill="#7B4A1E"/><path d="M11 5h10v3h4v4h2v8h-3v5h-4v2h-8v-3H7v-4H5v-8h3V8h3Z" fill="#F8CC4B"/>${rect(11, 10, 3, 12, "#BA7A29")}${rect(14, 10, 7, 3, "#BA7A29")}${rect(14, 16, 7, 3, "#BA7A29")}${rect(8, 10, 2, 5, "#FFF0A0")}`,
);
export const coinSVG = () => coin;
const flame = svg(
  '<path d="M5 27v-9h4v-6h4V4h4v8h4v5h5v10h-4v3H9v-3Z" fill="#D55C3C"/><path d="M10 26v-7h4v-6h4v8h4v6h-4v3h-5v-4Z" fill="#F8CC4B"/>',
);
export const flameSVG = () => flame;
const plate = svg(
  '<path d="M7 5h18v3h4v4h3v10h-3v4h-4v3H7v-3H3v-4H0V12h3V8h4Z" fill="#7B4A1E"/><path d="M8 7h16v3h4v3h2v8h-3v3h-4v3H9v-3H5v-3H2v-8h3v-3h3Z" fill="#FFF5D9"/><path d="M10 11h12v2h4v9h-5v2H10v-3H6v-7h4Z" fill="#D8B880"/><path d="M11 13h10v2h3v6h-4v1h-9v-3H8v-4h3Z" fill="#F5E6C8"/>',
);
export const plateSprite = () => plate;
