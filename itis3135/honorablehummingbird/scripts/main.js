// Honorable Hummingbird site scripts.
// Feature 1: slideshow (home). Feature 2: product filter (products).
// Feature 3: live "open now" status (hours). Shared header/footer load on every page.
// No classes or ids are used; elements are found with data- attributes
// (Source: MDN, data-* attributes
// https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes).

// --- Components: replaces each [data-include] placeholder with its file -----
// Source: MDN, "Using the Fetch API"
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// Note: fetch() needs a web server (e.g. VS Code Live Server), not file://.
async function loadComponent(placeholder) {
  const filePath = placeholder.dataset.include;
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // outerHTML swaps the empty placeholder for the component's own header/footer
    // element, so the page never ends up with a header inside a header.
    placeholder.outerHTML = await response.text();
  } catch (error) {
    placeholder.textContent = "Sorry, this section could not be loaded.";
    console.error(`Could not load ${filePath}:`, error);
  }
}

// Marks the nav link for the current page so visitors know where they are.
// Source: MDN, aria-current https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current
function markCurrentPage() {
  const currentFile = location.pathname.split("/").pop() || "index.html";
  const link = document.querySelector(`nav a[href="${currentFile}"]`);
  if (link) link.setAttribute("aria-current", "page");
}

// --- Feature 1: slideshow (placehold.co images, swap in real photos later) --
const slides = [
  { src: "https://placehold.co/800x450/1A1A3E/F4AC32/png?text=Pendant+Lights", alt: "Placeholder: pendant lights hanging over a workbench", caption: "Pendant lights, approved for kitchens." },
  { src: "https://placehold.co/800x450/1A1A3E/F4AC32/png?text=Workshop+Tools", alt: "Placeholder: hand tools on a pegboard", caption: "Hand tools, ruled fit for the workshop." },
  { src: "https://placehold.co/800x450/1A1A3E/F4AC32/png?text=LED+Bulbs", alt: "Placeholder: a display of LED bulbs", caption: "LED bulbs in every shade of warm." }
];

function initSlideshow() {
  const slideshow = document.querySelector("[data-slideshow]");
  if (!slideshow) return;
  const image = slideshow.querySelector("img");
  const caption = slideshow.querySelector("figcaption");
  let slideIndex = 0;

  function showSlide(newIndex) {
    // Modulo wraps around at both ends of the array.
    slideIndex = (newIndex + slides.length) % slides.length;
    image.src = slides[slideIndex].src;
    image.alt = slides[slideIndex].alt;
    caption.textContent = slides[slideIndex].caption;
  }

  slideshow.querySelector('[data-slide="previous"]').addEventListener("click", () => showSlide(slideIndex - 1));
  slideshow.querySelector('[data-slide="next"]').addEventListener("click", () => showSlide(slideIndex + 1));
}

// --- Feature 2: product filter ---------------------------------------------
// Uses the hidden attribute to show/hide items.
// Source: MDN, hidden https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden
function initProductFilter() {
  const buttons = document.querySelectorAll("[data-filter]");
  const products = document.querySelectorAll("[data-category]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const chosenCategory = button.dataset.filter;
      buttons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
      products.forEach((product) => {
        product.hidden = chosenCategory !== "all" && product.dataset.category !== chosenCategory;
      });
    });
  });
}

// --- Feature 3: "open now?" status -----------------------------------------
// Source: MDN, Date.getDay() (0 = Sunday)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay
// Opening and closing hours in 24-hour time, indexed by day of week.
const openingHours = [null, [7, 18], [7, 18], [7, 18], [7, 18], [7, 18], [8, 16]];

function initOpenStatus() {
  const status = document.querySelector("[data-open-status]");
  if (!status) return;
  const now = new Date();
  const todaysHours = openingHours[now.getDay()];
  const isOpen = todaysHours && now.getHours() >= todaysHours[0] && now.getHours() < todaysHours[1];
  status.textContent = isOpen
    ? "We’re open right now. Come on in!"
    : "We’re closed right now. See the hours below for when we’re back.";
}

// --- Start-up ---------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const placeholders = document.querySelectorAll("[data-include]");
  await Promise.all(Array.from(placeholders, loadComponent));
  markCurrentPage();
  initSlideshow();
  initProductFilter();
  initOpenStatus();
});
