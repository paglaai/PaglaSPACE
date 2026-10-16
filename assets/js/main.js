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
        trackEvent("theme_toggle", { theme: next });
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
    var navLinks = nav.querySelectorAll("a");
    for (var k = 0; k < navLinks.length; k++) {
      navLinks[k].addEventListener("click", function () {
        if (isOpen()) {
          setOpen(false);
        }
      });
    }
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

  /* ---- Analytics event helper ---- */
  function trackEvent(name, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }

  /* ---- Search dialog ---- */
  var PAGE_INDEX = [
    { title: "Home", href: "index.html", context: "The local AI ecosystem for Apple Silicon" },
    { title: "PaglaMLX", href: "products/paglamlx.html", context: "LLM orchestration and local model server for Apple Silicon" },
    { title: "PaglaGPT", href: "products/paglagpt.html", context: "Official AI Architect of the PaglaAI ecosystem" },
    { title: "Getting Started", href: "docs/index.html", context: "Documentation, installation, quickstart, and configuration" },
    { title: "API Reference", href: "api/reference.html", context: "Standard /v1/chat/completions endpoint specification" },
    { title: "BrandKit", href: "brand/index.html", context: "Brand assets, Pagla Face mark, wordmarks, and guidelines" },
    { title: "Pagla Sans Specimen", href: "pagla-sans/specimen.html", context: "Interactive typography specimen for Pagla Sans" },
    { title: "Blog", href: "blog/index.html", context: "Engineering articles, architecture notes, and release logs" },
    { title: "About", href: "about/index.html", context: "Ecosystem philosophy, local hardware values, and governance" },
    { title: "Sitemap", href: "sitemap.html", context: "Complete index of all site pages and repositories" },
    { title: "Agent tooling: MCP + RAG", href: "blog/agent-tooling-mcp-rag.html", context: "Deterministic BM25 retrieval over the design authority" },
    { title: "PaglaDESIGN v1.3 — Agent manual", href: "blog/pagladesign-v1-3-agent-manual.html", context: "The agent operating manual moves into the design authority" },
    { title: "PaglaDESIGN v1.2 — Maturation pass", href: "blog/pagladesign-v1-2-maturation-pass.html", context: "Interaction patterns, component library, and mockups" },
    { title: "PaglaDESIGN v1.0 — Reference CSS", href: "blog/pagladesign-v1-0-reference-css.html", context: "The design authority ships tokens, base, utilities, and site CSS" },
    { title: "PaglaROUTER 2.6.0 — GitHub-first", href: "blog/paglarouter-2-6-0-github-first.html", context: "Gateway moves to native GitHub Pages and PaglaAI identity" },
    { title: "PaglaMLX 1.5.0 — Rebranding", href: "blog/paglamlx-1-5-0-rebranding.html", context: "Renames into family, ships docs and release pipeline" },
    { title: "What the reference shelf taught us", href: "blog/reference-shelf-taught-us.html", context: "The design lessons that shaped PaglaDESIGN" }
  ];

  function initSearch() {
    var triggers = document.querySelectorAll("[data-search-open]");
    var dialog = document.querySelector("[data-search-dialog]");
    if (!dialog) {
      return;
    }
    var input = dialog.querySelector("[data-search-input]");
    var results = dialog.querySelector("[data-search-results]");
    var empty = dialog.querySelector("[data-search-empty]");
    var closeBtn = dialog.querySelector("[data-search-close]");

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
        empty.hidden = hits.length > 0 || !q.trim();
      }
      for (var i = 0; i < hits.length; i++) {
        var li = document.createElement("li");
        li.className = "search-dialog__result";
        var a = document.createElement("a");
        a.href = root + hits[i].href;
        var title = document.createElement("span");
        title.className = "search-dialog__result-title";
        title.textContent = hits[i].title;
        var ctx = document.createElement("span");
        ctx.className = "search-dialog__result-context";
        ctx.textContent = hits[i].context;
        a.appendChild(title);
        a.appendChild(ctx);
        li.appendChild(a);
        results.appendChild(li);
      }
    }

    function openDialog() {
      dialog.showModal();
      if (input) {
        input.value = "";
        render("");
        input.focus();
      }
    }

    for (var t = 0; t < triggers.length; t++) {
      triggers[t].addEventListener("click", openDialog);
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        dialog.close();
      });
    }

    dialog.addEventListener("click", function (e) {
      var rect = dialog.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        dialog.close();
      }
    });

    if (input) {
      var debounceTimer;
      input.addEventListener("input", function () {
        render(input.value);
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          if (input.value.trim().length > 2) {
            trackEvent("search", { search_term: input.value.trim() });
          }
        }, 500);
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
