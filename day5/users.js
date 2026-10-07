// Select DOM Elements
const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusPara = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

// Global array to store loaded users
let users = [];

// Function to render any array of users using createElement and textContent
function renderUsers(list) {
  usersList.textContent = "";

  if (list.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.textContent = "No users match your filter.";
    usersList.appendChild(emptyLi);
    return;
  }

  list.forEach((user) => {
    const li = document.createElement("li");
    
    const nameElem = document.createElement("strong");
    nameElem.textContent = user.name;

    const detailsElem = document.createElement("p");
    detailsElem.textContent = `Email: ${user.email} | City: ${user.address.city} | Company: ${user.company.name}`;

    li.appendChild(nameElem);
    li.appendChild(detailsElem);
    usersList.appendChild(li);
  });
}

// Async function to fetch users from the API
async function loadUsers() {
  loadBtn.disabled = true;
  statusPara.textContent = "Loading users...";
  usersList.textContent = "";

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    users = await response.json();
    statusPara.textContent = "Users loaded successfully.";
    renderUsers(users);
  } catch (error) {
    statusPara.textContent = `Failed to load users: ${error.message}`;
  } finally {
    loadBtn.disabled = false;
  }
}

// Event listener for filter input (case-insensitive name filtering)
filterInput.addEventListener("input", () => {
  const query = filterInput.value.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(query)
  );
  renderUsers(filteredUsers);
});

// Event listener for load button
loadBtn.addEventListener("click", loadUsers);
