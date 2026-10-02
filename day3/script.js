// Starting data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word)
function searchNotes(word) {
  const lowerWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(lowerWord));
}

// 2. longestNote()
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// 3. countByCategory()
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    const category = note.category;
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

// 4. getSummary()
function getSummary() {
  const total = notes.length;
  const label = total === 1 ? "note" : "notes";
  const counts = countByCategory();
  const parts = Object.entries(counts).map(([cat, count]) => `${count} ${cat}`);
  
  if (parts.length === 0) {
    return `0 notes.`;
  }
  return `${total} ${label}: ${parts.join(", ")}.`;
}

// 5. isDuplicate(text)
function isDuplicate(text) {
  const cleanText = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === cleanText);
}

// 6. addNote(text, category)
function addNote(text, category) {
  const trimmedText = text.trim();
  const validCategories = ["personal", "work", "study"];

  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Failed to add note: Length must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(text)) {
    console.log("Failed to add note: Duplicate text detected.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Failed to add note: Category must be 'personal', 'work', or 'study'.");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: newId, text: trimmedText, category: category });
  return true;
}

// ==========================================
// TEST CASES & VERIFICATION
// ==========================================

console.log("--- Testing searchNotes ---");
console.log(searchNotes("javascript")); 
// Expected: [ { id: 4, text: "Revise JavaScript arrays", category: "study" } ]

console.log(searchNotes("python")); 
// Expected: []

console.log("\n--- Testing longestNote ---");
console.log(longestNote()); 
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

const savedNotesForLongest = notes;
notes = [];
console.log(longestNote()); 
// Expected: null
notes = savedNotesForLongest;

console.log("\n--- Testing countByCategory ---");
console.log(countByCategory()); 
// Expected: { personal: 2, study: 2, work: 1 }

const savedNotesForCount = notes;
notes = [];
console.log(countByCategory()); 
// Expected: {}
notes = savedNotesForCount;

console.log("\n--- Testing getSummary ---");
console.log(getSummary()); 
// Expected: "5 notes: 2 personal, 2 study, 1 work."

const savedNotesForSummary = notes;
notes = [{ id: 1, text: "Read a book", category: "personal" }];
console.log(getSummary()); 
// Expected: "1 note: 1 personal."
notes = savedNotesForSummary;

console.log("\n--- Testing isDuplicate ---");
console.log(isDuplicate("  CALL MUM  ")); 
// Expected: true

console.log(isDuplicate("Go for a run")); 
// Expected: false

console.log("\n--- Testing addNote ---");
console.log(addNote("Go for a walk", "personal")); 
// Expected: true

console.log(addNote("Call mum", "personal")); 
// Logs: "Failed to add note: Duplicate text detected."
// Expected: false

console.log(addNote("Read documentation", "fitness")); 
// Logs: "Failed to add note: Category must be 'personal', 'work', or 'study'."
// Expected: false
