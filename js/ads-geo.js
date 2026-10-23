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
      "body.gf-has-live-avail .gf-geo-avail{display:none!important}" +
      /* Ads visitors: no exits from the header, only logo + phone */
      ".ads-traffic .site-header .nav-links{display:none!important}";
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

  function paintZone(city) {
    var zones = document.querySelectorAll("[data-gf-geo-zone]");
    for (var z = 0; z < zones.length; z++) {
      var el = zones[z];
      if (!el.hasAttribute("data-gf-geo-default")) el.setAttribute("data-gf-geo-default", el.textContent);
      var want = city && !REGIONS[city] ? city + " e dintorni" : el.getAttribute("data-gf-geo-default");
      if (el.textContent !== want) el.textContent = want;
    }
  }

  function paint(city) {
    paintZone(city);
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
  if (p.get("gclid") || p.get("gbraid") || p.get("wbraid") || p.get("utm_source") || p.get("utm_keyword")) {
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

  /* --- Ads conversion helpers: city on sticky call, searched problem first, WhatsApp prefilled --- */
  var WA_NUM = "393717945477";
  var STOP = { per: 1, con: 1, non: 1, che: 1, una: 1, del: 1, della: 1, nel: 1, urgente: 1, urgenti: 1, urgenza: 1, pronto: 1, intervento: 1, interventi: 1, vicino: 1, casa: 1, "24h": 1, h24: 1, fabbro: 1, fabbri: 1, idraulico: 1, idraulici: 1, idraulica: 1, tecnico: 1, servizio: 1, emergenza: 1, subito: 1, domicilio: 1, chiama: 1, acqua: 1 };

  function searchedProblem() {
    var kw = decodeVal(p.get("utm_keyword") || p.get("utm_term") || p.get("kw")).toLowerCase();
    if (!kw) return "";
    var c = (window.__gfGeoCity || "").toLowerCase();
    if (c) kw = kw.replace(new RegExp("(^|\\s)(a |in )?" + c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s|$)", "g"), " ");
    return kw.replace(/[+\[\]"]/g, " ").replace(/\s+/g, " ").trim();
  }

  var SYN = { intasa: "ostrui", ottura: "ostrui", water: "wc", gabinetto: "wc", allaga: "allaga", spezza: "rotta", rotto: "rotta", rotti: "rotta", tubazi: "tubo", tubatu: "tubo", tubi: "tubo", saraci: "serran", bascul: "bascul", box: "garage" };
  function stems(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/).filter(function (w) { return (w.length >= 4 || w === "wc" || w === "box") && !STOP[w]; })
      .map(function (w) { var k = w.slice(0, 6); return SYN[k] || SYN[w] || k; });
  }

  function boostTile(problem) {
    if (!problem) return;
    var want = stems(problem);
    if (!want.length) return;
    var grids = document.querySelectorAll(".idra-grid");
    for (var g = 0; g < grids.length; g++) {
      var grid = grids[g];
      if (grid.getAttribute("data-gf-boosted")) continue;
      var tiles = grid.querySelectorAll(".idra-tile");
      var best = null, bestScore = 0, bestLen = 99;
      for (var i = 0; i < tiles.length; i++) {
        if ((tiles[i].getAttribute("href") || "").indexOf("wa.me") >= 0) continue;
        var titleEl = tiles[i].querySelector("strong");
        var have = stems(titleEl ? titleEl.textContent : tiles[i].textContent);
        var rest = stems(tiles[i].textContent);
        var score = 0;
        for (var w = 0; w < want.length; w++) {
          if (have.indexOf(want[w]) >= 0) score += 2;
          else if (rest.indexOf(want[w]) >= 0) score += 1;
        }
        if (score > bestScore || (score && score === bestScore && have.length < bestLen)) {
          bestScore = score; bestLen = have.length; best = tiles[i];
        }
      }
      grid.setAttribute("data-gf-boosted", "1");
      if (!best || bestScore < 2) continue;
      for (var h = 0; h < tiles.length; h++) tiles[h].classList.remove("idra-tile--hot");
      best.classList.add("idra-tile--hot");
      grid.insertBefore(best, grid.firstElementChild);
      var nums = grid.querySelectorAll(".idra-tile__k");
      for (var n = 0; n < nums.length; n++) nums[n].textContent = (n < 9 ? "0" : "") + (n + 1);
    }
  }

  function stickyCity(city) {
    if (!city || REGIONS[city]) return;
    var a = document.querySelector(".sticky-call__tel");
    if (!a || a.getAttribute("data-gf-city")) return;
    for (var i = a.childNodes.length - 1; i >= 0; i--) {
      var nd = a.childNodes[i];
      if (nd.nodeType === 3 && nd.textContent.trim()) {
        nd.textContent = " Chiama · " + city + " ";
        a.setAttribute("data-gf-city", "1");
        return;
      }
    }
  }

  function prefillWhatsApp(city, problem) {
    if (!city && !problem) return;
    var msg = "Ciao" + (city && !REGIONS[city] ? ", sono a " + city : "") + "." +
      (problem ? " Ho bisogno di: " + problem + "." : " Ho un'urgenza in casa.") + " Potete aiutarmi?";
    var links = document.querySelectorAll('a[href*="wa.me/' + WA_NUM + '"]');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute("href", "https://wa.me/" + WA_NUM + "?text=" + encodeURIComponent(msg));
    }
  }

  var enhanced = false;
  function enhance() {
    if (enhanced || !document.body) return;
    enhanced = true;
    var city = window.__gfGeoCity || "";
    var problem = searchedProblem();
    try { boostTile(problem); } catch (e) {}
    try { stickyCity(city); } catch (e) {}
    try { prefillWhatsApp(city, problem); } catch (e) {}
  }

  var t = 0;
  function run() {
    paint(window.__gfGeoCity);
    if (document.readyState !== "loading") enhance();
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
