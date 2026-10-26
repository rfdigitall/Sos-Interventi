/**
 * Selezione problema → WhatsApp precompilato o chiamata
 */
(function () {
  "use strict";

  var WA = "393888091482";
  var TEL = "tel:+393888091482";

  var form = document.getElementById("problem-form");
  if (!form) return;

  var btnWa = document.getElementById("problem-wa");
  var btnTel = document.getElementById("problem-tel");
  var note = document.getElementById("problem-note");
  var custom = document.getElementById("problem-custom");

  function selected() {
    var checked = form.querySelector('input[name="problema"]:checked');
    return checked ? checked.value : "";
  }

  function buildMessage() {
    var problem = selected();
    var extra = custom && custom.value ? custom.value.trim() : "";
    var msg =
      "Ciao, ho bisogno di un pronto intervento.\n" +
      "Problema: " + (problem || "(non specificato)") + ".\n";
    if (extra) msg += "Dettaglio: " + extra + ".\n";
    msg += "Potete aiutarmi? Grazie.";
    return msg;
  }

  function refresh() {
    var msg = buildMessage();
    if (btnWa) {
      btnWa.href =
        "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
    }
    var has = !!selected();
    if (btnWa) {
      btnWa.toggleAttribute("aria-disabled", !has);
      btnWa.classList.toggle("is-disabled", !has);
    }
    if (note) {
      note.textContent = has
        ? ""
        : "Seleziona un problema per attivare WhatsApp — oppure chiama subito.";
      note.hidden = !note.textContent;
    }
  }

  form.addEventListener("change", refresh);
  if (custom) custom.addEventListener("input", refresh);

  if (btnWa) {
    btnWa.addEventListener("click", function (e) {
      if (!selected()) {
        e.preventDefault();
        if (note) note.textContent = "Seleziona un problema dall’elenco, poi riprova.";
        var first = form.querySelector('input[name="problema"]');
        if (first) first.focus();
      }
    });
  }

  if (btnTel) btnTel.href = TEL;

  refresh();
})();
