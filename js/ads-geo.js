/**
 * Ads geo line — EmergenzeCasa-style.
 * Reads city= / area= from Google Ads ValueTrack (loc_physical_ms / loc_interest_ms)
 * or a city name (?city=Treviso). Does not use GPS.
 */
(function () {
  var MAP = window.GF_GEO_NE || {};
  var REGIONS = { Veneto: 1, "Friuli-Venezia Giulia": 1 };
  var ALIAS = {
    "Metropolitan City of Venice": "Venezia",
    "Padua City Centre": "Padova",
    "Venezia Mestre": "Mestre",
    "Municipalita di Mestre-Carpenedo": "Mestre",
    "San Dona di Piave": "San Donà di Piave",
    "Scorze": "Scorzè",
  };

  try {
    var css = document.createElement("style");
    css.textContent =
      ".gf-geo-avail{display:block;margin:2px 0 14px;font-size:14px;font-weight:500;letter-spacing:0.01em;line-height:1.4;color:rgba(255,255,255,0.78);max-width:26rem}.gf-geo-avail[hidden]{display:none!important}" +
      /* When green live chip carries the city, hide duplicate geo line */
      "body.gf-has-live-avail .gf-geo-avail{display:none!important}";
    (document.head || document.documentElement).appendChild(css);
  } catch (e) {}

  function params() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function decodeVal(v) {
    if (!v) return "";
    try {
      return decodeURIComponent(String(v).replace(/\+/g, " ")).trim();
    } catch (e) {
      return String(v).trim();
    }
  }

  function titleCity(s) {
    return s.replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  function aliasName(n) {
    if (!n) return "";
    return ALIAS[n] || n;
  }

  function fromIdOrName(raw) {
    var v = decodeVal(raw);
    if (!v) return "";
    if (/^\d+$/.test(v)) return aliasName(MAP[v] || "");
    var named = titleCity(v);
    if (ALIAS[named]) return ALIAS[named];
    var values = Object.keys(MAP).map(function (k) {
      return MAP[k];
    });
    var hit = values.find(function (n) {
      return n.toLowerCase() === named.toLowerCase();
    });
    return aliasName(hit || "");
  }

  function fromKeyword(raw) {
    var kw = decodeVal(raw).toLowerCase();
    if (!kw || kw.length < 4) return "";
    var names = [];
    var seen = {};
    Object.keys(MAP).forEach(function (id) {
      var n = MAP[id];
      if (!n || REGIONS[n] || seen[n]) return;
      seen[n] = 1;
      names.push(n);
    });
    names.sort(function (a, b) {
      return b.length - a.length;
    });
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      var re = new RegExp("(?:^|\\s)" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:\\s|$)", "i");
      if (re.test(kw)) return n;
    }
    return "";
  }

  function pickCity(p) {
    var interest = fromIdOrName(p.get("area"));
    var physical = fromIdOrName(p.get("city") || p.get("citta"));
    var kw = fromKeyword(p.get("utm_keyword") || p.get("utm_term") || p.get("kw"));
    function ok(n) {
      return n && !REGIONS[n];
    }
    if (ok(interest)) return interest;
    if (ok(physical)) return physical;
    if (ok(kw)) return kw;
    if (interest) return interest;
    if (physical) return physical;
    return "";
  }

  function lineText(city) {
    if (!city) return "";
    /* Calm trust line — H1 already has the city; night fallback when live chip is hidden */
    if (REGIONS[city]) return "Rispondiamo noi in " + city + " — senza call center.";
    return "Rispondiamo noi a " + city + " — senza call center.";
  }

  function paint(city) {
    var text = lineText(city);
    var nodes = document.querySelectorAll("[data-gf-geo-avail]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!text) {
        el.hidden = true;
        el.textContent = "";
      } else {
        el.hidden = false;
        el.textContent = text;
      }
    }
  }

  var p = params();
  if (p.get("gclid") || p.get("gbraid") || p.get("wbraid") || p.get("utm_source")) {
    try {
      document.documentElement.classList.add("ads-traffic");
      if (document.body) document.body.classList.add("ads-traffic");
    } catch (e) {}
  }

  var city = pickCity(p);
  window.__gfGeoCity = city;

  window.gfApplyLandingContext = function () {
    if (p.get("gclid") || p.get("gbraid") || p.get("wbraid") || p.get("utm_source")) {
      try {
        if (document.body) document.body.classList.add("ads-traffic");
      } catch (e) {}
    }
    return window.__gfGeoCity || "";
  };

  // Re-assert after other deferred scripts (e.g. support.js) may overwrite.
  function assertHook() {
    window.gfApplyLandingContext = function () {
      return window.__gfGeoCity || "";
    };
    paint(window.__gfGeoCity);
  }

  var t = 0;
  function run() {
    paint(window.__gfGeoCity);
  }
  function schedule() {
    if (t) clearTimeout(t);
    t = setTimeout(run, 40);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      assertHook();
      run();
    });
  } else {
    assertHook();
    run();
  }
  var mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function () {
    mo.disconnect();
    assertHook();
    run();
  }, 8000);
})();
