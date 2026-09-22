import { asText, asNumber, normalizeVN } from "../utils.js";

// Review tables tag the handling CS directly ("Person"/"CS" field) with
// slightly different spellings/emoji per row ("Heny_CS🌿", "Diệu Linh (Nồ)_CS"...) —
// fuzzy-match to the same canonical supporter names CS_MAP uses everywhere else.
function normalizeSupporterName(raw) {
  const t = normalizeVN(asText(raw));
  if (!t) return null;
  if (t.includes("heny")) return "Heny";
  if (t.includes("tracy") || t.includes("bang trang")) return "Băng Trang (Tracy)";
  if (t.includes("dieu linh") || t.includes("linh (no)") || t.includes("no)_cs")) return "Diệu Linh (Nồ)";
  if (t.includes("ai ni")) return "Ái Ni";
  if (t.includes("nguyet")) return "Nguyệt";
  return null;
}

// Negative = 1-2★, matching the "Negative Review Rate" definition in the
// user's Quality Criteria sheet ("% review 1–2★ / tổng reviews").
function isNegative(star) {
  return star >= 1 && star <= 2;
}

// AMZ reviews (Star RV/pcxHealth) have no resolve/recovery tracking — Amazon
// policy doesn't allow asking buyers to edit a review, so there's nothing to
// "recover". Etsy + TikTok both track Contact Customer / Resolve directly —
// read those booleans rather than inferring recovery from anything else.
function tallyResolvable(rows, starField, resolveField, bySupporter) {
  for (const r of rows) {
    const supporter = normalizeSupporterName(r["CS"] ?? r["Person"]);
    if (!supporter) continue;
    const star = asNumber(r[starField]);
    if (!isNegative(star)) continue;
    bySupporter[supporter] = bySupporter[supporter] || { negTotal: 0, negResolved: 0, amzNegTotal: 0 };
    bySupporter[supporter].negTotal += 1;
    if (r[resolveField]) bySupporter[supporter].negResolved += 1;
  }
}

export function analyzeReviewRecovery(amzRows, etsyRows, tiktokRows) {
  const bySupporter = {};

  tallyResolvable(etsyRows, "star_rating", "Resolve", bySupporter);
  tallyResolvable(tiktokRows, "Star RV", "Resolve", bySupporter);

  for (const r of amzRows) {
    const supporter = normalizeSupporterName(r["Person"]);
    if (!supporter) continue;
    const star = asNumber(r["Star RV/pcxHealth"]);
    if (!isNegative(star)) continue;
    bySupporter[supporter] = bySupporter[supporter] || { negTotal: 0, negResolved: 0, amzNegTotal: 0 };
    bySupporter[supporter].amzNegTotal += 1;
  }

  const result = {};
  for (const [supporter, v] of Object.entries(bySupporter)) {
    result[supporter] = {
      negTotal: v.negTotal,
      negResolved: v.negResolved,
      recoveryPct: v.negTotal ? (v.negResolved / v.negTotal) * 100 : null,
      amzNegTotal: v.amzNegTotal,
    };
  }
  return result;
}
