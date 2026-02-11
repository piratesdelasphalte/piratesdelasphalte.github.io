/* =========================================================
   Pirates de l’Asphalte — main.js (ULTRA PREMIUM)
   - No deps, robust, accessible
   - Menu + dropdown mobile
   - Formspree lead form + UTM capture + anti-spam
   - GA4 hooks (gtag if present)
   - Hero slider (no deps)
   ========================================================= */

(() => {
  "use strict";

  /* -------------------- Tiny helpers -------------------- */
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  const safeJSON = (str, fallback = null) => {
    try { return JSON.parse(str); } catch { return fallback; }
  };

  const debounce = (fn, wait = 150) => {
    let t = null;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  };

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scrollToEl = (el) => {
    try { el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" }); } catch {}
  };

  const setText = (el, text) => { if (el) el.textContent = text; };

  /* -------------------- Simple storage (UTM persistence) -------------------- */
  const STORE_KEY = "pda_attrib_v1";
  const now = () => Date.now();

  const storage = {
    get() {
      const raw = localStorage.getItem(STORE_KEY);
      return safeJSON(raw, null);
    },
    set(obj) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch {}
    },
    clear() {
      try { localStorage.removeItem(STORE_KEY); } catch {}
    }
  };

  /* -------------------- GA4 safe wrapper -------------------- */
  const track = (eventName, params = {}) => {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, { ...params, transport_type: "beacon" });
      }
    } catch {}
  };

  /* =========================================================
     1) Footer year
     ========================================================= */
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     2) Mobile menu (accessible)
     Expects:
       #menuBtn, #nav
     Optional: body[data-menu="open"] in CSS
     ========================================================= */
  const menuBtn = qs("#menuBtn");
  const nav = qs("#nav");

  const setMenuState = (open) => {
    if (!nav || !menuBtn) return;

    nav.classList.toggle("open", !!open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");

    // Optional icon swap if you want
    // Keep your HTML structure friendly: <span class="icon"></span><span class="label"></span>
    // If you still use innerHTML icons, keep it safe:
    menuBtn.innerHTML = open
      ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Fermer'
      : '<i class="fa-solid fa-bars" aria-hidden="true"></i> Menu';

    // Close dropdown if menu closes
    if (!open) {
      servicesDropdown?.classList.remove("open");
      servicesBtn?.setAttribute("aria-expanded", "false");
    }
  };

  on(menuBtn, "click", () => {
    const open = !nav?.classList.contains("open");
    setMenuState(open);
  });

  // Close on Escape
  on(document, "keydown", (e) => {
    if (e.key === "Escape" && nav?.classList.contains("open")) setMenuState(false);
  });

  // Close when clicking outside (mobile only)
  on(document, "click", (e) => {
    if (!nav || !menuBtn) return;
    if (!nav.classList.contains("open")) return;

    const isMobile = window.matchMedia("(max-width: 860px)").matches;
    if (!isMobile) return;

    const target = e.target;
    if (target instanceof Element) {
      const insideNav = nav.contains(target);
      const insideBtn = menuBtn.contains(target);
      if (!insideNav && !insideBtn) setMenuState(false);
    }
  });

  /* =========================================================
     3) Services dropdown (mobile only)
     Expects:
       #servicesDropdown .dropbtn .dropdown-menu a
     ========================================================= */
  const servicesDropdown = qs("#servicesDropdown");
  const servicesBtn = servicesDropdown ? qs(".dropbtn", servicesDropdown) : null;

  const setServicesOpen = (open) => {
    if (!servicesDropdown || !servicesBtn) return;
    servicesDropdown.classList.toggle("open", !!open);
    servicesBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  on(servicesBtn, "click", (e) => {
    const isMobile = window.matchMedia("(max-width: 860px)").matches;
    if (!isMobile) return; // on desktop, keep normal hover/click behavior
    e.preventDefault();
    setServicesOpen(!servicesDropdown.classList.contains("open"));
  });

  qsa(".dropdown-menu a", servicesDropdown || document).forEach((a) => {
    on(a, "click", () => {
      const isMobile = window.matchMedia("(max-width: 860px)").matches;
      if (isMobile) setServicesOpen(false);
    });
  });

  /* =========================================================
     4) Attribution (UTM + referrer) + persistence
     - Reads URL params; stores for 30 days
     - Writes into hidden inputs if present
     ========================================================= */
  const ATTR_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

  const readAttributionFromUrl = () => {
    const p = new URLSearchParams(window.location.search);
    const utm = {
      utm_source:   p.get("utm_source")   || "",
      utm_medium:   p.get("utm_medium")   || "",
      utm_campaign: p.get("utm_campaign") || "",
      utm_term:     p.get("utm_term")     || "",
      utm_content:  p.get("utm_content")  || "",
      referrer:     document.referrer || ""
    };

    // If no UTM at all, return null to use stored
    const hasAny =
      utm.utm_source || utm.utm_medium || utm.utm_campaign || utm.utm_term || utm.utm_content;

    return hasAny ? utm : null;
  };

  const getAttribution = () => {
    const fromUrl = readAttributionFromUrl();
    const stored = storage.get();

    // If URL has UTM, overwrite stored with fresh timestamp
    if (fromUrl) {
      const payload = { ...fromUrl, ts: now() };
      storage.set(payload);
      return payload;
    }

    // If stored exists and not expired, use it
    if (stored && stored.ts && (now() - stored.ts) < ATTR_TTL) return stored;

    // Otherwise minimal attribution
    return { utm_source:"", utm_medium:"", utm_campaign:"", utm_term:"", utm_content:"", referrer: document.referrer || "", ts: now() };
  };

  const writeAttributionToFields = () => {
    const a = getAttribution();
    const set = (id, val) => { const el = qs(`#${id}`); if (el) el.value = val || ""; };

    set("utm_source",   a.utm_source);
    set("utm_medium",   a.utm_medium);
    set("utm_campaign", a.utm_campaign);
    set("utm_term",     a.utm_term);
    set("utm_content",  a.utm_content);
    set("referrer",     a.referrer);
  };

  writeAttributionToFields();

  /* =========================================================
     5) Click tracking (optional but premium)
     Add in HTML:
       <a href="tel:..." data-track="phone">...</a>
       <a href="sms:..." data-track="sms">...</a>
       <a href="mailto:..." data-track="email">...</a>
       <a href="#soumission" data-track="cta" data-label="hero-cta">...</a>
     ========================================================= */
  on(document, "click", (e) => {
    const t = e.target instanceof Element ? e.target.closest("[data-track]") : null;
    if (!t) return;

    const kind = t.getAttribute("data-track") || "";
    const label = t.getAttribute("data-label") || (t instanceof HTMLAnchorElement ? t.href : "");

    if (kind === "phone") track("phone_click", { label });
    if (kind === "sms")   track("sms_click",   { label });
    if (kind === "email") track("email_click", { label });
    if (kind === "cta")   track("cta_click",   { label });
  });

  /* =========================================================
     6) Form PRO: Formspree + validation + anti-spam
     Expects:
       #quoteForm, #submitBtn, #formError, #formSuccess
       required: #name #phone #service #city #details
       optional: #website (honeypot)
       optional: coupon: #coupon #couponStatus
       optional: seller: #sellerSelect #sellerName
     ========================================================= */
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xeeajpgy";

  const form = qs("#quoteForm");
  const submitBtn = qs("#submitBtn");
  const formError = qs("#formError");
  const formSuccess = qs("#formSuccess");

  const show = (el) => el?.classList.add("show");
  const hide = (el) => el?.classList.remove("show");

  const setSubmitting = (isSubmitting) => {
    if (!submitBtn) return;
    submitBtn.disabled = !!isSubmitting;
    submitBtn.innerHTML = isSubmitting
      ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Envoi en cours...'
      : '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Envoyer la demande';
  };

  /* ----- Coupon UI ----- */
  const couponInput = qs("#coupon");
  const couponStatus = qs("#couponStatus");

  const getCouponResult = () => {
    const entered = (couponInput?.value || "").trim();
    if (!entered) return { applied:false, code:"" };
    return { applied:true, code:entered };
  };

  const renderCouponStatus = () => {
    if (!couponStatus) return;
    const res = getCouponResult();
    if (!res.code) {
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
  };

  on(couponInput, "input", debounce(renderCouponStatus, 80));
  renderCouponStatus();

  /* ----- Seller / reference ----- */
  const sellerSelect = qs("#sellerSelect");
  const sellerName = qs("#sellerName");

  const toggleSellerInput = () => {
    const showInput = (sellerSelect?.value === "Saisir");
    if (sellerName) sellerName.style.display = showInput ? "block" : "none";
    if (!showInput && sellerName) sellerName.value = "";
  };

  const getSellerValue = () => {
    const v = sellerSelect?.value || "Site web";
    if (v === "Saisir") {
      const typed = (sellerName?.value || "").trim();
      return typed ? typed : "—";
    }
    return v;
  };

  on(sellerSelect, "change", toggleSellerInput);
  toggleSellerInput();

  /* ----- Field errors ----- */
  const clearFieldError = (el, errId) => {
    el?.classList.remove("field-error");
    const box = qs(`#${errId}`);
    if (box) { box.style.display = "none"; box.textContent = ""; }
  };

  const setFieldError = (el, errId, msg) => {
    el?.classList.add("field-error");
    const box = qs(`#${errId}`);
    if (box) { box.style.display = "block"; box.textContent = msg; }
  };

  const normalizePhoneCA = (raw) => {
    // Keep digits only
    const d = String(raw || "").replace(/[^\d]/g, "");
    // Accept 10 digits or 11 starting with 1
    const digits = (d.length === 11 && d.startsWith("1")) ? d.slice(1) : d;
    return digits;
  };

  const isValidPhoneCA = (raw) => {
    const digits = normalizePhoneCA(raw);
    if (digits.length !== 10) return false;
    // basic sanity: area code + exchange cannot start with 0/1
    const a = digits[0], b = digits[3];
    if (a === "0" || a === "1") return false;
    if (b === "0" || b === "1") return false;
    return true;
  };

  const validateRequired = () => {
    hide(formError); hide(formSuccess);

    const nameEl = qs("#name");
    const phoneEl = qs("#phone");
    const serviceEl = qs("#service");
    const cityEl = qs("#city");
    const detailsEl = qs("#details");

    clearFieldError(nameEl, "err-name");
    clearFieldError(phoneEl, "err-phone");
    clearFieldError(serviceEl, "err-service");
    clearFieldError(cityEl, "err-city");
    clearFieldError(detailsEl, "err-details");

    const name = (nameEl?.value || "").trim();
    const phone = (phoneEl?.value || "").trim();
    const service = (serviceEl?.value || "").trim();
    const city = (cityEl?.value || "").trim();
    const details = (detailsEl?.value || "").trim();

    if (!name)    { show(formError); setFieldError(nameEl, "err-name", "Nom* est obligatoire."); scrollToEl(nameEl); return null; }
    if (!phone)   { show(formError); setFieldError(phoneEl, "err-phone", "Téléphone* est obligatoire."); scrollToEl(phoneEl); return null; }
    if (!isValidPhoneCA(phone)) {
      show(formError);
      setFieldError(phoneEl, "err-phone", "Téléphone invalide (ex: 514 123 4567).");
      scrollToEl(phoneEl);
      return null;
    }
    if (!service) { show(formError); setFieldError(serviceEl, "err-service", "Service* est obligatoire."); scrollToEl(serviceEl); return null; }
    if (!city)    { show(formError); setFieldError(cityEl, "err-city", "Ville / secteur* est obligatoire."); scrollToEl(cityEl); return null; }
    if (!details) { show(formError); setFieldError(detailsEl, "err-details", "Détails* est obligatoire."); scrollToEl(detailsEl); return null; }

    return { name, phone, service, city, details };
  };

  // Auto-clear errors on input/change
  const clearMap = {
    "name": "err-name",
    "phone": "err-phone",
    "service": "err-service",
    "city": "err-city",
    "details": "err-details"
  };

  Object.keys(clearMap).forEach((id) => {
    const el = qs(`#${id}`);
    const errId = clearMap[id];
    const clear = () => {
      hide(formError);
      el?.classList.remove("field-error");
      const box = qs(`#${errId}`);
      if (box) { box.style.display = "none"; box.textContent = ""; }
    };
    on(el, "input", clear);
    on(el, "change", clear);
  });

  const postToFormspree = async (payload) => {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));
    fd.append("_subject", `Demande de soumission - ${payload.service || "Service"}`);

    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: fd
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (data && data.errors && data.errors[0] && data.errors[0].message)
          ? data.errors[0].message
          : "Impossible d’envoyer pour le moment. Réessaie ou appelle-nous.";
      throw new Error(msg);
    }
    return data;
  };

  // Anti-spam: minimum time spent on page before submit
  const pageLoadedAt = now();
  const MIN_TIME_MS = 1800; // 1.8s

  on(form, "submit", async (e) => {
    e.preventDefault();
    if (!form) return;

    // Honeypot
    const trap = qs("#website");
    if (trap && (trap.value || "").trim() !== "") {
      // pretend success to bots
      show(formSuccess);
      form.reset();
      renderCouponStatus();
      toggleSellerInput();
      return;
    }

    // Timing gate (bots often submit instantly)
    if ((now() - pageLoadedAt) < MIN_TIME_MS) {
      show(formError);
      const box = formError?.querySelector("div") || formError;
      if (box) box.innerHTML = "<strong>Oups.</strong> Réessaie dans un instant (validation anti-spam).";
      return;
    }

    const data = validateRequired();
    if (!data) return;

    // refresh attribution fields (UTM stored)
    writeAttributionToFields();
    const attrib = getAttribution();

    const { name, phone, service, city, details } = data;
    const reference = getSellerValue();
    const couponRes = getCouponResult();

    const payload = {
      name,
      phone: normalizePhoneCA(phone), // clean digits for your CRM
      phone_raw: phone,               // keep raw too
      service,
      city,
      details,

      reference,
      coupon: couponRes.code || "-",
      rabais: couponRes.applied ? "appliqué" : "-",

      utm_source: attrib.utm_source || "",
      utm_medium: attrib.utm_medium || "",
      utm_campaign: attrib.utm_campaign || "",
      utm_term: attrib.utm_term || "",
      utm_content: attrib.utm_content || "",
      referrer: attrib.referrer || "",

      source: "site_web_piratesdelasphalte",
      page: window.location.href,
      userAgent: navigator.userAgent,
      ts_iso: new Date().toISOString()
    };

    hide(formError); hide(formSuccess);
    setSubmitting(true);

    try {
      await postToFormspree(payload);

      track("lead_submit", {
        service,
        city,
        utm_source: payload.utm_source,
        utm_campaign: payload.utm_campaign,
        reference
      });

      show(formSuccess);
      form.reset();
      renderCouponStatus();
      toggleSellerInput();

      scrollToEl(formSuccess);
    } catch (err) {
      show(formError);
      const msg = (err && err.message) ? err.message : "Erreur lors de l’envoi. Réessaie ou appelle-nous.";
      const box = formError?.querySelector("div") || formError;
      if (box) box.innerHTML = `<strong>Oups.</strong> ${msg}`;
      scrollToEl(formError);
    } finally {
      setSubmitting(false);
    }
  });

