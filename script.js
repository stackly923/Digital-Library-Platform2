document
  .querySelector(".nav-toggle")
  ?.addEventListener("click", () =>
    document.querySelector("nav")?.classList.toggle("open"),
  );

document.querySelector(".site-footer")?.setAttribute("id", "site-footer");
document.querySelectorAll(".site-footer a[href^='404.html']").forEach((link) => {
  const currentPage = location.pathname.split("/").pop() || "index.html";
  const returnTarget = `${currentPage}#site-footer`;
  link.href = `404.html?from=footer&return=${encodeURIComponent(returnTarget)}`;
  link.addEventListener("click", () => {
    sessionStorage.setItem("stackly404Return", returnTarget);
  });
});

const backToSection = document.querySelector("#backToSection");
if (backToSection) {
  const params = new URLSearchParams(location.search);
  const target = params.get("return");
  const isFooterReturn = params.get("from") === "footer";
  if (isFooterReturn && target && !target.startsWith("http")) {
    backToSection.setAttribute("href", target);
  }
  backToSection.addEventListener("click", (e) => {
    e.preventDefault();
    if (isFooterReturn && target && !target.startsWith("http")) {
      location.href = target;
      return;
    }
    if (document.referrer) {
      history.back();
    } else {
      location.href = "index.html";
    }
  });
}

document.querySelectorAll('[name="firstName"], [name="lastName"]').forEach((input) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^A-Za-z\s]/g, "");
  });
});
document.querySelectorAll('[name="phone"]').forEach((input) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");
  });
});

document.querySelectorAll("[data-custom-select]").forEach((select) => {
  const trigger = select.querySelector(".custom-select-button");
  const valueText = trigger?.querySelector("span");
  const input = select
    .closest(".custom-select-label")
    ?.querySelector(".custom-select-value");
  const options = select.querySelectorAll('[role="option"]');

  trigger?.addEventListener("click", () => {
    const isOpen = select.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      if (valueText) valueText.textContent = option.textContent.trim();
      if (input) {
        input.value = option.textContent.trim();
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      select.classList.remove("open");
      trigger?.setAttribute("aria-expanded", "false");
    });
  });
});

document.addEventListener("click", (event) => {
  document.querySelectorAll("[data-custom-select].open").forEach((select) => {
    if (select.contains(event.target)) return;
    select.classList.remove("open");
    select
      .querySelector(".custom-select-button")
      ?.setAttribute("aria-expanded", "false");
  });
});

const roleCards = document.querySelectorAll(".role-card");
roleCards.forEach((c) =>
  c.addEventListener("click", () => {
    roleCards.forEach((x) => x.classList.remove("active"));
    c.classList.add("active");
  }),
);
const roleLogin = document.querySelector("#roleLogin");
if (roleLogin) {
  roleLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    const role =
      roleLogin.querySelector('input[name="role"]:checked')?.value || "member";
    const email = roleLogin.querySelector('[name="email"]')?.value.trim();
    sessionStorage.setItem("stacklyMember", "active");
    if (email) sessionStorage.setItem("stacklyUserEmail", email);
    location.href =
      role === "admin" ? "admin-dashboard.html" : "client-dashboard.html";
  });
}

const registerForm = document.querySelector("#registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = registerForm.querySelector('[name="password"]');
    const confirmPassword = registerForm.querySelector('[name="confirmPassword"]');

    if (password.value !== confirmPassword.value) {
      confirmPassword.setCustomValidity("Passwords do not match");
      confirmPassword.reportValidity();
      return;
    }

    confirmPassword.setCustomValidity("");
    const email = registerForm.querySelector('[name="email"]')?.value.trim();
    if (email) sessionStorage.setItem("stacklyUserEmail", email);
    location.href = "404.html";
  });
}

const dashboardUserEmail = document.querySelector(".dash-user small");
if (dashboardUserEmail) {
  const email = sessionStorage.getItem("stacklyUserEmail");
  dashboardUserEmail.textContent = email || "Signed in";
}

document
  .querySelectorAll("form:not(#roleLogin):not(#registerForm)")
  .forEach((f) =>
    f.addEventListener("submit", () =>
      sessionStorage.setItem("stacklyMember", "active"),
    ),
  );

document.querySelectorAll(".newsletter form").forEach((form) => {
  const resetNewsletterForm = () => form.reset();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    sessionStorage.setItem("stacklyNewsletterSubmitted", "true");
    resetNewsletterForm();
    location.href = "404.html";
  });

  window.addEventListener("pageshow", () => {
    if (sessionStorage.getItem("stacklyNewsletterSubmitted") !== "true") return;
    resetNewsletterForm();
    sessionStorage.removeItem("stacklyNewsletterSubmitted");
  });
});

const obs = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.style.opacity = "1";
        e.target.style.transform = "translateY(0)";
        obs.unobserve(e.target);
      }
    }),
  { threshold: 0.12 },
);
document.querySelectorAll(".editorial-section").forEach((el) => {
  el.style.opacity = ".15";
  el.style.transform = "translateY(18px)";
  el.style.transition = "opacity .7s ease,transform .7s ease";
  obs.observe(el);
});

// Dashboard sidebar routing: each dashboard button shows matching section content.
(function () {
  const links = [...document.querySelectorAll(".dash-menu a[data-view]")];
  const views = [...document.querySelectorAll(".dashboard-view")];
  if (!links.length || !views.length) return;
  const shell = document.querySelector(".dash-shell");
  const hamburger = document.querySelector(".dash-hamburger");
  const scrim = document.querySelector(".dash-scrim");
  const setMenuOpen = (open) => {
    shell?.classList.toggle("dash-menu-open", open);
    hamburger?.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("dash-lock", open);
  };
  hamburger?.addEventListener("click", () =>
    setMenuOpen(!shell?.classList.contains("dash-menu-open")),
  );
  scrim?.addEventListener("click", () => setMenuOpen(false));
  function showView(id, updateHash = true) {
    const target =
      document.getElementById(id) || document.getElementById("overview");
    if (!target) return;
    views.forEach((v) => v.classList.toggle("active", v === target));
    links.forEach((a) =>
      a.classList.toggle("active", a.dataset.view === target.id),
    );
    if (updateHash) history.replaceState(null, "", "#" + target.id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  links.forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showView(a.dataset.view);
    }),
  );
  document.querySelectorAll("[data-jump-view]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showView(a.dataset.jumpView);
    }),
  );
  const initial = location.hash.slice(1);
  if (initial && document.getElementById(initial)) showView(initial, false);
})();

const contactForm = document.querySelector("#contactForm");
if (contactForm) {
  const resetContactForm = () => {
    contactForm.reset();
    contactForm.querySelectorAll("[data-custom-select]").forEach((select) => {
      select.classList.remove("open");
      select
        .querySelector(".custom-select-button")
        ?.setAttribute("aria-expanded", "false");
      const valueText = select.querySelector(".custom-select-button span");
      if (valueText) valueText.textContent = "Choose enquiry type";
    });
  };

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    sessionStorage.setItem("stacklyContactSubmitted", "true");
    resetContactForm();
    location.href = contactForm.getAttribute("action") || "404.html";
  });

  window.addEventListener("pageshow", () => {
    if (sessionStorage.getItem("stacklyContactSubmitted") !== "true") return;
    resetContactForm();
    sessionStorage.removeItem("stacklyContactSubmitted");
  });
}
