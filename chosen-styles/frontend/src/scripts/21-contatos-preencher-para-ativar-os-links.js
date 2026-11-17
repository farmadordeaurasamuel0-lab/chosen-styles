/* ===== Contatos (preencher para ativar os links) ===== */
const CONTACT = {
  instagram: "vitorsamuel_bjj",
  whatsapp: ""
};
const igLink = $("ig-link");
const waLink = $("wa-link");
if (CONTACT.instagram) {
  igLink.href = "https://instagram.com/" + CONTACT.instagram;
  igLink.target = "_blank";
  igLink.rel = "noopener";
  igLink.removeAttribute("aria-disabled");
  igLink.removeAttribute("tabindex");
}
if (CONTACT.whatsapp) {
  waLink.href = "https://wa.me/" + CONTACT.whatsapp;
  waLink.target = "_blank";
  waLink.rel = "noopener";
  waLink.removeAttribute("aria-disabled");
  waLink.removeAttribute("tabindex");
}
