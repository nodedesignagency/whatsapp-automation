/* =====================================================================
   Campaign composer — prototype behaviour.

   Everything below is view logic over a plain in-memory array. There is
   no persistence and no API; CAMPAIGNS is the shape the real endpoint
   should return, so the Next.js port can swap it for a fetch and keep
   the render functions almost unchanged.
   ===================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------- data */

  /* The prototype is pinned to a fixed "today" so the screen is
     deterministic. In production this is just new Date(). */
  var TODAY = new Date(2026, 9, 16); // Fri 16 October 2026

  /* one plausible recipient per campaign, so the preview header reads as a
     real chat rather than a list name */
  var SAMPLE_CONTACTS = ["Priya Sharma", "Rahul Mehta", "Anjali Verma", "Imran Qureshi", "Neha Gupta"];

  var AVATARS = [
    "assets/avatar-1.svg", "assets/avatar-2.svg", "assets/avatar-3.svg",
    "assets/avatar-4.svg", "assets/avatar-5.svg"
  ];

  var CAMPAIGNS = [
    {
      id: "c1", status: "scheduled", date: "2026-10-16", time: "10:00",
      title: "Weekend Flash Sale",
      message: "Hi! Our weekend sale starts today — flat 25% off on all cotton kurtis. Reply SALE and we'll hold your size till evening.",
      audience: "Regular Buyers", recipients: 128
    },
    {
      id: "c2", status: "scheduled", date: "2026-10-16", time: "15:00",
      title: "New Arrivals — Diwali Collection",
      message: "New Diwali collection just landed 🪔 Silk sarees starting ₹2,499. Catalogue attached — tell us the code you like and we'll reserve it.",
      audience: "Store Walk-ins", recipients: 64
    },
    {
      id: "c3", status: "scheduled", date: "2026-10-17", time: "11:30",
      title: "Early Bird Diwali Offer",
      message: "Book before 20 Oct and get free home delivery anywhere in the city. Limited to the first 50 orders.",
      audience: "Repeat Customers", recipients: 212
    },
    {
      id: "c4", status: "scheduled", date: "2026-10-19", time: "18:30",
      title: "Restock Alert — Chikankari",
      message: "The chikankari sets you asked about are back in stock. Sizes S to XXL available. Want me to send photos?",
      audience: "Waitlist", recipients: 37
    },

    {
      id: "d1", status: "draft", date: "2026-10-16", time: "12:00",
      title: "Untitled campaign",
      message: "",
      audience: "No audience yet", recipients: 0
    },
    {
      id: "d2", status: "draft", date: "2026-10-18", time: "09:00",
      title: "Loyalty Discount — needs pricing",
      message: "For customers who ordered 3+ times this year. Discount amount still to be confirmed with accounts.",
      audience: "Top Spenders", recipients: 41
    },

    {
      id: "s1", status: "sent", date: "2026-10-14", time: "10:00",
      title: "Navratri Closing Sale",
      message: "Last two days of the Navratri sale — up to 40% off. Store open till 9 PM.",
      audience: "All Customers", recipients: 486, delivered: 471, read: 302
    },
    {
      id: "s2", status: "sent", date: "2026-10-15", time: "17:00",
      title: "Order Pickup Reminder",
      message: "Your order is packed and waiting at the store. Please collect it before Saturday.",
      audience: "Pending Pickups", recipients: 23, delivered: 23, read: 21
    }
  ];

  /* --------------------------------------------------------- date utils */

  var DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_LONG  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTH     = ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"];

  function key(date) {
    var m = String(date.getMonth() + 1);
    var d = String(date.getDate());
    return date.getFullYear() + "-" + (m.length < 2 ? "0" + m : m) + "-" + (d.length < 2 ? "0" + d : d);
  }

  function parse(iso) {
    var p = iso.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function addDays(date, n) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
  }

  /* Monday-first week containing the given date. */
  function weekStart(date) {
    var d = new Date(date.getTime());
    var shift = (d.getDay() + 6) % 7;
    return addDays(d, -shift);
  }

  function longDate(date) {
    return date.getDate() + " " + MONTH[date.getMonth()] + ", " + DAY_LONG[date.getDay()];
  }

  function clockTime(hhmm) {
    var p = hhmm.split(":");
    var h = +p[0];
    var suffix = h >= 12 ? "PM" : "AM";
    var hour = h % 12 === 0 ? 12 : h % 12;
    return hour + ":" + p[1] + " " + suffix;
  }

  /* ------------------------------------------------------------- state */

  var state = {
    week: weekStart(TODAY),
    selectedDate: key(TODAY),
    status: "scheduled",
    query: "",
    selectedId: "c2",
    popMonth: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  };

  /* ------------------------------------------------------------ lookup */

  var $ = function (sel) { return document.querySelector(sel); };

  var els = {
    month: $("#month"),
    monthBtn: $("#monthBtn"),
    monthPop: $("#monthPop"),
    popTitle: $("#popTitle"),
    popGrid: $("#popGrid"),
    popPrev: $("#popPrev"),
    popNext: $("#popNext"),
    newDraft: $(".new-draft"),
    strip: $("#datestrip"),
    prev: $("#prevWeek"),
    next: $("#nextWeek"),
    list: $("#list"),
    search: $(".search input"),
    title: $(".composer__title"),
    editor: $(".composer__editor"),
    live: $(".bub--live"),
    liveDay: $("#liveDay"),
    chat: $(".phone__chat"),
    phoneName: $(".phone__name"),
    phoneSub: $(".phone__sub")
  };

  function visible() {
    var q = state.query.trim().toLowerCase();
    return CAMPAIGNS.filter(function (c) {
      if (c.status !== state.status) return false;
      if (!q) return true;
      return (c.title + " " + c.message + " " + c.audience).toLowerCase().indexOf(q) > -1;
    });
  }

  function countOn(iso) {
    return visible().filter(function (c) { return c.date === iso; }).length;
  }

  /* ------------------------------------------------------------- views */

  function renderStrip() {
    var start = state.week;
    var end = addDays(start, 6);

    els.month.textContent = start.getMonth() === end.getMonth()
      ? MONTH[start.getMonth()] + " " + start.getFullYear()
      : MONTH[start.getMonth()] + " – " + MONTH[end.getMonth()] + " " + end.getFullYear();

    els.strip.innerHTML = "";

    for (var i = 0; i < 7; i++) {
      var day = addDays(start, i);
      var iso = key(day);

      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dpill";
      btn.setAttribute("role", "tab");
      btn.dataset.date = iso;

      if (iso === state.selectedDate) btn.classList.add("is-active");
      if (iso === key(TODAY)) btn.classList.add("is-today");
      btn.setAttribute("aria-selected", iso === state.selectedDate ? "true" : "false");
      btn.setAttribute("aria-label", longDate(day));

      btn.innerHTML =
        '<span class="dpill__num">' + day.getDate() + "</span>" +
        '<span class="dpill__day">' + DAY_SHORT[day.getDay()] + "</span>" +
        '<span class="dpill__dot"' + (countOn(iso) ? "" : " hidden") + "></span>";

      btn.addEventListener("click", onPickDate);
      li.appendChild(btn);
      els.strip.appendChild(li);
    }
  }

  /* ------------------------------------------------- month popover */

  /* The week strip only reaches seven days at a time; this is how you get
     to a date that is weeks out without paging. */
  function renderMonthPop() {
    var first = state.popMonth;
    els.popTitle.textContent = MONTH[first.getMonth()] + " " + first.getFullYear();

    /* Monday-first grid, padded with the tail of the previous month. */
    var start = weekStart(first);
    var html = "";

    for (var i = 0; i < 42; i++) {
      var day = addDays(start, i);
      var iso = key(day);
      var outside = day.getMonth() !== first.getMonth();
      var count = countOn(iso);

      var cls = "mday";
      if (outside) cls += " mday--out";
      if (iso === key(TODAY)) cls += " mday--today";
      if (iso === state.selectedDate) cls += " mday--on";

      html += '<button type="button" class="' + cls + '" data-date="' + iso + '"' +
              ' aria-label="' + longDate(day) + '">' + day.getDate() +
              (count ? '<span class="mday__dot"></span>' : "") +
              "</button>";

      /* stop after a complete week once the month is done */
      if (i >= 27 && i % 7 === 6 && addDays(day, 1).getMonth() !== first.getMonth()) break;
    }

    els.popGrid.innerHTML = html;

    els.popGrid.querySelectorAll(".mday").forEach(function (cell) {
      cell.addEventListener("click", function () {
        state.selectedDate = cell.dataset.date;
        state.week = weekStart(parse(cell.dataset.date));
        closeMonthPop();
        renderStrip();
        renderList();
        var group = els.list.querySelector('.daygroup[data-date="' + state.selectedDate + '"]');
        if (group) group.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function openMonthPop() {
    state.popMonth = new Date(state.week.getFullYear(), state.week.getMonth(), 1);
    renderMonthPop();
    els.monthPop.hidden = false;
    els.monthBtn.setAttribute("aria-expanded", "true");
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
  }

  function closeMonthPop() {
    els.monthPop.hidden = true;
    els.monthBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("mousedown", onOutside);
    document.removeEventListener("keydown", onEscape);
  }

  function onOutside(e) {
    if (!els.monthPop.contains(e.target) && !els.monthBtn.contains(e.target)) closeMonthPop();
  }

  function onEscape(e) {
    if (e.key === "Escape") { closeMonthPop(); els.monthBtn.focus(); }
  }

  els.monthBtn.addEventListener("click", function () {
    if (els.monthPop.hidden) openMonthPop(); else closeMonthPop();
  });

  els.popPrev.addEventListener("click", function () {
    state.popMonth = new Date(state.popMonth.getFullYear(), state.popMonth.getMonth() - 1, 1);
    renderMonthPop();
  });
  els.popNext.addEventListener("click", function () {
    state.popMonth = new Date(state.popMonth.getFullYear(), state.popMonth.getMonth() + 1, 1);
    renderMonthPop();
  });

  /* ------------------------------------------------------------ views */

  function stackMarkup(count) {
    if (!count) return '<span class="campaign__more">No recipients yet</span>';

    var shown = Math.min(count, 5);
    var html = '<div class="stack">';
    for (var i = 0; i < shown; i++) {
      html += '<img class="stack__img" src="' + AVATARS[i % AVATARS.length] + '" alt="" />';
    }
    html += "</div>";

    var rest = count - shown;
    html += '<span class="campaign__more">' +
            (rest > 0 ? "+" + rest + " people" : count + (count === 1 ? " person" : " people")) +
            "</span>";
    return html;
  }

  function cardMarkup(c) {
    var excerpt = c.message || "This campaign has no message yet.";
    return '<div class="slot" data-date="' + c.date + '">' +
             '<span class="slot__time">' + clockTime(c.time) + "</span>" +
             '<article class="campaign' + (c.id === state.selectedId ? " is-selected" : "") +
                      '" tabindex="0" data-id="' + c.id + '">' +
               '<h4 class="campaign__title">' + c.title + "</h4>" +
               '<p class="campaign__excerpt' + (c.message ? "" : " is-empty") + '">' + excerpt + "</p>" +
               '<div class="campaign__foot">' + stackMarkup(c.recipients) + "</div>" +
             "</article>" +
           "</div>";
  }

  var CAL_ICON =
    '<svg viewBox="0 0 24 24" fill="none">' +
      '<rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    "</svg>";

  function renderList() {
    var items = visible().filter(function (c) {
      var d = parse(c.date);
      return d >= state.week && d <= addDays(state.week, 6);
    });

    if (!items.length) {
      els.list.innerHTML =
        '<div class="empty">' +
          '<span class="empty__icon">' + CAL_ICON + "</span>" +
          "<p>" + (state.query
            ? "No campaigns match “" + state.query + "”"
            : "No " + state.status + " campaigns this week") + "</p>" +
        "</div>";
      return;
    }

    items.sort(function (a, b) {
      return a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);
    });

    var html = "";
    var currentDay = null;

    items.forEach(function (c) {
      if (c.date !== currentDay) {
        if (currentDay !== null) html += "</section>";
        currentDay = c.date;
        html += '<section class="daygroup" data-date="' + c.date + '">' +
                  '<h3 class="daygroup__title">' +
                    '<span class="daygroup__icon" aria-hidden="true">' + CAL_ICON + "</span>" +
                    longDate(parse(c.date)) +
                  "</h3>";
      }
      html += cardMarkup(c);
    });
    html += "</section>";

    els.list.innerHTML = html;

    els.list.querySelectorAll(".campaign").forEach(function (card) {
      card.addEventListener("click", function () { selectCampaign(card.dataset.id); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectCampaign(card.dataset.id);
        }
      });
    });
  }

  /* --------------------------------------------------------- composer */

  function find(id) {
    for (var i = 0; i < CAMPAIGNS.length; i++) if (CAMPAIGNS[i].id === id) return CAMPAIGNS[i];
    return null;
  }

  function renderComposer() {
    var c = find(state.selectedId);
    if (!c) return;

    els.title.value = c.title;
    els.editor.textContent = c.message;   /* :empty shows the placeholder */

    var idx = CAMPAIGNS.indexOf(c);
    els.phoneName.textContent = c.recipients
      ? SAMPLE_CONTACTS[idx % SAMPLE_CONTACTS.length]
      : "No recipient";
    els.phoneSub.textContent = c.recipients
      ? "preview · " + c.audience + " (" + c.recipients + ")"
      : "pick an audience to preview";

    renderLiveBubble();
  }

  function renderLiveBubble() {
    var text = els.editor.textContent.trim();
    if (!text) {
      els.live.hidden = true;
      els.liveDay.hidden = true;
      return;
    }

    var c = find(state.selectedId);
    els.live.hidden = false;
    els.liveDay.hidden = false;
    els.live.textContent = text;

    var meta = document.createElement("span");
    meta.className = "bub__meta";
    meta.innerHTML = (c ? clockTime(c.time) : "now") + ' <i class="tick"></i>';
    els.live.appendChild(meta);

    els.chat.scrollTop = els.chat.scrollHeight;
  }

  function selectCampaign(id) {
    state.selectedId = id;
    els.list.querySelectorAll(".campaign").forEach(function (card) {
      card.classList.toggle("is-selected", card.dataset.id === id);
    });

    var c = find(id);
    if (c) {
      state.selectedDate = c.date;
      renderStrip();
    }
    renderComposer();
  }

  /* ---------------------------------------------------------- handlers */

  function onPickDate(e) {
    var btn = e.currentTarget;
    state.selectedDate = btn.dataset.date;
    renderStrip();

    var group = els.list.querySelector('.daygroup[data-date="' + state.selectedDate + '"]');
    if (group) group.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function shiftWeek(delta) {
    state.week = addDays(state.week, delta * 7);
    renderStrip();
    renderList();
  }

  els.prev.addEventListener("click", function () { shiftWeek(-1); });
  els.next.addEventListener("click", function () { shiftWeek(1); });

  var segTrack = document.getElementById("segTrack");

  document.querySelectorAll(".segmented__item").forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      segTrack.style.setProperty("--i", index);
      document.querySelectorAll(".segmented__item").forEach(function (other) {
        other.classList.remove("is-active");
        other.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      state.status = tab.dataset.status;
      renderStrip();
      renderList();

      var stillThere = visible().some(function (c) { return c.id === state.selectedId; });
      if (!stillThere) {
        var first = visible()[0];
        if (first) selectCampaign(first.id);
      }
    });
  });

  var draftSeq = 0;

  els.newDraft.addEventListener("click", function () {
    draftSeq += 1;
    var draft = {
      id: "new" + draftSeq,
      status: "draft",
      date: state.selectedDate,
      time: "12:00",
      title: "",
      message: "",
      audience: "No audience yet",
      recipients: 0
    };
    CAMPAIGNS.push(draft);

    var tab = document.querySelector('.segmented__item[data-status="draft"]');
    if (tab) tab.click();          /* switches status and slides the highlight */

    state.selectedId = draft.id;
    renderStrip();
    renderList();
    renderComposer();
    els.title.focus();
  });

  els.search.addEventListener("input", function () {
    state.query = els.search.value;
    renderStrip();
    renderList();
  });

  els.editor.addEventListener("input", renderLiveBubble);

  els.title.addEventListener("input", function () {
    var c = find(state.selectedId);
    if (!c) return;
    c.title = els.title.value;
    var card = els.list.querySelector('.campaign[data-id="' + c.id + '"] .campaign__title');
    if (card) card.textContent = c.title;
  });

  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelectorAll(".nav-item").forEach(function (o) { o.classList.remove("is-active"); });
      item.classList.add("is-active");
    });
  });

  /* -------------------------------------------------------------- boot */

  renderStrip();
  renderList();
  renderComposer();
})();
