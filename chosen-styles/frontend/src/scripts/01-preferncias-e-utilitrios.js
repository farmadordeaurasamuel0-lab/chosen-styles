/* ===== Preferências e utilitários ===== */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const unitPrice = p => p.promo ?? p.price;
const SIZES = ["P", "M", "G", "GG"];
const SPEC_LABELS = { material: "Material", modelagem: "Modelagem", cuidados: "Cuidados" };
const $ = id => document.getElementById(id);
