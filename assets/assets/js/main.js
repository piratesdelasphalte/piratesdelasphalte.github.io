// Pirates de l’Asphalte — main.js

// Year footer
document.getElementById("year").textContent = new Date().getFullYear();

// Menu mobile
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
menuBtn?.addEventListener("click", () => {
  nav.classList.toggle("open");
  const opened = nav.classList.contains("open");
  menuBtn.setAttribute("aria-label", opened ? "Fermer le menu" : "Ouvrir le menu");
  menuBtn.innerHTML = opened
    ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Fermer'
    : '<i class="fa-solid fa-bars" aria-hidden="true"></i> Menu';
});

// Dropdown Services mobile
const servicesDropdown = document.getElementById("servicesDropdown");
const servicesBtn = servicesDropdown?.querySelector(".dropbtn");
servicesBtn?.addEventListener("click", (e) => {
  if (window.matchMedia("(max-width: 860px)").matches) {
    e.preventDefault();
    servicesDropdown.classList.toggle("open");
    const opened = servicesDropdown.classList.contains("open");
    servicesBtn.setAttribute("aria-expanded", opened ? "true" : "false");
  }
});
servicesDropdown?.querySelectorAll(".dropdown-menu a")?.forEach(a => {
  a.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 860px)").matches) {
      servicesDropdown.classList.remove("open");
      servicesBtn?.setAttribute("aria-expanded", "false");
    }
  });
});

// ===============================
// FORM PRO: Formspree + UTM
// ===============================
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xeeajpgy";
const form = document.getElementById("quoteForm");
const submitBtn = document.getElementById("submitBtn");

// UTM: capture depuis l'URL
function fillUtmFields(){
  const p = new URLSearchParams(window.location.search);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };

  set("utm_source",   p.get("utm_source"));
  set("utm_medium",   p.get("utm_medium"));
  set("utm_campaign", p.get("utm_campaign"));
  set("utm_term",     p.get("utm_term"));
  set("utm_content",  p.get("utm_content"));
  set("referrer",     document.referrer || "");
}
fillUtmFields();

// Coupon: n'importe quel code est valide (sans afficher le code)
const couponInput = document.getElementById("coupon");
const couponStatus = document.getElementById("couponStatus");

function getCouponResult(){
  const entered = (couponInput?.value || "").trim();
  if (!entered) return { applied:false, code:"" };
  return { applied:true, code:entered };
}

function renderCouponStatus(){
  const res = getCouponResult();
  if (!res.code){
    couponStatus.innerHTML = `
      <i class="fa-solid fa-tag" aria-hidden="true" style="color:var(--accent);"></i>
      <span>Ajoute un code promo si applicable.</span>
    `;
    return;
  }
  couponStatus.innerHTML = `
    <i class="fa-solid fa-circle-check ok" aria-hidden="true"></i>
    <span><strong>Code promo appliqué ✅</strong></span>
  `;
}
couponInput?.addEventListener("input", renderCouponStatus);
renderCouponStatus();

// Référence: dropdown + champ texte
const sellerSelect = document.getElementById("sellerSelect");
const sellerName = document.getElementById("sellerName");

function toggleSellerInput(){
  const show = (sellerSelect?.value === "Saisir");
  if (sellerName) sellerName.style.display = show ? "block" : "none";
  if (!show && sellerName) sellerName.value = "";
}
function getSellerValue(){
  const v = sellerSelect?.value || "Site web";
  if (v === "Saisir") {
    const typed = (sellerName?.value || "").trim();
    return typed ? typed : "—";
  }
  return v;
}
sellerSelect?.addEventListener("change", toggleSellerInput);
toggleSellerInput();

// Validation + UI
const formError = document.getElementById("formError");
const formSuccess = document.getElementById("formSuccess");
function show(el){ el?.classList.add("show"); }
function hide(el){ el?.classList.remove("show"); }

