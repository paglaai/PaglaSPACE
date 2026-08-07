/* ==========================================================================
   PaglaAI.space — Site script
   Vanilla JS only. Behaviors follow design-system/UX_PATTERNS.md:
   fast transitions, roving tabindex tabs, copy with confirmation, chips with
   non-color selection, search as a dialog with focus return.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "paglaai-theme";

  /* ---- Theme ---- */
  function storedTheme() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* storage unavailable; theme applies for this visit only */
    }
  }

  function prefersDark() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function applyTheme(theme, remember) {
    var root = document.documentElement;
    var isDark = theme === "dark";
    if (isDark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    if (remember) {
      storeTheme(isDark ? "dark" : "light");
    }
    var toggles = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute("aria-pressed", isDark ? "true" : "false");
      toggles[i].setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      var labels = toggles[i].querySelectorAll("[data-theme-label]");
      for (var j = 0; j < labels.length; j++) {
        labels[j].textContent = isDark ? "Light" : "Dark";
      }
    }
  }

  function initTheme() {
    var saved = storedTheme();
    if (saved === "dark" || saved === "light") {
      applyTheme(saved, false);
    } else {
      applyTheme(prefersDark() ? "dark" : "light", false);
    }
    var toggles = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener("click", function () {
        var next =
          document.documentElement.getAttribute("data-theme") === "dark"
            ? "light"
            : "dark";
        applyTheme(next, true);
      });
    }
  }

  /* ---- Mobile menu ---- */
  function initMenu() {
    var trigger = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (!trigger || !nav) {
      return;
    }
    function isOpen() {
      return nav.getAttribute("data-open") === "true";
    }
    function setOpen(open) {
      nav.setAttribute("data-open", open ? "true" : "false");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var first = nav.querySelector("a");
        if (first) {
          first.focus();
        }
      } else {
        trigger.focus();
      }
    }
    trigger.addEventListener("click", function () {
      setOpen(!isOpen());
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) {
        setOpen(false);
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 640 && isOpen()) {
        setOpen(false);
      }
    });
  }

  /* ---- Tabs (roving tabindex) ---- */
  function initTabs(root) {
    var tablist = root.querySelector(".tabs__list");
    if (!tablist) {
      return;
    }
    var tabs = Array.prototype.slice.call(
      tablist.querySelectorAll(".tabs__tab")
    );
    var panels = Array.prototype.slice.call(
      root.querySelectorAll(".tabs__panel")
    );
    function select(index, focus) {
      for (var i = 0; i < tabs.length; i++) {
        var selected = i === index;
        tabs[i].setAttribute("aria-selected", selected ? "true" : "false");
        tabs[i].tabIndex = selected ? 0 : -1;
        if (panels[i]) {
          panels[i].hidden = !selected;
        }
      }
      if (focus !== false && tabs[index]) {
        tabs[index].focus();
      }
    }
    function current() {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].getAttribute("aria-selected") === "true") {
          return i;
        }
      }
      return 0;
    }
    select(current(), false);
    tablist.addEventListener("click", function (e) {
      var tab = e.target.closest(".tabs__tab");
      if (!tab) {
        return;
      }
      select(tabs.indexOf(tab));
    });
    tablist.addEventListener("keydown", function (e) {
      var index = current();
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        next = (index + 1) % tabs.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        next = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        next = 0;
      } else if (e.key === "End") {
        next = tabs.length - 1;
      }
      if (next !== null) {
        e.preventDefault();
        select(next);
      }
    });
  }

  function initAllTabs() {
    var groups = document.querySelectorAll("[data-tabs]");
    for (var i = 0; i < groups.length; i++) {
      initTabs(groups[i]);
    }
  }

  /* ---- Copy buttons ---- */
  function initCopy() {
    var buttons = document.querySelectorAll("[data-copy]");
    for (var i = 0; i < buttons.length; i++) {
      (function (button) {
        button.addEventListener("click", function () {
          var target = document.querySelector(button.getAttribute("data-copy"));
          if (!target) {
            return;
          }
          var text = target.innerText;
          var done = function () {
            button.setAttribute("data-copied", "true");
            button.textContent = "Copied";
            setTimeout(function () {
              button.setAttribute("data-copied", "false");
              button.textContent = "Copy";
            }, 2000);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, done);
          } else {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "absolute";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            try {
              document.execCommand("copy");
              done();
            } catch (e) {
              /* no clipboard support */
            }
            document.body.removeChild(ta);
          }
        });
      })(buttons[i]);
    }
  }

  /* ---- Blog chips filter ---- */
  function initChips() {
    var chips = document.querySelectorAll("[data-chip]");
    if (!chips.length) {
      return;
    }
    var cards = document.querySelectorAll("[data-post]");
    var live = document.querySelector("[data-chip-live]");
    function currentFilter() {
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].getAttribute("aria-pressed") === "true") {
          return chips[i].getAttribute("data-chip");
        }
      }
      return "all";
    }
    function apply(filter) {
      var shown = 0;
      for (var i = 0; i < cards.length; i++) {
        var type = cards[i].getAttribute("data-post");
        var visible = filter === "all" || type === filter;
        cards[i].hidden = !visible;
        if (visible) {
          shown++;
        }
      }
      if (live) {
        live.textContent =
          shown === 1 ? "1 post" : shown + " posts";
      }
    }
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener("click", function () {
        for (var j = 0; j < chips.length; j++) {
          chips[j].setAttribute(
            "aria-pressed",
            chips[j] === this ? "true" : "false"
          );
        }
        apply(this.getAttribute("data-chip"));
      });
    }
    apply(currentFilter());
  }

  /* ---- Search dialog ---- */
  var PAGE_INDEX = [
    { title: "Home", href: "index.html", context: "The local AI ecosystem" },
    { title: "PaglaMLX", href: "products/paglamlx.html", context: "LLM orchestration for Apple Silicon" },
    { title: "Getting Started", href: "docs/index.html", context: "Documentation — install and quick start" },
    { title: "API Reference", href: "api/reference.html", context: "POST /v1/chat/completions" },
    { title: "BrandKit", href: "brand/index.html", context: "How to represent PaglaAI" },
    { title: "Blog", href: "blog/index.html", context: "Progress, documented" },
    { title: "About", href: "about/index.html", context: "Who is behind the ecosystem" },
    { title: "404", href: "404.html", context: "Page not found" }
  ];

  function initSearch() {
    var trigger = document.querySelector("[data-search-open]");
    if (!trigger) {
      return;
    }
    var dialog = document.querySelector("[data-search-dialog]");
    if (!dialog) {
      return;
    }
    var input = dialog.querySelector("[data-search-input]");
    var results = dialog.querySelector("[data-search-results]");
    var empty = dialog.querySelector("[data-search-empty]");

    function query(q) {
      var text = q.trim().toLowerCase();
      var out = [];
      if (!text) {
        return out;
      }
      for (var i = 0; i < PAGE_INDEX.length; i++) {
        var page = PAGE_INDEX[i];
        var hay = (page.title + " " + page.context).toLowerCase();
        if (hay.indexOf(text) !== -1) {
          out.push(page);
        }
      }
      return out;
    }

    function render(q) {
      var hits = query(q);
      var root = dialog.getAttribute("data-root") || "";
      results.textContent = "";
      if (empty) {
        empty.hidden = hits.length > 0;
      }
      for (var i = 0; i < hits.length; i++) {
        var li = document.createElement("li");
        li.className = "search-dialog__result";
        var a = document.createElement("a");
        a.href = root + hits[i].href;
        var title = document.createElement("span");
        title.textContent = hits[i].title;
        a.appendChild(title);
        li.appendChild(a);
        results.appendChild(li);
      }
    }

    trigger.addEventListener("click", function () {
      dialog.showModal();
      if (input) {
        input.value = "";
        render("");
        input.focus();
      }
    });

    if (input) {
      input.addEventListener("input", function () {
        render(input.value);
      });
    }
  }

  /* ---- In-page TOC current marker ---- */
  function initToc() {
    var tocLinks = Array.prototype.slice.call(
      document.querySelectorAll(".docs-toc__link")
    );
    if (!tocLinks.length) {
      return;
    }
    var targets = tocLinks
      .map(function (a) {
        var id = a.getAttribute("href");
        if (id && id.charAt(0) === "#") {
          return document.querySelector(id);
        }
        return null;
      })
      .filter(Boolean);
    var onScroll = function () {
      var pos = window.scrollY + 120;
      var current = -1;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].offsetTop <= pos) {
          current = i;
        }
      }
      for (var j = 0; j < tocLinks.length; j++) {
        tocLinks[j].setAttribute(
          "aria-current",
          j === current ? "true" : "false"
        );
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initMenu();
    initAllTabs();
    initCopy();
    initChips();
    initSearch();
    initToc();
  });
})();
