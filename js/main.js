(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Active nav link (tab-bar + mobile nav) ---------- */
  var segs = window.location.pathname.split("/").filter(Boolean);
  var here = segs.length ? segs[0] : "index";
  document.querySelectorAll("a[data-page]").forEach(function (link) {
    if (link.getAttribute("data-page") === here) link.classList.add("active");
  });

  /* ---------- Header on scroll ---------- */
  var header = document.getElementById("siteHeader");
  var lastScrollState = false;
  function updateHeader() {
    if (!header) return;
    var y = window.scrollY;
    var scrolled = lastScrollState ? y > 8 : y > 28;
    if (scrolled !== lastScrollState) {
      header.classList.toggle("scrolled", scrolled);
      lastScrollState = scrolled;
    }
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Mobile menu ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("open");
      menuToggle.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        menuToggle.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Reveal on scroll (fail-safe: content is visible by default in CSS;
     JS only "arms" the hidden pre-animation state, so any JS/observer failure
     never leaves content permanently invisible) ---------- */
  try {
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal, .reveal-scale"));

    if (!reduceMotion && "IntersectionObserver" in window && revealEls.length) {
      revealEls.forEach(function (el, i) {
        el.classList.add("reveal-armed");
        el.style.transitionDelay = (i % 4) * 70 + "ms";
      });

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
      );
      revealEls.forEach(function (el) { observer.observe(el); });

      /* Safety net: if for any reason an element never intersects
         (e.g. unusual viewport/webview quirks), force it visible after 4s. */
      window.setTimeout(function () {
        revealEls.forEach(function (el) { el.classList.add("is-visible"); });
      }, 4000);
    }
    /* else: elements simply stay at their default fully-visible CSS state */
  } catch (err) {
    /* If anything above throws, content remains visible (default CSS state). */
  }

  /* ---------- Animated counters ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  function animateCounter(el) {
    var target = el.getAttribute("data-count");
    var suffix = el.getAttribute("data-suffix") || "";
    var numeric = parseFloat(target);
    if (isNaN(numeric)) { el.textContent = target; return; }
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(numeric * eased);
      el.textContent = current + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
    } else {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach(function (el) { counterObserver.observe(el); });
    }
  }

  /* ---------- Accordion (Servicios) ---------- */
  var accItems = Array.prototype.slice.call(document.querySelectorAll(".acc-item"));
  accItems.forEach(function (item, idx) {
    var head = item.querySelector(".acc-head");
    if (!head) return;
    head.addEventListener("click", function () {
      var wasOpen = item.classList.contains("open");
      accItems.forEach(function (other) { other.classList.remove("open"); });
      if (!wasOpen) item.classList.add("open");
    });
  });
  if (accItems.length) accItems[0].classList.add("open");

  /* ---------- Accordion (Preguntas Frecuentes) ---------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));
  faqItems.forEach(function (item) {
    var head = item.querySelector(".faq-head");
    if (!head) return;
    head.addEventListener("click", function () {
      var wasOpen = item.classList.contains("open");
      faqItems.forEach(function (other) { other.classList.remove("open"); });
      if (!wasOpen) item.classList.add("open");
    });
  });

  /* ---------- View toggle (Nosotros: Historia / Por qué RCC) ---------- */
  var toggleBtns = Array.prototype.slice.call(document.querySelectorAll(".view-toggle button"));
  var panes = Array.prototype.slice.call(document.querySelectorAll(".view-pane"));
  toggleBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-view");
      toggleBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
      panes.forEach(function (p) { p.classList.toggle("active", p.getAttribute("data-pane") === target); });
    });
  });

  /* ---------- Smooth-scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var headerHeight = (header ? header.offsetHeight : 0) + 16;
      var top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });
  /* ---------- Aviso de cookies / privacidad ---------- */
  try {
    var COOKIE_FLAG = "rcc_cookie_ack";
    var banner = document.getElementById("cookieBanner");
    if (banner) {
      var alreadySeen = false;
      try { alreadySeen = window.localStorage.getItem(COOKIE_FLAG) === "1"; } catch (e) { alreadySeen = false; }
      if (!alreadySeen) {
        window.setTimeout(function () { banner.classList.add("visible"); }, 600);
      } else {
        banner.remove();
      }
      var acceptBtn = document.getElementById("cookieAccept");
      if (acceptBtn) {
        acceptBtn.addEventListener("click", function () {
          banner.classList.remove("visible");
          try { window.localStorage.setItem(COOKIE_FLAG, "1"); } catch (e) { /* storage unavailable, banner just hides for this view */ }
          window.setTimeout(function () { banner.remove(); }, 500);
        });
      }
    }
  } catch (err) {
    /* if anything above fails, the page still works normally without the banner */
  }

  /* ---------- Datos de contacto dinámicos (editables desde admin.html) ---------- */
  try {
    fetch("/data/contact.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;

        function replaceTrailingText(el, oldExact, newText) {
          for (var i = el.childNodes.length - 1; i >= 0; i--) {
            var n = el.childNodes[i];
            if (n.nodeType === 3 && n.textContent.trim() === oldExact) {
              n.textContent = newText;
              return;
            }
          }
        }

        var OLD_PHONE = "0982 393 530";
        var OLD_EMAIL = "info@rcc-consultores.com";
        var OLD_IG = "@rcc_consultores";

        document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
          a.href = "https://wa.me/" + data.whatsapp;
          replaceTrailingText(a, OLD_PHONE, data.whatsapp_display);
        });
        document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
          a.href = "tel:+" + data.whatsapp;
          replaceTrailingText(a, OLD_PHONE, data.whatsapp_display);
        });
        document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
          a.href = "mailto:" + data.email;
          replaceTrailingText(a, OLD_EMAIL, data.email);
        });
        document.querySelectorAll('a[href*="instagram.com/"]').forEach(function (a) {
          a.href = data.instagram_url;
          replaceTrailingText(a, OLD_IG, data.instagram_handle_display);
        });
        var form = document.querySelector(".contacto-form");
        if (form && form.action && form.action.indexOf("formsubmit.co/") !== -1) {
          form.action = "https://formsubmit.co/" + data.email;
        }
        if (data.photos_version) {
          document.querySelectorAll('img[src^="/images/reyna-green.jpg"], img[src^="/images/reyna-black.jpg"]').forEach(function (img) {
            img.src = img.src.split("?")[0] + "?v=" + data.photos_version;
          });
        }
      })
      .catch(function () { /* si falla, la página se queda con los valores fijos actuales */ });
  } catch (err) { /* nunca romper el resto del sitio por esto */ }
})();
