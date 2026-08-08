/**
 * Sos Interventi — Consent Mode v2 + GA4 + Google Ads
 *
 * Ads: AW-18330400186
 * Click tel: AW-18330400186/dAXnCJzgr9ocELrrzqRE
 * GA4: G-N643STDFRS
 *
 * Niente numero di inoltro Google (800): sul sito resta SEMPRE 388 809 1482.
 *
 * Click tel ≠ chiamata ricevuta. Max 1 tracking tel/WA per sessione browser.
 *
 * Test GA4:
 * 1) Accetta cookie
 * 2) GA4 → Realtime
 * 3) Click Chiama → eventi tel_click / generate_lead (una sola volta a sessione)
 */
(function () {
  "use strict";

  var CONFIG = {
    adsId: "AW-18330400186",
    /** Click tel — conversione al click su Chiama / tel: */
    conversionSendTo: "AW-18330400186/dAXnCJzgr9ocELrrzqRE",
    /** GA4 — flusso SoS */
    ga4Id: "G-N643STDFRS",
    storageKey: "sos_consent_v1"
  };

  var REAL_TEL = "tel:+393888091482";

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500
  });
  gtag("set", "url_passthrough", true);
  gtag("set", "ads_data_redaction", true);

  function primaryTagId() {
    return CONFIG.ga4Id || CONFIG.adsId || "";
  }

  function readChoice() {
    try {
      return localStorage.getItem(CONFIG.storageKey);
    } catch (e) {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(CONFIG.storageKey, value);
    } catch (e) { /* ignore */ }
  }

  function hasAnalyticsConsent() {
    return readChoice() === "granted";
  }

  function configGa4(extra) {
    if (!CONFIG.ga4Id) return;
    var opts = {
      anonymize_ip: true,
      send_page_view: true
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) opts[k] = extra[k];
      }
    }
    if (/[?&]ga_debug=1(?:&|$)/.test(location.search)) {
      opts.debug_mode = true;
    }
    gtag("config", CONFIG.ga4Id, opts);
  }

  function loadGtag() {
    /*
     * gtag.js è caricato dallo HTML (tag statico subito dopo questo file).
     * Qui solo comandi in coda — niente secondo tag.
     */
    gtag("js", new Date());
    configGa4();
    if (CONFIG.adsId) gtag("config", CONFIG.adsId);
  }

  function applyConsent(granted) {
    var state = granted ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state
    });
    if (granted) {
      configGa4({ send_page_view: true });
      if (CONFIG.adsId) gtag("config", CONFIG.adsId);
    }
  }

  function hideBanner() {
    var el = document.getElementById("cookie-banner");
    if (el) el.hidden = true;
    document.body.classList.remove("cookie-open");
  }

  function showBanner() {
    var el = document.getElementById("cookie-banner");
    if (el) el.hidden = false;
    document.body.classList.add("cookie-open");
  }

  function initBanner() {
    var choice = readChoice();
    if (choice === "granted") {
      applyConsent(true);
      hideBanner();
      return;
    }
    if (choice === "denied") {
      applyConsent(false);
      hideBanner();
      return;
    }
    showBanner();
    var accept = document.getElementById("cookie-accept");
    var refuse = document.getElementById("cookie-refuse");
    if (accept) {
      accept.addEventListener("click", function () {
        saveChoice("granted");
        applyConsent(true);
        hideBanner();
      });
    }
    if (refuse) {
      refuse.addEventListener("click", function () {
        saveChoice("denied");
        applyConsent(false);
        hideBanner();
      });
    }
  }

  /* ——— Tracking Chiama / WhatsApp (best practice) ———
   * - Click ≠ chiamata ricevuta (per le chiamate reali usa anche "Chiamate dagli annunci" in Ads)
   * - Solo listener "click" (niente touchstart → niente doppio conteggio mobile)
   * - Max 1 conversione Ads + 1 tel_click + 1 generate_lead per sessione tab
   * - Solo numero reale 388 809 1482 (ignora tel: strani / spam)
   */
  var TEL_TRACK_KEY = "sos_tel_tracked_v1";
  var WA_TRACK_KEY = "sos_wa_tracked_v1";
  var REAL_TEL_NORM = "tel:+393888091482";

  function sessionAlreadyTracked(key) {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }

  function markSessionTracked(key) {
    try {
      sessionStorage.setItem(key, "1");
    } catch (e) { /* ignore */ }
  }

  function normalizeTelHref(href) {
    return String(href || "")
      .trim()
      .toLowerCase()
      .replace(/[\s\-\u00a0().]/g, "");
  }

  function isOurTelLink(a) {
    if (!a || !a.getAttribute) return false;
    var href = normalizeTelHref(a.getAttribute("href"));
    return href === REAL_TEL_NORM || href === "tel:393888091482";
  }

  function isOurWaLink(a) {
    if (!a || !a.getAttribute) return false;
    var href = a.getAttribute("href") || "";
    return href.indexOf("wa.me/") !== -1 && href.indexOf("393888091482") !== -1;
  }

  function sendGa4Event(name, params) {
    if (!CONFIG.ga4Id || typeof window.gtag !== "function") return;
    if (!hasAnalyticsConsent()) return;
    var payload = params || {};
    payload.send_to = CONFIG.ga4Id;
    payload.transport_type = "beacon";
    gtag("event", name, payload);
  }

  function trackTelConversion(ev) {
    if (ev && typeof ev.button === "number" && ev.button !== 0) return;

    var a = ev.target && ev.target.closest ? ev.target.closest('a[href^="tel:"]') : null;
    if (!isOurTelLink(a)) return;
    if (sessionAlreadyTracked(TEL_TRACK_KEY)) return;
    markSessionTracked(TEL_TRACK_KEY);

    /* Conversione Google Ads — 1 intent di chiamata per sessione */
    if (CONFIG.conversionSendTo && typeof window.gtag === "function") {
      gtag("event", "conversion", {
        send_to: CONFIG.conversionSendTo,
        value: 1.0,
        currency: "EUR",
        transport_type: "beacon"
      });
    }

    /* GA4 — stessi limiti, così lead/user ≈ 1 */
    sendGa4Event("tel_click", {
      event_category: "engagement",
      event_label: "direct",
      link_url: REAL_TEL,
      method: "phone"
    });
    sendGa4Event("generate_lead", {
      currency: "EUR",
      value: 1,
      lead_source: "phone_click"
    });
  }

  function trackWaClick(ev) {
    if (ev && typeof ev.button === "number" && ev.button !== 0) return;

    var a = ev.target && ev.target.closest ? ev.target.closest('a[href*="wa.me/"]') : null;
    if (!isOurWaLink(a)) return;
    if (sessionAlreadyTracked(WA_TRACK_KEY)) return;
    markSessionTracked(WA_TRACK_KEY);

    sendGa4Event("whatsapp_click", {
      event_category: "engagement",
      event_label: "whatsapp",
      method: "whatsapp"
    });
  }

  function bindClicks() {
    document.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        if (t.closest('a[href^="tel:"]')) trackTelConversion(ev);
        else if (t.closest('a[href*="wa.me/"]')) trackWaClick(ev);
      },
      true
    );

    var was = document.querySelectorAll('a[href*="wa.me/"]');
    for (var i = 0; i < was.length; i++) {
      var href = was[i].getAttribute("href") || "";
      if (href.indexOf("393888091482") === -1) {
        was[i].setAttribute("href", "https://wa.me/393888091482");
      }
    }
  }

  window.SosInterventi = {
    config: CONFIG,
    realTel: REAL_TEL,
    hasAnalyticsConsent: hasAnalyticsConsent,
    /** Reset limite sessione + invia eventi test (solo debug) */
    testTelEvent: function () {
      if (!hasAnalyticsConsent()) {
        console.warn("Prima Accetta i cookie.");
        return false;
      }
      try {
        sessionStorage.removeItem(TEL_TRACK_KEY);
      } catch (e) { /* ignore */ }
      sendGa4Event("tel_click", {
        event_category: "engagement",
        event_label: "manual_test",
        method: "phone"
      });
      sendGa4Event("generate_lead", {
        currency: "EUR",
        value: 1,
        lead_source: "manual_test"
      });
      markSessionTracked(TEL_TRACK_KEY);
      console.info("Eventi test inviati a", CONFIG.ga4Id, "— apri GA4 Realtime.");
      return true;
    }
  };

  loadGtag();
  var earlyChoice = readChoice();
  if (earlyChoice === "granted") applyConsent(true);
  else if (earlyChoice === "denied") applyConsent(false);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initBanner();
      bindClicks();
    });
  } else {
    initBanner();
    bindClicks();
  }
})();
