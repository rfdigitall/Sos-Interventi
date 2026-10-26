/**
 * Sos Interventi — Consent Mode v2 + GA4 + Google Ads + DNI
 *
 * Ads: AW-18330400186
 * Click tel: AW-18330400186/dAXnCJzgr9ocELrrzqRE
 * Website call (forwarding): AW-18330400186/18xyCMu1wuccELrrzqRE
 * GA4: G-N643STDFRS
 *
 * 26/08/2026: DNI / inoltro Google DISATTIVATO (stesso fix GF).
 * call_view aveva MISSED mentre il cliente diceva telefono muto.
 * Ora tel: va DIRETTO a 388 809 1482. Click tel resta attivo.
 * 13/09/2026: WEBSITE_CALL Ads REMOVED (388+371 forwarding) — stop 0371 Google.
 * 24/10/2026: forceMarketingConsentForAds=false (GDPR). Default denied fino ad Accetta;
 * il banner non copre più il pulsante Chiama su mobile.
 * 26/10/2026: numero chiamata + WhatsApp passato a 388 809 1482 (test, ok cliente).
 * Per riattivare DNI: rimetti phoneConversionSendTo sotto + ricrea WEBSITE_CALL.
 */
(function () {
  "use strict";

  var CONFIG = {
    adsId: "AW-18330400186",
    conversionSendTo: "AW-18330400186/dAXnCJzgr9ocELrrzqRE",
    /** VUOTO = niente sostituzione numero Google (chiamata diretta) */
    phoneConversionSendTo: "",
    phoneConversionNumber: "388 809 1482",
    phoneDigits: "3888091482",
    ga4Id: "G-N643STDFRS",
    storageKey: "sos_consent_v2",
    /* 24/10/2026: false. Nessun consenso automatico per il traffico Ads:
       Consent Mode v2 resta "denied" finché il visitatore non clicca Accetta. */
    forceMarketingConsentForAds: false,
    /* Consent Mode v2 "advanced": senza consenso il click su Chiama invia a Google
       solo un ping anonimo senza cookie (conversione modellata). Metti false per
       non inviare nulla prima del consenso ("basic"). */
    cookielessPingsWhenDenied: true
  };

  var REAL_TEL = "tel:+393888091482";
  var PHONE_TEXT_RE = /388[\s.\-]?809[\s.\-]?1482/g;
  var OUR_TEL_RE = /(?:\+?39)?3888091482/;
  var FALLBACK_MS = 4500;

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

  function isAdsTraffic() {
    try {
      var p = new URLSearchParams(location.search);
      return !!(
        p.get("gclid") ||
        p.get("gbraid") ||
        p.get("wbraid") ||
        p.get("utm_source") === "google" ||
        p.get("google_phone_conversion_debug") === "true"
      );
    } catch (e) {
      return false;
    }
  }

  function hasAnalyticsConsent() {
    return readChoice() === "granted";
  }

  function canTrackMarketing() {
    return hasAnalyticsConsent() || (CONFIG.forceMarketingConsentForAds && isAdsTraffic());
  }

  function log() {
    try {
      if (console && console.info) {
        console.info.apply(console, ["[SOS DNI]"].concat([].slice.call(arguments)));
      }
    } catch (e) {}
  }

  window.sosDniReveal = function (reason) {
    if (window.__sosDniRevealed) return;
    window.__sosDniRevealed = true;
    try {
      document.documentElement.classList.remove("sos-dni-await");
      document.documentElement.classList.add("sos-dni-ready");
    } catch (e) {}
    log("reveal", reason || "");
  };

  function armAntiFlicker() {
    if (!CONFIG.phoneConversionSendTo) return;
    if (!isAdsTraffic()) return;
    if (document.getElementById("sos-dni-af-style")) return;
    var css =
      "html.sos-dni-await:not(.sos-dni-ready) a.nav-tel," +
      "html.sos-dni-await:not(.sos-dni-ready) a.idra-dial strong," +
      "html.sos-dni-await:not(.sos-dni-ready) a.sos-sticky-call strong," +
      "html.sos-dni-await:not(.sos-dni-ready) a[href^=\"tel:\"] .sos-phone-num{" +
      "color:transparent!important;position:relative;}" +
      "html.sos-dni-await:not(.sos-dni-ready) a.nav-tel{" +
      "font-size:0!important;letter-spacing:0!important;position:relative;min-width:6.5rem;}" +
      "html.sos-dni-await:not(.sos-dni-ready) a.nav-tel::after," +
      "html.sos-dni-await:not(.sos-dni-ready) a.idra-dial strong::after{" +
      "content:\"Chiama ora\";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);" +
      "white-space:nowrap;color:#fff;font-size:clamp(1rem,4vw,1.4rem);font-weight:700;}" +
      "html.sos-dni-await:not(.sos-dni-ready) a.idra-dial small{opacity:0;height:0;overflow:hidden;display:block;margin:0;}";
    var el = document.createElement("style");
    el.id = "sos-dni-af-style";
    el.textContent = css;
    document.head.appendChild(el);
    document.documentElement.classList.add("sos-dni-await");
    log("anti-flicker ON");
    setTimeout(function () {
      if (!window.__sosDniRevealed) window.sosDniReveal("timeout-" + FALLBACK_MS + "ms");
    }, FALLBACK_MS);
  }

  function applyWcmNumber(formatted, mobile) {
    if (!formatted) return;
    var telHref = String(mobile || "").trim();
    if (telHref && telHref.indexOf("tel:") !== 0) {
      telHref = telHref.charAt(0) === "+" ? "tel:" + telHref : "tel:+" + telHref.replace(/[^\d]/g, "");
    }
    if (!telHref) telHref = REAL_TEL;
    window.__sosPhoneReplaced = true;
    window.__sosDniFormatted = formatted;
    window.__sosDniMobile = mobile || formatted;

    var links = document.querySelectorAll('a[href^="tel:"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = (a.getAttribute("href") || "").replace(/\s+/g, "");
      if (!OUR_TEL_RE.test(href) && a.getAttribute("data-sos-phone") !== "1") continue;
      a.setAttribute("href", telHref);
      a.setAttribute("data-sos-phone", "1");
      var walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (var n = 0; n < nodes.length; n++) {
        if (PHONE_TEXT_RE.test(nodes[n].nodeValue)) {
          nodes[n].nodeValue = nodes[n].nodeValue.replace(PHONE_TEXT_RE, formatted);
        }
      }
    }
    window.sosDniReveal("wcm-callback");
    log("swapped to", formatted);
  }

  function markOurTelLinks() {
    var links = document.querySelectorAll('a[href^="tel:"]');
    for (var i = 0; i < links.length; i++) {
      var href = (links[i].getAttribute("href") || "").replace(/\s+/g, "");
      if (OUR_TEL_RE.test(href)) links[i].setAttribute("data-sos-phone", "1");
    }
  }

  function configGa4(extra) {
    if (!CONFIG.ga4Id) return;
    var opts = { anonymize_ip: true, send_page_view: true };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) opts[k] = extra[k];
      }
    }
    if (/[?&]ga_debug=1(?:&|$)/.test(location.search)) opts.debug_mode = true;
    gtag("config", CONFIG.ga4Id, opts);
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
      if (CONFIG.adsId) {
        gtag("config", CONFIG.adsId, {
          allow_enhanced_conversions: true,
          conversion_linker: true
        });
      }
      if (CONFIG.phoneConversionSendTo) {
        gtag("config", CONFIG.phoneConversionSendTo, {
          phone_conversion_number: CONFIG.phoneConversionNumber,
          phone_conversion_callback: applyWcmNumber
        });
      }
      /* Click tel only — no phone_conversion_number when DNI is off */
    }
  }

  function bootstrapAdsConsentEarly() {
    if (!CONFIG.forceMarketingConsentForAds || !isAdsTraffic()) return;
    if (readChoice() === "denied") return;
    saveChoice("granted");
    applyConsent(true);
    if (document.body) document.body.classList.add("ads-traffic");
    else
      document.addEventListener(
        "DOMContentLoaded",
        function () {
          document.body.classList.add("ads-traffic");
        },
        { once: true }
      );
  }

  function loadGtag() {
    gtag("js", new Date());
    if (canTrackMarketing()) {
      applyConsent(true);
    } else {
      configGa4();
      if (CONFIG.adsId) gtag("config", CONFIG.adsId);
    }
  }

  function liftStickyCall(px) {
    try {
      document.documentElement.style.setProperty("--sos-cookie-h", px ? px + "px" : "0px");
    } catch (e) {}
  }

  function hideBanner() {
    var el = document.getElementById("cookie-banner");
    if (el) el.hidden = true;
    document.body.classList.remove("cookie-open");
    liftStickyCall(0);
  }

  function showBanner() {
    var el = document.getElementById("cookie-banner");
    if (el) el.hidden = false;
    document.body.classList.add("cookie-open");
    /* keep the Chiama pill visible above the banner on mobile */
    try {
      var panel = el && el.querySelector(".cookie__panel");
      var measure = function () {
        if (!el || el.hidden) return;
        liftStickyCall(Math.ceil((panel || el).getBoundingClientRect().height) + 16);
      };
      measure();
      window.addEventListener("resize", measure);
    } catch (e) {}
  }

  function initBanner() {
    if (canTrackMarketing()) {
      hideBanner();
      return;
    }
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
    return String(href || "").trim().toLowerCase().replace(/[\s\-\u00a0().]/g, "");
  }

  function isExplicitCallCta(a) {
    if (!a || !a.classList) return false;
    if (a.classList.contains("idra-dial")
      || a.classList.contains("sticky-call__tel")
      || a.classList.contains("nav-tel")
      || a.classList.contains("footer-tel")
      || a.classList.contains("home-contact__call")) {
      return true;
    }
    /* FAQ "Tocca e chiama" links — intentional dial, not problem tiles */
    try {
      if (a.closest && a.closest(".idra-faq__cta, .sos-faq__cta")) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function isOurTelLink(a) {
    if (!a || !a.getAttribute) return false;
    if (a.getAttribute("data-sos-phone") === "1") return true;
    var href = normalizeTelHref(a.getAttribute("href"));
    return href === REAL_TEL_NORM || href === "tel:+393888091482" || OUR_TEL_RE.test(href);
  }

  function isOurWaLink(a) {
    if (!a || !a.getAttribute) return false;
    var href = a.getAttribute("href") || "";
    return href.indexOf("wa.me/") !== -1 && href.indexOf("393888091482") !== -1;
  }

  function sendGa4Event(name, params) {
    if (!CONFIG.ga4Id || typeof window.gtag !== "function") return;
    /* gtag rispetta lo stato Consent Mode: senza consenso nessun cookie viene scritto */
    if (!canTrackMarketing() && !CONFIG.cookielessPingsWhenDenied) return;
    var payload = params || {};
    payload.send_to = CONFIG.ga4Id;
    payload.transport_type = "beacon";
    gtag("event", name, payload);
  }

  function forceNativeDial(a, ev, isTile) {
    /* Google App / Ads in-app WebView often swallows plain <a href="tel:">.
       preventDefault + location.href is the reliable path to the dialer. */
    if (!a || !(isTile || isExplicitCallCta(a)) || !isOurTelLink(a)) return false;
    if (ev && typeof ev.button === "number" && ev.button !== 0) return false;
    var href = normalizeTelHref(a.getAttribute("href")) || REAL_TEL_NORM;
    if (href.indexOf("tel:") !== 0) href = REAL_TEL_NORM;
    try {
      if (ev) {
        ev.preventDefault();
        if (typeof ev.stopPropagation === "function") ev.stopPropagation();
      }
    } catch (e) { /* ignore */ }
    try {
      window.location.href = href;
    } catch (e2) {
      try {
        window.location.assign(href);
      } catch (e3) { /* ignore */ }
    }
    return true;
  }

  function trackTelConversion(ev) {
    if (ev && typeof ev.button === "number" && ev.button !== 0) return;

    var a = ev.target && ev.target.closest ? ev.target.closest('a[href^="tel:"]') : null;
    if (!isOurTelLink(a)) return;
    /* 25/10/2026: problem tiles dial directly (1 tap). They open the dialer but are NOT
       counted as a conversion (casual taps used to inflate "Click tel"). */
    if (a.classList && a.classList.contains("idra-tile")) {
      forceNativeDial(a, ev, true);
      return;
    }
    /* Only the real call buttons count as conversion. */
    if (!isExplicitCallCta(a)) return;

    /* Always force dial on explicit CTA — even if we already tracked this session. */
    forceNativeDial(a, ev);

    if (sessionAlreadyTracked(TEL_TRACK_KEY)) return;

    if (!canTrackMarketing() && !CONFIG.cookielessPingsWhenDenied) return;

    markSessionTracked(TEL_TRACK_KEY);

    if (CONFIG.conversionSendTo && typeof window.gtag === "function") {
      gtag("event", "conversion", {
        send_to: CONFIG.conversionSendTo,
        value: 1.0,
        currency: "EUR",
        transport_type: "beacon"
      });
    }

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
    markOurTelLinks();
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
    canTrackMarketing: canTrackMarketing,
    isAdsTraffic: isAdsTraffic,
    applyWcmNumber: applyWcmNumber,
    testTelEvent: function () {
      if (!canTrackMarketing()) {
        console.warn("Consenso marketing non attivo.");
        return false;
      }
      try {
        sessionStorage.removeItem(TEL_TRACK_KEY);
      } catch (e) { /* ignore */ }
      if (CONFIG.conversionSendTo) {
        gtag("event", "conversion", {
          send_to: CONFIG.conversionSendTo,
          value: 1.0,
          currency: "EUR",
          transport_type: "beacon"
        });
      }
      sendGa4Event("tel_click", {
        event_category: "engagement",
        event_label: "manual_test",
        method: "phone"
      });
      markSessionTracked(TEL_TRACK_KEY);
      console.info("Test conversion inviata —", CONFIG.conversionSendTo);
      return true;
    }
  };

  armAntiFlicker();
  bootstrapAdsConsentEarly();
  loadGtag();
  var earlyChoice = readChoice();
  if (earlyChoice === "granted") applyConsent(true);
  else if (earlyChoice === "denied") applyConsent(false);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initBanner();
      bindClicks();
      if (window.__sosDniFormatted) applyWcmNumber(window.__sosDniFormatted, window.__sosDniMobile);
    });
  } else {
    initBanner();
    bindClicks();
  }
})();
