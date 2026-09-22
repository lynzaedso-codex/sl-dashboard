// Shared field-parsing helpers. Lark Bitable stores the same logical value in
// several different JSON shapes depending on field type (plain string/number,
// {text}, [{text}], [string], [{name,email,...}]) — these normalize any of
// them down to a plain JS value.

export function asText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object") return v.text ?? v.name ?? "";
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") return value.text ?? value.name ?? "";
  return String(value);
}

export function asNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const text = asText(value).replace(/,/g, "").trim();
  const n = parseFloat(text);
  return Number.isFinite(n) ? n : 0;
}

// Strips Vietnamese diacritics and lowercases, so keyword matching survives
// spelling variants ("Lọc Asin" / "loc asin" / "LỌC ASIN") without needing a
// full accent map for every keyword list.
export function normalizeVN(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function asBool(value) {
  if (typeof value === "boolean") return value;
  const t = asText(value).trim().toLowerCase();
  return t === "true" || t === "1" || t === "yes" || t === "done";
}

// Lark date fields are epoch-ms numbers when populated via the date picker.
// Some legacy sheets store dates as free text ("dd/mm/yyyy" or "d/m/yyyy") —
// fall back to parsing that shape before giving up.
export function asDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return new Date(value);
  const text = asText(value).trim();
  if (!text) return null;

  const numeric = Number(text);
  if (Number.isFinite(numeric) && text.length >= 10) return new Date(numeric);

  const m = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    const parsed = new Date(Number(y), Number(mo) - 1, Number(d));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function monthKey(date) {
  if (!date) return "Unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key) {
  if (key === "Unknown") return "Không rõ";
  const [y, m] = key.split("-");
  return `T${Number(m)}/${y.slice(2)}`;
}

// Team week runs Friday through Thursday (not the ISO Mon-Sun) — members
// load data and review Wed afternoon/Thu, so the week boundary matches that
// cadence. Returns the Friday that starts the week containing `date`, at
// local midnight.
export function weekStartOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const daysSinceFriday = (day - 5 + 7) % 7;
  const friday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceFriday);
  friday.setHours(0, 0, 0, 0);
  return friday;
}

export function weekKey(date) {
  if (!date) return "Unknown";
  const f = weekStartOf(date);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

export function weekLabel(key) {
  if (key === "Unknown") return "Không rõ";
  const [, m, d] = key.split("-");
  return `Tuần ${d}/${m}`;
}

// Groups `rows` by `keyFn(row)`, summing the numeric fields named in
// `sumFields` and always tracking a `count`. Returns a plain object keyed by
// group key, sorted the way `Object.keys` naturally returns unless the
// caller re-sorts (month keys sort correctly as strings; label keys don't).
export function groupBy(rows, keyFn, sumFields = []) {
  const groups = {};
  for (const row of rows) {
    const key = keyFn(row) || "Unknown";
    if (!groups[key]) {
      groups[key] = { key, count: 0 };
      for (const f of sumFields) groups[key][f] = 0;
    }
    groups[key].count += 1;
    for (const f of sumFields) groups[key][f] += row[f] || 0;
  }
  return groups;
}

export function sortedEntries(groups, sortBy = "count", dir = "desc") {
  const arr = Object.values(groups);
  arr.sort((a, b) => (dir === "desc" ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]));
  return arr;
}

export function topN(groups, n = 8, sortBy = "count") {
  return sortedEntries(groups, sortBy, "desc").slice(0, n);
}