function clearFieldError(el, errId){
  el?.classList.remove("field-error");
  const box = document.getElementById(errId);
  if (box) { box.style.display = "none"; box.textContent = ""; }
}
function setFieldError(el, errId, msg){
  el?.classList.add("field-error");
  const box = document.getElementById(errId);
  if (box) { box.style.display = "block"; box.textContent = msg; }
}
function focusField(el){
  try { el?.focus(); el?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch(e) {}
}

function validateRequired(){
  hide(formError); hide(formSuccess);

  const nameEl = document.getElementById("name");
  const phoneEl = document.getElementById("phone");
  const serviceEl = document.getElementById("service");
  const cityEl = document.getElementById("city");
  const detailsEl = document.getElementById("details");

  clearFieldError(nameEl, "err-name");
  clearFieldError(phoneEl, "err-phone");
  clearFieldError(serviceEl, "err-service");
  clearFieldError(cityEl, "err-city");
  clearFieldError(detailsEl, "err-details");

  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  const service = serviceEl.value;
  const city = cityEl.value.trim();
  const details = detailsEl.value.trim();

  if (!name){ show(formError); setFieldError(nameEl, "err-name", "Nom* est obligatoire."); focusField(nameEl); return null; }
  if (!phone){ show(formError); setFieldError(phoneEl, "err-phone", "Téléphone* est obligatoire."); focusField(phoneEl); return null; }
  if (!service){ show(formError); setFieldError(serviceEl, "err-service", "Service* est obligatoire."); focusField(serviceEl); return null; }
  if (!city){ show(formError); setFieldError(cityEl, "err-city", "Ville / secteur* est obligatoire."); focusField(cityEl); return null; }
  if (!details){ show(formError); setFieldError(detailsEl, "err-details", "Détails* est obligatoire."); focusField(detailsEl); return null; }

  return { name, phone, service, city, details };
}

const mapErr = { name: "err-name", phone: "err-phone", service: "err-service", city: "err-city", details: "err-details" };
["name","phone","service","city","details"].forEach((id) => {
  const el = document.getElementById(id);
  const errId = mapErr[id];
  const clear = () => {
    hide(formError);
    el?.classList.remove("field-error");
    const box = document.getElementById(errId);
    if (box) { box.style.display = "none"; box.textContent = ""; }
  };
  el?.addEventListener("input", clear);
  el?.addEventListener("change", clear);
});

function setSubmitting(isSubmitting){
  if (!submitBtn) return;
  submitBtn.disabled = isSubmitting;
  submitBtn.innerHTML = isSubmitting
    ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Envoi en cours...'
    : '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Envoyer la demande';
}

async function postToFormspree(payload){
  const fd = new FormData();
  Object.entries(payload).forEach(([k,v]) => fd.append(k, v ?? ""));
  fd.append("_subject", `Demande de soumission - ${payload.service || "Service"}`);

  const res = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: { "Accept": "application/json" },
    body: fd
  });

  let data = null;
  try { data = await res.json(); } catch(e) {}

  if (!res.ok) {
    const msg =
      (data && data.errors && data.errors[0] && data.errors[0].message)
        ? data.errors[0].message
        : "Impossible d’envoyer pour le moment. Réessaie ou appelle-nous.";
    throw new Error(msg);
  }
  return data;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Honeypot anti-spam
  const trap = document.getElementById("website");
  if (trap && trap.value.trim() !== "") {
    show(formSuccess);
    form.reset();
    renderCouponStatus();
    toggleSellerInput();
    return;
  }

  const data = validateRequired();
  if (!data) return;

  // Re-capture UTM au submit
  fillUtmFields();

  const { name, phone, service, city, details } = data;
  const reference = getSellerValue();
  const couponRes = getCouponResult();

  const payload = {
    name, phone, service, city, details,
    reference,
    coupon: couponRes.code || "-",
    rabais: couponRes.applied ? "appliqué" : "-",
    utm_source: document.getElementById("utm_source")?.value || "",
    utm_medium: document.getElementById("utm_medium")?.value || "",
    utm_campaign: document.getElementById("utm_campaign")?.value || "",
    utm_term: document.getElementById("utm_term")?.value || "",
    utm_content: document.getElementById("utm_content")?.value || "",
    referrer: document.getElementById("referrer")?.value || "",
    source: "site_web_piratesdelasphalte",
    page: window.location.href,
    userAgent: navigator.userAgent
  };

  hide(formError); hide(formSuccess);
  setSubmitting(true);

  try {
    await postToFormspree(payload);

    // GA4 event (gtag vient du snippet GA4 dans index.html)
    try {
      gtag('event', 'lead_submit', {
        service: service,
        city: city,
        utm_source: payload.utm_source,
        utm_campaign: payload.utm_campaign,
        reference: reference,
        transport_type: 'beacon'
      });
    } catch(e) {}

    show(formSuccess);
    form.reset();
    renderCouponStatus();
    toggleSellerInput();

    try { formSuccess.scrollIntoView({ behavior: "smooth", block: "center" }); } catch(e) {}
  } catch (err) {
    show(formError);
    const msg = (err && err.message) ? err.message : "Erreur lors de l’envoi. Réessaie ou appelle-nous.";
    formError.querySelector("div").innerHTML = `<strong>Oups.</strong> ${msg}`;
  } finally {
    setSubmitting(false);
  }
});
