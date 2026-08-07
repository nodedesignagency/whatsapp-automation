/* =====================================================================
   Auth — sign in / sign up.

   One card, two modes. There is no backend yet, so submitting only proves
   the flow: validate, show the pending state, then hand off to the app.
   Swap fakeSubmit for the real call when the API exists.
   ===================================================================== */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };

  var els = {
    form: $("#authForm"),
    title: $("#authTitle"),
    sub: $("#authSub"),
    nameField: $("#nameField"),
    nameInput: $("#nameInput"),
    email: $("#emailInput"),
    password: $("#passwordInput"),
    peek: $("#peekBtn"),
    termsRow: $("#termsRow"),
    terms: $("#termsInput"),
    forgot: $("#forgotLink"),
    error: $("#authError"),
    submit: $("#submitBtn"),
    submitLabel: $("#submitLabel"),
    divider: document.querySelector(".authdiv span"),
    swapText: $("#swapText"),
    swapBtn: $("#swapBtn")
  };

  /* Everything that differs between the two modes lives here, so the mode
     switch is data rather than a pile of branches. */
  var MODES = {
    signin: {
      title: "Sign in with email",
      sub: "Schedule campaigns and keep every customer in the loop.",
      submit: "Get Started",
      divider: "Or sign in with",
      swapText: "New here?",
      swapBtn: "Create an account",
      autocomplete: "current-password"
    },
    signup: {
      title: "Create your account",
      sub: "Set up your workspace, then connect your WhatsApp number.",
      submit: "Create account",
      divider: "Or sign up with",
      swapText: "Already have an account?",
      swapBtn: "Sign in",
      autocomplete: "new-password"
    }
  };

  var mode = "signin";

  /* ---------------------------------------------------------- validity */

  /* Deliberately loose: enough to catch a typo, not so strict it rejects a
     valid address. The server is the real authority. */
  function emailLooksValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  }

  /* Returns the first thing wrong, as {field, message}, or null. The button
     stays enabled and the answer comes on submit: a dead button on a login
     form tells you nothing about why it is dead. */
  function firstProblem() {
    if (mode === "signup" && els.nameInput.value.trim() === "") {
      return { field: els.nameInput, message: "Enter your business name." };
    }
    if (!emailLooksValid(els.email.value)) {
      return { field: els.email, message: "Enter a valid email address." };
    }
    if (els.password.value.length < 8) {
      return { field: els.password, message: "Password must be at least 8 characters." };
    }
    if (mode === "signup" && !els.terms.checked) {
      return { field: els.terms, message: "Accept the Terms to continue." };
    }
    return null;
  }

  function showError(message) {
    els.error.textContent = message;
    els.error.hidden = !message;
  }

  /* -------------------------------------------------------------- mode */

  function setMode(next) {
    mode = next;
    var m = MODES[next];

    els.title.textContent = m.title;
    els.sub.textContent = m.sub;
    els.submitLabel.textContent = m.submit;
    els.divider.textContent = m.divider;
    els.swapText.textContent = m.swapText;
    els.swapBtn.textContent = m.swapBtn;

    var signup = next === "signup";
    els.nameField.hidden = !signup;
    els.termsRow.hidden = !signup;
    els.forgot.hidden = signup;      /* nothing to forget on a new account */
    els.password.setAttribute("autocomplete", m.autocomplete);
    els.password.placeholder = signup ? "Password (8+ characters)" : "Password";

    showError("");
  }

  /* ------------------------------------------------------------ events */

  ["input", "change"].forEach(function (evt) {
    els.form.addEventListener(evt, function () {
      if (!els.error.hidden) showError("");
    });
  });

  els.peek.addEventListener("click", function () {
    var shown = els.peek.getAttribute("aria-pressed") === "true";
    els.peek.setAttribute("aria-pressed", shown ? "false" : "true");
    els.peek.setAttribute("aria-label", shown ? "Show password" : "Hide password");
    els.password.type = shown ? "password" : "text";
    els.password.focus();
  });

  els.swapBtn.addEventListener("click", function () {
    setMode(mode === "signin" ? "signup" : "signin");
    (mode === "signup" ? els.nameInput : els.email).focus();
  });

  els.forgot.addEventListener("click", function (e) {
    e.preventDefault();
    showError(emailLooksValid(els.email.value)
      ? "Reset link sent to " + els.email.value.trim() + "."
      : "Enter your email address first and we'll send a reset link.");
  });

  els.form.addEventListener("submit", function (e) {
    e.preventDefault();

    var problem = firstProblem();
    if (problem) {
      showError(problem.message);
      problem.field.focus();
      return;
    }

    els.submit.disabled = true;
    els.submitLabel.textContent = mode === "signup" ? "Creating account…" : "Signing in…";

    /* Stands in for the API. The real one returns a session and the same
       redirect happens; a failure calls showError instead. */
    fakeSubmit(function () {
      window.location.href = "index.html";
    });
  });

  function fakeSubmit(done) {
    window.setTimeout(done, 900);
  }

  /* Social buttons are wired to nothing until the providers exist — say so
     rather than failing silently. */
  document.querySelectorAll(".social__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var who = btn.getAttribute("aria-label").replace("Continue with ", "");
      showError(who + " sign-in is not connected yet. Use your email for now.");
    });
  });

  /* -------------------------------------------------------------- boot */

  setMode("signin");
  els.email.focus();
})();