7) Hero slider (no deps) — MOBILE + SWIPE (SINGLE INSTANCE)
   Expects:
     .hero-slider
       .hero-slides
         .hero-slide (N)
       .hero-dot   (N) data-go="index"
       .hero-prev / .hero-next
   Optional:
     data-autoplay="true|false"
     data-interval="5200"
   ========================================================= */

const initHeroSliders = () => {
  const sliders = qsa(".hero-slider");
  if (!sliders.length) return;

  sliders.forEach((slider) => {
    const slidesWrap = qs(".hero-slides", slider);
    const slides = qsa(".hero-slide", slider);
    if (!slidesWrap || slides.length <= 1) return;

    const dots    = qsa(".hero-dot", slider);
    const btnPrev = qs(".hero-prev", slider);
    const btnNext = qs(".hero-next", slider);

    let i = 0;
    let timer = null;

    const autoplay =
      slider.getAttribute("data-autoplay") === "true" && !prefersReducedMotion();

    const intervalRaw = parseInt(slider.getAttribute("data-interval") || "5200", 10);
    const interval = clamp(intervalRaw || 5200, 2500, 15000);

    const setActive = (next) => {
      i = (next + slides.length) % slides.length;

      slides.forEach((s, idx) => {
        const active = idx === i;
        s.classList.toggle("is-active", active);
        s.setAttribute("aria-hidden", active ? "false" : "true");
      });

      dots.forEach((d, idx) => {
        const active = idx === i;
        d.classList.toggle("is-active", active);
        d.setAttribute("aria-selected", active ? "true" : "false");
        d.setAttribute("tabindex", active ? "0" : "-1");
      });
    };

    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    const start = () => {
      if (!autoplay) return;
      stop();
      timer = setInterval(() => setActive(i + 1), interval);
    };

    // Buttons
    on(btnPrev, "click", (e) => { e.preventDefault(); setActive(i - 1); start(); });
    on(btnNext, "click", (e) => { e.preventDefault(); setActive(i + 1); start(); });

    // Dots
    dots.forEach((d) => {
      on(d, "click", (e) => {
        e.preventDefault();
        const go = parseInt(d.getAttribute("data-go") || "0", 10);
        if (Number.isFinite(go)) { setActive(go); start(); }
      });
    });

    // Pause on hover/focus
    on(slider, "mouseenter", stop);
    on(slider, "mouseleave", start);
    on(slider, "focusin", stop);
    on(slider, "focusout", start);

    // Keyboard
    slider.setAttribute("tabindex", "0");
    on(slider, "keydown", (e) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); setActive(i - 1); start(); }
      if (e.key === "ArrowRight") { e.preventDefault(); setActive(i + 1); start(); }
    });

    // Swipe (pointer)
    let startX = 0, startY = 0, dragging = false;
    const SWIPE_MIN = 35;
    const SWIPE_MAX_Y = 55;

    const onDown = (x, y) => { startX = x; startY = y; dragging = true; stop(); };
    const onUp = (x, y) => {
      if (!dragging) return;
      dragging = false;

      const dx = x - startX;
      const dy = y - startY;

      // If mostly vertical scroll, ignore swipe
      if (Math.abs(dy) > SWIPE_MAX_Y) { start(); return; }

      if (dx <= -SWIPE_MIN) setActive(i + 1);
      else if (dx >= SWIPE_MIN) setActive(i - 1);

      start();
    };

    on(slidesWrap, "pointerdown", (e) => {
      if (e.target && e.target.closest(".hero-slider-ui")) return;
      try { slidesWrap.setPointerCapture(e.pointerId); } catch {}
      onDown(e.clientX, e.clientY);
    }, { passive: true });

    on(slidesWrap, "pointerup", (e) => onUp(e.clientX, e.clientY), { passive: true });
    on(slidesWrap, "pointercancel", () => { dragging = false; start(); }, { passive: true });

    // Init
    setActive(0);
    start();
  });
};

initHeroSliders();
