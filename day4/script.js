// Select DOM Elements
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// Update character & word counters and apply warning/over styling
function updateCounts() {
  const text = noteText.value;
  const charLength = text.length;

  // Calculate word count
  const trimmedText = text.trim();
  const words = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;

  // Update text outputs
  charCount.textContent = `${charLength} / 200 characters`;
  wordCount.textContent = `${words} words`;

  // Manage character counter warning classes
  if (charLength > 200) {
    charCount.classList.add("over");
    charCount.classList.remove("warning");
  } else if (charLength > 180) {
    charCount.classList.add("warning");
    charCount.classList.remove("over");
  } else {
    charCount.classList.remove("warning", "over");
  }
}

// Clear textarea, remove saved draft, and update counts
function clearEverything() {
  noteText.value = "";
  localStorage.removeItem("noteDraft");
  updateCounts();
}

// Toggle theme between Light and Dark mode
function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Page Load Initialization
function init() {
  // Restore saved draft text
  const savedDraft = localStorage.getItem("noteDraft");
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  // Restore saved theme preference
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "Dark mode";
  }

  // Initial calculation
  updateCounts();
}

// Event Listeners
noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem("noteDraft", noteText.value);
});

clearBtn.addEventListener("click", clearEverything);

themeToggle.addEventListener("click", toggleTheme);

noteText.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    clearEverything();
  }
});

// Run init on load
init();
