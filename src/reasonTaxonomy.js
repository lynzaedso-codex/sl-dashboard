// Keyword-based classifier for free-text cancel/refund complaints — no LLM
// call (kept out of the pipeline on purpose). First matching category wins,
// so order matters: more specific categories before generic catch-alls.
// Extend this list as new recurring themes show up in real data.
const TAXONOMY = [
  { category: "Không áp được mã giảm giá", keywords: ["mã giảm giá", "discount code", "coupon", "áp mã", "code giảm giá", "voucher", "mã ưu đãi", "apply code"] },
  { category: "Lỗi Sup", keywords: ["sup gửi sai", "sup gửi thiếu", "gửi sai", "gửi thiếu", "in lệch", "lệch in", "sup lỗi", "supplier gửi sai", "thiếu hàng", "sai hàng"] },
  { category: "Hư hỏng / bể vỡ", keywords: ["vỡ", "bể", "hỏng", "hư", "gãy", "damage", "broken"] },
  { category: "Thất lạc giao hàng", keywords: ["thất lạc", "mất hàng", "lost", "chưa nhận được", "không nhận được"] },
  { category: "Lỗi base / chất lượng hoàn thiện", keywords: ["lỗi base", "chất lượng", "lỗi sản xuất", "in lỗi", "sai màu", "lỗi in"] },
  { category: "Thiếu thông tin customization", keywords: ["thiếu thông tin", "thiếu custom", "chưa custom", "thiếu info", "chưa gửi info"] },
  { category: "Thiếu địa chỉ / không liên lạc được", keywords: ["thiếu địa chỉ", "sai địa chỉ", "không liên lạc", "no reply", "không phản hồi", "khong phan hoi"] },
  { category: "Không kịp thời điểm khách cần", keywords: ["trễ", "không kịp", "quá hạn", "late", "trễ event", "trễ ngày"] },
  { category: "Không hài lòng sản phẩm, chưa rõ chi tiết", keywords: ["không hài lòng", "không thích", "k ưng", "không ưng", "not satisfied"] },
  { category: "Khách yêu cầu hủy, chưa rõ nguyên nhân", keywords: ["muốn cc", "muốn hủy", "muốn cancel", "đổi ý", "khách hủy"] },
];

export function classifyReason(detailText) {
  const text = (detailText || "").toLowerCase();
  if (!text.trim()) return "Không có ghi chú";
  for (const { category, keywords } of TAXONOMY) {
    if (keywords.some((kw) => text.includes(kw))) return category;
  }
  return "Khác / chưa phân loại";
}
