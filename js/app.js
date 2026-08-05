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

  /* Saved lists are the primary way a vendor picks recipients — one tap is
     128 people. Individual contacts are the fallback, not the default. */
  var AUDIENCES = [
    { id: "all",      name: "All Customers",     count: 486 },
    { id: "repeat",   name: "Repeat Customers",  count: 212 },
    { id: "regular",  name: "Regular Buyers",    count: 128 },
    { id: "walkins",  name: "Store Walk-ins",    count: 64 },
    { id: "top",      name: "Top Spenders",      count: 41 },
    { id: "waitlist", name: "Waitlist",          count: 37 },
    { id: "pickups",  name: "Pending Pickups",   count: 23 }
  ];

  var CONTACTS = [
    { id: "p1", name: "Priya Sharma",   phone: "+91 98200 12345" },
    { id: "p2", name: "Rahul Mehta",    phone: "+91 98111 44821" },
    { id: "p3", name: "Anjali Verma",   phone: "+91 99870 55210" },
    { id: "p4", name: "Imran Qureshi",  phone: "+91 90040 71166" },
    { id: "p5", name: "Neha Gupta",     phone: "+91 98330 90277" },
    { id: "p6", name: "Vikram Singh",   phone: "+91 97020 31984" },
    { id: "p7", name: "Meera Iyer",     phone: "+91 96500 22107" }
  ];

  var AVATARS = [
    "assets/avatar-1.svg", "assets/avatar-2.svg", "assets/avatar-3.svg",
    "assets/avatar-4.svg", "assets/avatar-5.svg"
  ];

  var CAMPAIGNS = [
    {
      id: "c1", status: "scheduled", date: "2026-10-16", time: "10:00",
      title: "Weekend Flash Sale",
      message: "Hi! Our weekend sale starts today — flat 25% off on all cotton kurtis. Reply SALE and we'll hold your size till evening.",
      lists: ["regular"], contacts: []
    },
    {
      id: "c2", status: "scheduled", date: "2026-10-16", time: "15:00",
      title: "New Arrivals — Diwali Collection",
      message: "New Diwali collection just landed 🪔 Silk sarees starting ₹2,499. Catalogue attached — tell us the code you like and we'll reserve it.",
      lists: ["walkins"], contacts: []
    },
    {
      id: "c3", status: "scheduled", date: "2026-10-17", time: "11:30",
      title: "Early Bird Diwali Offer",
      message: "Book before 20 Oct and get free home delivery anywhere in the city. Limited to the first 50 orders.",
      lists: ["repeat"], contacts: []
    },
    {
      id: "c4", status: "scheduled", date: "2026-10-19", time: "18:30",
      title: "Restock Alert — Chikankari",
      message: "The chikankari sets you asked about are back in stock. Sizes S to XXL available. Want me to send photos?",
      lists: ["waitlist"], contacts: []
    },

    {
      id: "d1", status: "draft", date: null, time: null,
      title: "Untitled campaign",
      message: "",
      lists: [], contacts: []
    },
    {
      id: "d2", status: "draft", date: null, time: null,
      title: "Loyalty Discount — needs pricing",
      message: "For customers who ordered 3+ times this year. Discount amount still to be confirmed with accounts.",
      lists: ["top"], contacts: []
    },

    {
      id: "s1", status: "sent", date: "2026-10-14", time: "10:00",
      title: "Navratri Closing Sale",
      message: "Last two days of the Navratri sale — up to 40% off. Store open till 9 PM.",
      lists: ["all"], contacts: [], delivered: 471, read: 302
    },
    {
      id: "s2", status: "sent", date: "2026-10-15", time: "17:00",
      title: "Order Pickup Reminder",
      message: "Your order is packed and waiting at the store. Please collect it before Saturday.",
      lists: ["pickups"], contacts: [], delivered: 23, read: 21
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
    cancelBtn: $("#cancelBtn"),
    confirmBtn: $("#confirmBtn"),
    saveBackdrop: $("#saveBackdrop"),
    discardBtn: $("#discardBtn"),
    saveDraftBtn: $("#saveDraftBtn"),
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
    phoneSub: $(".phone__sub"),

    schedBtn: $("#schedBtn"), schedLabel: $("#schedLabel"), schedPop: $("#schedPop"),
    schedHeading: $("#schedHeading"), schedIntro: $("#schedIntro"),
    stepDate: $("#stepDate"), stepTime: $("#stepTime"), stepSummary: $("#stepSummary"),
    bigMonth: $("#bigMonth"), bigYear: $("#bigYear"),
    bigGrid: $("#bigGrid"), bigToday: $("#bigToday"), bigPrev: $("#bigPrev"), bigNext: $("#bigNext"),
    wheelHour: $("#wheelHour"), wheelMinute: $("#wheelMinute"), wheelPeriod: $("#wheelPeriod"),
    bigSummary: $("#bigSummary"),
    chosenDate: $("#chosenDate"), backToDate: $("#backToDate"),
    schedCancel: $("#schedCancel"), schedNextBtn: $("#schedNextBtn"),
    repeatBtn: $("#repeatBtn"), repeatPop: $("#repeatPop"), repeatValue: $("#repeatValue"),
    repeatFreq: $("#repeatFreq"), repeatDaysWrap: $("#repeatDaysWrap"), repeatDays: $("#repeatDays"),
    repeatEndsWrap: $("#repeatEndsWrap"), repeatEnds: $("#repeatEnds"),
    endsOn: $("#endsOn"), endsAfter: $("#endsAfter"),
    repeatSummary: $("#repeatSummary"), repeatDone: $("#repeatDone"),

    contactBtn: $("#contactBtn"), contactPop: $("#contactPop"), contactLabel: $("#contactLabel"),
    pickSearch: $("#pickSearch"), pickList: $("#pickList"),
    pickSummary: $("#pickSummary"), pickDone: $("#pickDone")
  };

  function visible() {
    var q = state.query.trim().toLowerCase();
    return CAMPAIGNS.filter(function (c) {
      if (c.status !== state.status) return false;
      if (!q) return true;
      return (c.title + " " + c.message + " " + audienceLabel(c)).toLowerCase().indexOf(q) > -1;
    });
  }

  function countOn(iso) {
    return visible().filter(function (c) { return c.date === iso; }).length;
  }

  function isDraft() { return state.status === "draft"; }

  function listById(id) {
    for (var i = 0; i < AUDIENCES.length; i++) if (AUDIENCES[i].id === id) return AUDIENCES[i];
    return null;
  }
  function personById(id) {
    for (var i = 0; i < CONTACTS.length; i++) if (CONTACTS[i].id === id) return CONTACTS[i];
    return null;
  }

  function recipientCount(c) {
    if (!c) return 0;
    return c.lists.reduce(function (n, id) {
      var l = listById(id);
      return n + (l ? l.count : 0);
    }, 0) + c.contacts.length;
  }

  /* One list reads as its own name; anything else is counted, because
     "Regular Buyers + 2 others" is more useful than a truncated list. */
  function audienceLabel(c) {
    if (!c) return "No audience yet";
    var L = c.lists.length, K = c.contacts.length;
    if (!L && !K) return "No audience yet";
    if (L === 1 && !K) return listById(c.lists[0]).name;
    if (!L && K === 1) return personById(c.contacts[0]).name;
    var parts = [];
    if (L) parts.push(L + (L > 1 ? " lists" : " list"));
    if (K) parts.push(K + (K > 1 ? " contacts" : " contact"));
    return parts.join(" + ");
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
    return '<div class="slot" data-date="' + (c.date || "") + '">' +
             (c.time ? '<span class="slot__time">' + clockTime(c.time) + "</span>" : "") +
             '<article class="campaign' + (c.id === state.selectedId ? " is-selected" : "") +
                      '" tabindex="0" data-id="' + c.id + '">' +
               '<h4 class="campaign__title">' + c.title + "</h4>" +
               '<p class="campaign__excerpt' + (c.message ? "" : " is-empty") + '">' + excerpt + "</p>" +
               '<div class="campaign__foot">' + stackMarkup(recipientCount(c)) + "</div>" +
             "</article>" +
           "</div>";
  }

  var DRAFT_ICON =
    '<svg viewBox="0 0 24 24" fill="none">' +
      '<path d="M6 3h7l5 5v13H6V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M13 3v5h5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
    "</svg>";

  var CAL_ICON =
    '<svg viewBox="0 0 24 24" fill="none">' +
      '<rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    "</svg>";

  function renderList() {
    /* Drafts carry no date, so the week strip does not filter them. */
    var items = isDraft() ? visible() : visible().filter(function (c) {
      var d = parse(c.date);
      return d >= state.week && d <= addDays(state.week, 6);
    });

    if (!items.length) {
      els.list.innerHTML =
        '<div class="empty">' +
          '<span class="empty__icon">' + CAL_ICON + "</span>" +
          "<p>" + (state.query
            ? "No campaigns match “" + state.query + "”"
            : isDraft() ? "No drafts yet"
                        : "No " + state.status + " campaigns this week") + "</p>" +
        "</div>";
      return;
    }

    var html = "";

    if (isDraft()) {
      html = '<section class="daygroup daygroup--drafts">' +
               '<h3 class="daygroup__title">' +
                 '<span class="daygroup__icon" aria-hidden="true">' + DRAFT_ICON + "</span>" +
                 items.length + (items.length === 1 ? " draft" : " drafts") +
               "</h3>";
      items.forEach(function (c) { html += cardMarkup(c); });
      html += "</section>";
    } else {
      items.sort(function (a, b) {
        return a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);
      });

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
    }

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

    els.title.textContent = c.title;
    els.editor.textContent = c.message;   /* :empty shows the placeholder */

    var idx = CAMPAIGNS.indexOf(c);
    var total = recipientCount(c);
    els.phoneName.textContent = total
      ? SAMPLE_CONTACTS[idx % SAMPLE_CONTACTS.length]
      : "No recipient";
    els.phoneSub.textContent = total
      ? "preview · " + audienceLabel(c) + " (" + total + ")"
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
    meta.innerHTML = (c && c.time ? clockTime(c.time) : "now") + ' <i class="tick"></i>';
    els.live.appendChild(meta);

    els.chat.scrollTop = els.chat.scrollHeight;
  }

  function selectCampaign(id) {
    state.selectedId = id;
    els.list.querySelectorAll(".campaign").forEach(function (card) {
      card.classList.toggle("is-selected", card.dataset.id === id);
    });

    var c = find(id);
    if (c && c.date) {
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
      date: null,      /* a draft has no schedule until it is confirmed */
      time: null,
      title: "",
      message: "",
      lists: [],
      contacts: []
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

  els.editor.addEventListener("input", function () {
    var c = find(state.selectedId);
    if (c) {
      c.message = els.editor.textContent;
      var card = els.list.querySelector('.campaign[data-id="' + c.id + '"] .campaign__excerpt');
      if (card) {
        card.textContent = c.message || "This campaign has no message yet.";
        card.classList.toggle("is-empty", !c.message);
      }
    }
    renderLiveBubble();
  });

  els.title.addEventListener("input", function () {
    var c = find(state.selectedId);
    if (!c) return;
    c.title = els.title.textContent;
    var card = els.list.querySelector('.campaign[data-id="' + c.id + '"] .campaign__title');
    if (card) card.textContent = c.title || "Untitled campaign";
  });

  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelectorAll(".nav-item").forEach(function (o) { o.classList.remove("is-active"); });
      item.classList.add("is-active");
    });
  });

  /* --------------------------------------------- confirm and cancel */

  function goToTab(status) {
    var tab = document.querySelector('.segmented__item[data-status="' + status + '"]');
    if (tab) tab.click();
  }

  /* Confirming a draft is what schedules it — that is the only way a
     campaign leaves the Draft tab. It takes the date currently selected in
     the strip; a real Set Schedule picker would supply it instead. */
  els.confirmBtn.addEventListener("click", function () {
    var c = find(state.selectedId);
    if (!c || c.status !== "draft") return;

    c.status = "scheduled";
    c.date = state.selectedDate;
    c.time = c.time || "12:00";
    if (!c.title) c.title = "Untitled campaign";

    goToTab("scheduled");
    selectCampaign(c.id);
  });

  /* Cancelling a draft that has been typed into asks before throwing it away. */
  function hasContent(c) {
    return !!c && (c.title.trim() !== "" || c.message.trim() !== "");
  }

  function openSavePrompt() {
    els.saveBackdrop.hidden = false;
    els.saveDraftBtn.focus();
    document.addEventListener("keydown", onModalKey);
  }

  function closeSavePrompt() {
    els.saveBackdrop.hidden = true;
    document.removeEventListener("keydown", onModalKey);
  }

  function onModalKey(e) {
    if (e.key === "Escape") closeSavePrompt();
  }

  els.cancelBtn.addEventListener("click", function () {
    var c = find(state.selectedId);
    if (c && c.status === "draft" && hasContent(c)) openSavePrompt();
  });

  els.saveBackdrop.addEventListener("mousedown", function (e) {
    if (e.target === els.saveBackdrop) closeSavePrompt();
  });

  els.saveDraftBtn.addEventListener("click", function () {
    closeSavePrompt();
    goToTab("draft");
    selectCampaign(state.selectedId);
  });

  els.discardBtn.addEventListener("click", function () {
    var i = CAMPAIGNS.indexOf(find(state.selectedId));
    if (i > -1) CAMPAIGNS.splice(i, 1);
    closeSavePrompt();

    renderStrip();
    renderList();
    var first = visible()[0];
    if (first) selectCampaign(first.id);
    else { els.title.textContent = ""; els.editor.textContent = ""; renderLiveBubble(); }
  });

  /* ------------------------------------------------- popover plumbing */

  /* A stack, not a single slot: the Repeat popover opens on top of the
     schedule popover, and opening it must not close its parent. Outside
     clicks and Escape only dismiss the topmost one. */
  var popStack = [];

  Object.defineProperty(window, "__popDepth", { get: function () { return popStack.length; } });

  function currentPop() { return popStack[popStack.length - 1] || null; }

  function showPop(pop, btn, onOpen, nested) {
    if (!nested) while (popStack.length) hidePop();
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    popStack.push({ pop: pop, btn: btn });
    if (onOpen) onOpen();
    if (popStack.length === 1) {
      document.addEventListener("mousedown", onPopOutside);
      document.addEventListener("keydown", onPopEscape);
    }
  }

  function hidePop() {
    var top = popStack.pop();
    if (!top) return;
    top.pop.hidden = true;
    top.btn.setAttribute("aria-expanded", "false");
    if (!popStack.length) {
      document.removeEventListener("mousedown", onPopOutside);
      document.removeEventListener("keydown", onPopEscape);
    }
  }

  function onPopOutside(e) {
    var top = currentPop();
    if (!top) return;
    if (!top.pop.contains(e.target) && !top.btn.contains(e.target)) hidePop();
  }
  function onPopEscape(e) {
    if (e.key !== "Escape") return;
    var top = currentPop();
    hidePop();
    if (top) top.btn.focus();
  }

  /* ------------------------------------------------------ set schedule */

  /* Three steps in one popover: pick the day, then the time, then confirm
     and set repeat. Edits are held in `pending` and only written to the
     campaign on Save, so Cancel genuinely cancels. */

  var DOW_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];   // Monday-first
  var ITEM_H = 44;
  var pending = null;
  var schedStep = "date";

  function blankRepeat() {
    return { freq: "none", days: [], ends: "never", endsOn: null, endsAfter: 4 };
  }

  function shortDate(d) {
    return DAY_LONG[d.getDay()] + ", " + d.getDate() + " " +
           MONTH[d.getMonth()].slice(0, 3) + " " + d.getFullYear();
  }
  function longDayDate(d) {
    return DAY_LONG[d.getDay()] + ", " + d.getDate() + " " +
           MONTH[d.getMonth()] + " " + d.getFullYear();
  }

  function repeatText(r) {
    if (!r || r.freq === "none") return "Send once";
    var base;
    if (r.freq === "daily") base = "Every day";
    else if (r.freq === "monthly") base = "Every month";
    else {
      var names = r.days.slice().sort(function (a, b) { return a - b; })
        .map(function (i) { return DAY_SHORT[(i + 1) % 7]; });
      base = names.length ? "Every week on " + names.join(", ") : "Every week";
    }
    if (r.ends === "on" && r.endsOn) return base + ", until " + shortDate(parse(r.endsOn));
    if (r.ends === "after") return base + ", " + r.endsAfter + " times";
    return base;
  }

  /* ---- step 1 · month grid ---- */

  function renderBigCal() {
    var first = state.schedMonth;
    els.bigMonth.textContent = MONTH[first.getMonth()];
    els.bigYear.textContent = first.getFullYear();

    var start = weekStart(first);
    var html = "";
    for (var i = 0; i < 42; i++) {
      var day = addDays(start, i);
      var iso = key(day);
      var past = day < TODAY && iso !== key(TODAY);

      var cls = "calcell";
      if (day.getMonth() !== first.getMonth()) cls += " calcell--out";
      if (iso === key(TODAY)) cls += " calcell--today";
      if (iso === pending.date) cls += " calcell--on";

      /* what is already booked that day, so you are not scheduling blind */
      var booked = CAMPAIGNS.filter(function (c) {
        return c.date === iso && c.status !== "draft" && c.id !== state.selectedId;
      });
      var tags = booked.slice(0, 2).map(function (c) {
        return '<span class="calcell__tag">' + c.title + "</span>";
      }).join("");
      if (booked.length > 2) {
        tags += '<span class="calcell__more">+' + (booked.length - 2) + " more</span>";
      }

      html += '<button type="button" class="' + cls + '" data-date="' + iso + '"' +
              (past ? " disabled" : "") +
              ' aria-label="' + longDate(day) +
              (booked.length ? " — " + booked.length + " already scheduled" : "") + '">' +
                '<span class="calcell__num">' + day.getDate() + "</span>" +
                (tags ? '<span class="calcell__tags">' + tags + "</span>" : "") +
              "</button>";
      if (i >= 27 && i % 7 === 6 && addDays(day, 1).getMonth() !== first.getMonth()) break;
    }
    els.bigGrid.innerHTML = html;

    els.bigGrid.querySelectorAll(".calcell:not([disabled])").forEach(function (cell) {
      cell.addEventListener("click", function () {
        pending.date = cell.dataset.date;
        renderBigCal();
        renderFoot();
      });
    });
  }

  /* ---- step 2 · time wheel ---- */

  /* Three snap-scrolling columns. The selected value is whichever item sits
     under the centre band, so scrolling and clicking both work. */
  var WHEEL_COLS = [
    { el: "wheelHour",   values: null, get: function () { return pending.hour; },   set: function (v) { pending.hour = v; } },
    { el: "wheelMinute", values: null, get: function () { return pending.minute; }, set: function (v) { pending.minute = v; } },
    { el: "wheelPeriod", values: ["AM", "PM"], get: function () { return pending.period; }, set: function (v) { pending.period = v; } }
  ];

  WHEEL_COLS[0].values = (function () {
    var out = []; for (var h = 1; h <= 12; h++) out.push(String(h)); return out;
  })();
  WHEEL_COLS[1].values = (function () {
    var out = []; for (var m = 0; m < 60; m += 5) out.push(m < 10 ? "0" + m : String(m)); return out;
  })();

  function buildWheels() {
    WHEEL_COLS.forEach(function (col) {
      var node = els[col.el];
      node.innerHTML = col.values.map(function (v) {
        return '<button type="button" class="wheel__item" data-value="' + v + '">' + v + "</button>";
      }).join("");
      node.querySelectorAll(".wheel__item").forEach(function (item, i) {
        item.addEventListener("click", function () {
          if (node._dragged) return;      /* the pointer was spinning, not picking */
          node.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
        });
      });
      node.addEventListener("scroll", function () {
        clearTimeout(node._t);
        node._t = setTimeout(function () { settleWheel(col); }, 90);
      });

      makeDraggable(node);
    });
  }

  /* Drag to spin, on top of native scrolling. Mouse only — touch and
     trackpad already scroll these natively, and hijacking that would fight
     the browser rather than help it. */
  function makeDraggable(node) {
    var down = false, startY = 0, startTop = 0;
    var wheel = node.closest(".wheel");

    node.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true;
      node._dragged = false;
      startY = e.clientY;
      startTop = node.scrollTop;
      node.style.scrollSnapType = "none";
      wheel.classList.add("is-dragging");
      node.setPointerCapture(e.pointerId);
    });

    node.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dy = e.clientY - startY;
      if (Math.abs(dy) > 3) node._dragged = true;
      node.scrollTop = startTop - dy;
    });

    function release() {
      if (!down) return;
      down = false;
      node.style.scrollSnapType = "";
      wheel.classList.remove("is-dragging");
      var i = Math.max(0, Math.min(node.children.length - 1, Math.round(node.scrollTop / ITEM_H)));
      node.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
    }
    node.addEventListener("pointerup", release);
    node.addEventListener("pointercancel", release);
  }

  function settleWheel(col) {
    var node = els[col.el];
    var i = Math.max(0, Math.min(col.values.length - 1, Math.round(node.scrollTop / ITEM_H)));
    col.set(col.values[i]);
    markWheel(col);
    renderFoot();
  }

  function markWheel(col) {
    var node = els[col.el];
    var current = col.get();
    node.querySelectorAll(".wheel__item").forEach(function (item) {
      item.classList.toggle("is-on", item.dataset.value === current);
    });
  }

  function syncWheels() {
    WHEEL_COLS.forEach(function (col) {
      var i = col.values.indexOf(col.get());
      if (i < 0) i = 0;
      els[col.el].scrollTop = i * ITEM_H;
      markWheel(col);
    });
  }

  function pendingTime24() {
    var h = +pending.hour % 12;
    if (pending.period === "PM") h += 12;
    return (h < 10 ? "0" + h : String(h)) + ":" + pending.minute;
  }

  function setPendingFrom24(hhmm) {
    var p = hhmm.split(":");
    var h = +p[0];
    pending.period = h >= 12 ? "PM" : "AM";
    pending.hour = String(h % 12 === 0 ? 12 : h % 12);
    var m = Math.round(+p[1] / 5) * 5;
    pending.minute = m >= 60 ? "55" : (m < 10 ? "0" + m : String(m));
  }

  /* ---- step machine ---- */

  var STEPS = {
    date: {
      heading: "Set your sending date",
      intro: "Pick the day this campaign goes out. You can change it any time before it sends.",
      cta: "Continue"
    },
    time: {
      heading: "Pick a time",
      intro: "Scroll to the hour this should land in your customer's chat.",
      cta: "Confirm"
    },
    summary: {
      heading: "Ready to schedule",
      intro: "Check the details, and set it to repeat if this should go out more than once.",
      cta: "Save"
    }
  };

  function goToStep(step) {
    schedStep = step;
    els.stepDate.hidden = step !== "date";
    els.stepTime.hidden = step !== "time";
    els.stepSummary.hidden = step !== "summary";

    els.schedPop.classList.toggle("is-time", step === "time");
    els.schedHeading.textContent = STEPS[step].heading;
    els.schedIntro.textContent = STEPS[step].intro;

    if (step === "date") renderBigCal();
    if (step === "time") syncWheels();
    if (step === "summary") renderSummary();
    renderFoot();
  }

  function renderSummary() {
    els.chosenDate.textContent =
      longDayDate(parse(pending.date)) + " · " + clockTime(pendingTime24());
    els.repeatValue.textContent = repeatText(pending.repeat);
  }

  function renderFoot() {
    els.schedNextBtn.textContent = STEPS[schedStep].cta;
    els.schedNextBtn.disabled = schedStep === "date" && !pending.date;

    if (schedStep === "date") {
      els.bigSummary.textContent = pending.date
        ? shortDate(parse(pending.date))
        : "Pick a date to continue";
    } else {
      els.bigSummary.textContent =
        "Sends " + shortDate(parse(pending.date)) + " at " + clockTime(pendingTime24()) +
        (pending.repeat.freq === "none" ? "" : " · " + repeatText(pending.repeat).toLowerCase());
    }
  }

  /* ---- recurrence ---- */

  /* Opens beside the schedule popover. Right is the default; it flips left
     when the schedule popover is already close to the viewport edge, which
     it usually is because it is right-aligned to its pill. */
  function placeRepeatPop() {
    els.repeatPop.classList.remove("flip-left");
    var r = els.repeatPop.getBoundingClientRect();
    if (r.right > window.innerWidth - 12) els.repeatPop.classList.add("flip-left");
  }

  function renderRepeat() {
    var r = pending.repeat;

    els.repeatFreq.querySelectorAll(".timechip").forEach(function (chip) {
      chip.classList.toggle("is-on", chip.dataset.freq === r.freq);
    });
    els.repeatDaysWrap.hidden = r.freq !== "weekly";
    els.repeatEndsWrap.hidden = r.freq === "none";

    els.repeatDays.innerHTML = DOW_LETTERS.map(function (letter, i) {
      return '<button type="button" class="dow' + (r.days.indexOf(i) > -1 ? " is-on" : "") +
             '" data-dow="' + i + '" aria-label="' + DAY_LONG[(i + 1) % 7] + '">' + letter + "</button>";
    }).join("");
    els.repeatDays.querySelectorAll(".dow").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = +btn.dataset.dow;
        var at = r.days.indexOf(i);
        if (at > -1) r.days.splice(at, 1); else r.days.push(i);
        renderRepeat();
      });
    });

    els.repeatEnds.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.checked = radio.value === r.ends;
    });
    els.endsOn.value = r.endsOn || key(addDays(parse(pending.date), 28));
    els.endsAfter.value = r.endsAfter;

    els.repeatSummary.textContent = repeatText(r);
    els.repeatValue.textContent = repeatText(r);
  }

  els.repeatBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (currentPop() && currentPop().pop === els.repeatPop) return hidePop();
    showPop(els.repeatPop, els.repeatBtn, function () {
      renderRepeat();
      placeRepeatPop();
    }, true);   /* nested */
  });
  els.repeatFreq.addEventListener("click", function (e) {
    var chip = e.target.closest(".timechip");
    if (!chip) return;
    pending.repeat.freq = chip.dataset.freq;
    if (chip.dataset.freq === "weekly" && !pending.repeat.days.length) {
      pending.repeat.days = [(parse(pending.date).getDay() + 6) % 7];
    }
    renderRepeat();
  });
  els.repeatEnds.addEventListener("change", function (e) {
    if (e.target.type === "radio") pending.repeat.ends = e.target.value;
    if (e.target === els.endsOn) { pending.repeat.ends = "on"; pending.repeat.endsOn = els.endsOn.value; }
    if (e.target === els.endsAfter) { pending.repeat.ends = "after"; pending.repeat.endsAfter = +els.endsAfter.value || 1; }
    renderRepeat();
  });
  els.repeatEnds.addEventListener("input", function (e) {
    if (e.target === els.endsOn) pending.repeat.endsOn = els.endsOn.value;
    if (e.target === els.endsAfter) pending.repeat.endsAfter = +els.endsAfter.value || 1;
    renderRepeat();
  });
  els.repeatDone.addEventListener("click", function () {
    hidePop();
    renderSummary();
    renderFoot();
  });

  /* ---- open, advance, save ---- */

  els.schedBtn.addEventListener("click", function () {
    if (currentPop() && currentPop().pop === els.schedPop) return hidePop();
    var c = find(state.selectedId);
    if (!c) return;

    pending = {
      date: c.date || null,
      repeat: c.repeat ? JSON.parse(JSON.stringify(c.repeat)) : blankRepeat()
    };
    setPendingFrom24(c.time || "15:00");

    var base = pending.date ? parse(pending.date) : TODAY;
    state.schedMonth = new Date(base.getFullYear(), base.getMonth(), 1);

    showPop(els.schedPop, els.schedBtn, function () {
      goToStep(pending.date ? "summary" : "date");
    });
  });

  els.schedNextBtn.addEventListener("click", function () {
    if (schedStep === "date") return goToStep("time");
    if (schedStep === "time") return goToStep("summary");

    var c = find(state.selectedId);
    if (!c || !pending.date) return;
    c.date = pending.date;
    c.time = pendingTime24();
    c.repeat = pending.repeat.freq === "none" ? null : pending.repeat;
    state.selectedDate = c.date;
    state.week = weekStart(parse(c.date));
    hidePop();
    renderStrip();
    renderList();
    renderComposer();
  });

  els.schedCancel.addEventListener("click", hidePop);
  els.backToDate.addEventListener("click", function () { goToStep("date"); });

  els.bigPrev.addEventListener("click", function () {
    state.schedMonth = new Date(state.schedMonth.getFullYear(), state.schedMonth.getMonth() - 1, 1);
    renderBigCal();
  });
  els.bigNext.addEventListener("click", function () {
    state.schedMonth = new Date(state.schedMonth.getFullYear(), state.schedMonth.getMonth() + 1, 1);
    renderBigCal();
  });
  els.bigToday.addEventListener("click", function () {
    state.schedMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    renderBigCal();
  });

  buildWheels();

  /* ---------------------------------------------------- select contact */

  var CHECK = '<svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
  }

  function renderPick() {
    var c = find(state.selectedId);
    if (!c) return;
    var q = els.pickSearch.value.trim().toLowerCase();

    var lists = AUDIENCES.filter(function (l) { return !q || l.name.toLowerCase().indexOf(q) > -1; });
    var people = CONTACTS.filter(function (p) {
      return !q || p.name.toLowerCase().indexOf(q) > -1 || p.phone.indexOf(q) > -1;
    });

    var html = "";
    if (lists.length) {
      html += '<p class="picksection">Lists</p>';
      lists.forEach(function (l) {
        var on = c.lists.indexOf(l.id) > -1;
        html += '<button type="button" class="pickrow' + (on ? " is-on" : "") +
                '" data-kind="list" data-id="' + l.id + '">' +
                  '<span class="pickrow__avatar">' + l.count + "</span>" +
                  '<span class="pickrow__meta">' +
                    '<span class="pickrow__name">' + l.name + "</span>" +
                    '<span class="pickrow__sub">' + l.count + " people</span>" +
                  "</span>" +
                  '<span class="pickrow__check">' + CHECK + "</span>" +
                "</button>";
      });
    }
    if (people.length) {
      html += '<p class="picksection">People</p>';
      people.forEach(function (pp) {
        var on = c.contacts.indexOf(pp.id) > -1;
        html += '<button type="button" class="pickrow' + (on ? " is-on" : "") +
                '" data-kind="person" data-id="' + pp.id + '">' +
                  '<span class="pickrow__avatar">' + initials(pp.name) + "</span>" +
                  '<span class="pickrow__meta">' +
                    '<span class="pickrow__name">' + pp.name + "</span>" +
                    '<span class="pickrow__sub">' + pp.phone + "</span>" +
                  "</span>" +
                  '<span class="pickrow__check">' + CHECK + "</span>" +
                "</button>";
      });
    }
    if (!lists.length && !people.length) {
      html = '<p class="pickempty">Nothing matches “' + els.pickSearch.value + '”</p>';
    }

    els.pickList.innerHTML = html;
    els.pickList.querySelectorAll(".pickrow").forEach(function (row) {
      row.addEventListener("click", function () { togglePick(row.dataset.kind, row.dataset.id); });
    });

    var total = recipientCount(c);
    els.pickSummary.textContent = total
      ? total + (total === 1 ? " person" : " people") + " · " + audienceLabel(c)
      : "No one selected";
    els.contactLabel.textContent = total ? audienceLabel(c) : "Select Contact";
  }

  function togglePick(kind, id) {
    var c = find(state.selectedId);
    if (!c) return;
    var arr = kind === "list" ? c.lists : c.contacts;
    var i = arr.indexOf(id);
    if (i > -1) arr.splice(i, 1); else arr.push(id);

    renderPick();
    renderComposer();

    var foot = els.list.querySelector('.campaign[data-id="' + c.id + '"] .campaign__foot');
    if (foot) foot.innerHTML = stackMarkup(recipientCount(c));
  }

  els.contactBtn.addEventListener("click", function () {
    if (currentPop() && currentPop().pop === els.contactPop) return hidePop();
    els.pickSearch.value = "";
    showPop(els.contactPop, els.contactBtn, function () {
      renderPick();
      els.pickSearch.focus();
    });
  });
  els.pickSearch.addEventListener("input", renderPick);
  els.pickDone.addEventListener("click", hidePop);

  /* keep both pill labels honest when the selection changes elsewhere */
  var baseRenderComposer = renderComposer;
  renderComposer = function () {
    baseRenderComposer();
    var c = find(state.selectedId);
    if (!c) return;
    els.contactLabel.textContent = recipientCount(c) ? audienceLabel(c) : "Select Contact";
    els.schedLabel.textContent = c.date
      ? parse(c.date).getDate() + " " + MONTH[parse(c.date).getMonth()].slice(0, 3) +
        ", " + clockTime(c.time || "15:00") + (c.repeat ? " ↻" : "")
      : "Set Schedule";
  };

  /* -------------------------------------------------------------- boot */

  renderStrip();
  renderList();
  renderComposer();
})();
