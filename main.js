// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Scroll-triggered animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animate");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

// Hamburger menu
const hamburger = document.querySelector(".hamburger");
const mobileNav = document.getElementById("mobile-nav");

hamburger.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", isOpen);
  hamburger.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
});

mobileNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open navigation menu");
  });
});

// Active nav link highlight
(function () {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-nav a").forEach((a) => {
    const href = a.getAttribute("href").split("/").pop();
    if (href === path) a.classList.add("active");
  });
})();

// Auto-scroll testimonials (only if carousel exists on page)
document.addEventListener("DOMContentLoaded", function () {
  const scrollContainer = document.querySelector(".testimonial-scroll");
  if (!scrollContainer) return;

  let scrollAmount = 0;
  let autoScrollInterval;

  function startAutoScroll() {
    autoScrollInterval = setInterval(() => {
      const cardWidth = scrollContainer.querySelector(".testimonial-card").offsetWidth + 20;
      scrollAmount += cardWidth;
      if (scrollAmount >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
        scrollAmount = 0;
      }
      scrollContainer.scrollTo({ left: scrollAmount, behavior: "smooth" });
    }, 3000);
  }

  function stopAutoScroll() { clearInterval(autoScrollInterval); }

  startAutoScroll();
  scrollContainer.addEventListener("mouseenter", stopAutoScroll);
  scrollContainer.addEventListener("mouseleave", startAutoScroll);
});
