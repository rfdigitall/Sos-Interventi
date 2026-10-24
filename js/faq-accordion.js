/**
 * FAQ accordion: una sola aperta, chiusura netta delle altre.
 */
(function () {
  "use strict";

  function bind(root) {
    if (!root || root.getAttribute("data-faq-bound") === "1") return;
    root.setAttribute("data-faq-bound", "1");

    var items = root.querySelectorAll("details.idra-faq__card, details.sos-faq__card");
    if (!items.length) return;

    // Partenza: tutto chiuso (niente salto al load)
    for (var i = 0; i < items.length; i++) {
      items[i].open = false;
    }

    root.addEventListener("click", function (e) {
      var summary = e.target.closest("summary");
      if (!summary || !root.contains(summary)) return;

      var details = summary.parentElement;
      if (!details || details.tagName !== "DETAILS") return;

      e.preventDefault();

      var willOpen = !details.open;
      for (var j = 0; j < items.length; j++) {
        items[j].open = false;
      }
      if (willOpen) {
        details.open = true;
      }
    });
  }

  /* Sitelink to a FAQ (e.g. #prezzi): open that answer. */
  function openFromHash() {
    var id = (location.hash || "").slice(1);
    if (!id || !/^[A-Za-z][\w-]{0,40}$/.test(id)) return;
    var el = document.getElementById(id);
    if (el && el.tagName === "DETAILS") {
      el.open = true;
      try { el.scrollIntoView(); } catch (e) {}
    }
  }

  function init() {
    var roots = document.querySelectorAll(".idra-faq__grid, .sos-faq__grid, [data-faq-accordion]");
    for (var i = 0; i < roots.length; i++) {
      bind(roots[i]);
    }
    openFromHash();
  }

  window.addEventListener("hashchange", openFromHash);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
