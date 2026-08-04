/* =====================================================================
   Prototype interactions only — no data layer, no persistence.
   Everything here is intentionally small so it can be dropped for
   React state when this moves to Next.js.
   ===================================================================== */
(function () {
  "use strict";

  /* --- single-select helper: activates the clicked item in a group --- */
  function singleSelect(selector, activeClass, onChange) {
    var items = Array.prototype.slice.call(document.querySelectorAll(selector));
    items.forEach(function (item) {
      item.addEventListener("click", function () {
        items.forEach(function (other) {
          other.classList.remove(activeClass);
          if (other.hasAttribute("aria-selected")) other.setAttribute("aria-selected", "false");
        });
        item.classList.add(activeClass);
        if (item.hasAttribute("aria-selected")) item.setAttribute("aria-selected", "true");
        if (onChange) onChange(item);
      });
    });
  }

  singleSelect(".dpill", "is-active");
  singleSelect(".segmented__item", "is-active");
  singleSelect(".nav-item", "is-active");
  singleSelect(".campaign", "is-selected");

  /* --- composer text mirrors into the phone preview bubble --- */
  var editor = document.querySelector(".composer__editor");
  var live = document.querySelector(".bub--live");
  var chat = document.querySelector(".phone__chat");

  if (editor && live) {
    editor.addEventListener("input", function () {
      var text = editor.textContent.trim();
      if (!text) {
        live.hidden = true;
        return;
      }
      live.hidden = false;
      live.textContent = text;

      var meta = document.createElement("span");
      meta.className = "bub__meta";
      meta.innerHTML = 'now <i class="tick"></i>';
      live.appendChild(meta);

      if (chat) chat.scrollTop = chat.scrollHeight;
    });
  }

  /* --- keep the campaign title in sync with the selected card --- */
  var titleInput = document.querySelector(".composer__title");
  if (titleInput) {
    titleInput.addEventListener("focus", function () {
      titleInput.select();
    });
  }
})();
