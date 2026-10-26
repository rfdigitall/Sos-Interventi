/**
 * Ads geo line — v20261024sos.
 * Reads city= / area= from Google Ads ValueTrack (loc_physical_ms / loc_interest_ms)
 * or a city name (?city=Treviso). Whitelist = js/geo-ne.js (Veneto + FVG only).
 * All text is written with textContent (no HTML injection). Does not use GPS.
 */
(function () {
  /* GF_GEO_NE values: "Nome" = comune/località, "prov:Nome" = provincia, "reg:Nome" = regione.
     Only Veneto + Friuli Venezia Giulia are in the map (whitelist): anything else = neutral text. */
  var MAP = window.GF_GEO_NE || {};
  var REGIONS = { Veneto: 1, "Friuli Venezia Giulia": 1, "Friuli-Venezia Giulia": 1 };
  /* Comuni whose name is also a common word: never inferred from the search keyword. */
  var KW_SKIP = { mira: 1, grado: 1, tessera: 1, este: 1, dolo: 1, arre: 1, lusia: 1, cona: 1, fonte: 1, torre: 1, ponte: 1, porto: 1, villa: 1, campo: 1, fiesso: 1, one: 1, casale: 1 };

  try {
    var css = document.createElement("style");
    css.textContent =
      ".gf-geo-avail{display:block;margin:2px 0 14px;font-size:14px;font-weight:500;letter-spacing:0.01em;line-height:1.4;color:rgba(255,255,255,0.78);max-width:26rem}.gf-geo-avail[hidden]{display:none!important}" +
      "body.gf-has-live-avail .gf-geo-avail{display:none!important}" +
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
    var out = String(v);
    try {
      out = decodeURIComponent(out.replace(/\+/g, " "));
    } catch (e) {}
    return out.trim().slice(0, 120);
  }

  function norm(s) {
    var t = String(s || "").toLowerCase();
    try { t = t.normalize("NFD"); } catch (e) {}
    return t.replace(/[\u0300-\u036f]/g, "")
      .replace(/['’`\-_.]/g, " ").replace(/\s+/g, " ").trim();
  }

  function parse(v) {
    if (!v) return null;
    if (v.indexOf("prov:") === 0) return { name: v.slice(5), kind: "prov" };
    if (v.indexOf("reg:") === 0) return { name: v.slice(4), kind: "reg" };
    return { name: v, kind: "place" };
  }

  /* name index (normalized) built once from the whitelist */
  var BY_NAME = null;
  function byName() {
    if (BY_NAME) return BY_NAME;
    BY_NAME = {};
    for (var k in MAP) {
      if (!Object.prototype.hasOwnProperty.call(MAP, k)) continue;
      var e = parse(MAP[k]);
      var key = norm(e.name);
      if (e.kind === "place" || !BY_NAME[key]) BY_NAME[key] = e;
    }
    BY_NAME["venice"] = BY_NAME["venezia"];
    BY_NAME["padua"] = BY_NAME["padova"];
    return BY_NAME;
  }

  function fromIdOrName(raw) {
    var v = decodeVal(raw);
    if (!v) return null;
    if (/^\d{4,10}$/.test(v)) return parse(MAP[v] || "");
    if (!/^[A-Za-z\u00C0-\u017F '’.\-]{2,60}$/.test(v)) return null;
    return byName()[norm(v)] || null;
  }

  var KW_NAMES = null;
  function fromKeyword(raw) {
    var kw = " " + norm(decodeVal(raw)).replace(/[+\[\]"]/g, " ") + " ";
    if (kw.length < 6) return null;
    if (!KW_NAMES) {
      var idx = byName();
      KW_NAMES = Object.keys(idx).filter(function (n) {
        return idx[n] && idx[n].kind === "place" && n.length >= 3 && !KW_SKIP[n];
      }).sort(function (a, b) { return b.length - a.length; });
    }
    for (var i = 0; i < KW_NAMES.length; i++) {
      if (kw.indexOf(" " + KW_NAMES[i] + " ") >= 0) return byName()[KW_NAMES[i]];
    }
    return null;
  }

  function pickPlace(p) {
    var interest = fromIdOrName(p.get("area"));
    var physical = fromIdOrName(p.get("city") || p.get("citta"));
    var kw = fromKeyword(p.get("utm_keyword") || p.get("utm_term") || p.get("kw"));
    /* searched place (area / city named in the keyword) beats where the phone is */
    var order = [interest, kw, physical];
    var i;
    for (i = 0; i < order.length; i++) if (order[i] && order[i].kind === "place") return order[i];
    for (i = 0; i < order.length; i++) if (order[i] && order[i].kind === "prov") return order[i];
    for (i = 0; i < order.length; i++) if (order[i] && order[i].kind === "reg") return order[i];
    return null;
  }

  /* "a Verona" / "in provincia di Verona" / "in Veneto" */
  function locative(pl) {
    if (!pl) return "";
    if (pl.kind === "prov") return "in provincia di " + pl.name;
    if (pl.kind === "reg") return "in " + pl.name;
    return "a " + pl.name;
  }

  function lineText(pl) {
    if (!pl || pl.kind === "reg") return "";
    return "Rispondiamo noi " + locative(pl) + " — senza call center.";
  }

  function paintZone(pl) {
    var zones = document.querySelectorAll("[data-gf-geo-zone]");
    for (var z = 0; z < zones.length; z++) {
      var el = zones[z];
      if (!el.hasAttribute("data-gf-geo-default")) el.setAttribute("data-gf-geo-default", el.textContent);
      var want = el.getAttribute("data-gf-geo-default");
      if (pl && pl.kind === "place") want = pl.name + " e dintorni";
      else if (pl && pl.kind === "prov") want = "Provincia di " + pl.name;
      if (el.textContent !== want) el.textContent = want;
    }
    /* inline "vicino a te {in Veneto e Friuli}" -> "a Verona" / "in provincia di Verona" */
    var locs = document.querySelectorAll("[data-gf-geo-loc]");
    for (var g = 0; g < locs.length; g++) {
      var le = locs[g];
      if (!le.hasAttribute("data-gf-geo-default")) le.setAttribute("data-gf-geo-default", le.textContent);
      var lt = le.getAttribute("data-gf-geo-default");
      if (pl && pl.kind !== "reg") lt = locative(pl);
      if (le.textContent !== lt) le.textContent = lt;
    }
    /* footer area line: a visitor from one city sees only their own area */
    var lists = document.querySelectorAll(".footer-cities");
    for (var f = 0; f < lists.length; f++) {
      var li = lists[f];
      if (!li.hasAttribute("data-gf-geo-default")) li.setAttribute("data-gf-geo-default", li.textContent);
      var t = li.getAttribute("data-gf-geo-default");
      if (pl && pl.kind !== "reg") t = "Interventi " + locative(pl) + (pl.kind === "place" ? " e dintorni" : "") + " · Veneto e Friuli Venezia Giulia";
      if (li.textContent !== t) li.textContent = t;
    }
  }

  function paint(pl) {
    paintZone(pl);
    var text = lineText(pl);
    var nodes = document.querySelectorAll("[data-gf-geo-avail]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!text) {
        el.hidden = true;
        el.textContent = "";
      } else {
        el.hidden = false;
        if (el.textContent !== text) el.textContent = text;
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

  var PLACE = pickPlace(p);
  /* Public API (read by ads-qs-match.js) */
  window.__gfGeoPlace = PLACE;
  window.__gfGeoCity = PLACE && PLACE.kind === "place" ? PLACE.name : "";
  window.__gfGeoLoc = PLACE && PLACE.kind !== "reg" ? locative(PLACE) : "";

  window.gfApplyLandingContext = function () {
    if (p.get("gclid") || p.get("gbraid") || p.get("wbraid") || p.get("utm_source")) {
      try {
        if (document.body) document.body.classList.add("ads-traffic");
      } catch (e) {}
    }
    return window.__gfGeoCity || "";
  };

  function assertHook() {
    window.gfApplyLandingContext = function () {
      return window.__gfGeoCity || "";
    };
    paint(PLACE);
  }

  /* --- Ads conversion helpers: city on sticky call, searched problem first, WhatsApp prefilled --- */
  var WA_NUM = "393888091482";
  var STOP = { per: 1, con: 1, non: 1, che: 1, una: 1, del: 1, della: 1, nel: 1, urgente: 1, urgenti: 1, urgenza: 1, pronto: 1, intervento: 1, interventi: 1, vicino: 1, casa: 1, "24h": 1, h24: 1, fabbro: 1, fabbri: 1, idraulico: 1, idraulici: 1, idraulica: 1, tecnico: 1, servizio: 1, emergenza: 1, subito: 1, domicilio: 1, chiama: 1, acqua: 1 };

  function searchedProblem() {
    var kw = decodeVal(p.get("utm_keyword") || p.get("utm_term") || p.get("kw")).toLowerCase();
    if (!kw) return "";
    var c = (PLACE ? PLACE.name : "").toLowerCase();
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
    if (!city || REGIONS[city] || city.length > 18) return;
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
    paint(PLACE);
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
