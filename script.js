/* ============================================================
   STUDENT PERFORMANCE DASHBOARD
   Extra unique features:
   - Toast notifications (instead of plain alerts)
   - Real-time search + sort + filter combined
   - "Fill Sample Data" button
   - Pass rate & hardest-subject analytics
   - Most popular grade
   - Inline field-level validation hints
   - New-row highlight animation
   ============================================================ */

// ---------- CONFIG ----------
const SUBJECTS = ["programming", "mathematics", "english", "database", "networks"];
const SUBJECT_LABELS = {
  programming: "Programming",
  mathematics: "Mathematics",
  english:     "English",
  database:    "Database",
  networks:    "Computer Networks"
};
const STORAGE_KEY = "student_dashboard_v2";

// ---------- STATE ----------
let students = [];
let uiState = { search: "", sort: "none", filter: "all" };

// ---------- DOM ----------
const form         = document.getElementById("studentForm");
const resultsBody  = document.getElementById("resultsBody");
const totalEl      = document.getElementById("totalStudents");
const avgEl        = document.getElementById("classAverage");
const topEl        = document.getElementById("topStudent");
const passRateEl   = document.getElementById("passRate");
const hardestEl    = document.getElementById("hardestSubject");
const popularEl    = document.getElementById("popularGrade");
const clearAllBtn  = document.getElementById("clearAllBtn");
const searchInput  = document.getElementById("searchInput");
const sortSelect   = document.getElementById("sortSelect");
const filterSelect = document.getElementById("filterSelect");
const visibleCount = document.getElementById("visibleCount");
const fillSample   = document.getElementById("fillSampleBtn");
const toastBox     = document.getElementById("toastContainer");

// ============================================================
// TOAST NOTIFICATION SYSTEM (unique feature)
// ============================================================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastBox.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// REQUIRED FUNCTION 1: validateForm()
// ============================================================
function validateForm() {
  const name  = document.getElementById("studentName").value.trim();
  const regNo = document.getElementById("regNumber").value.trim();

  // Reset hints
  document.getElementById("nameHint").textContent = "";
  document.getElementById("regHint").textContent  = "";
  document.getElementById("studentName").classList.remove("invalid");
  document.getElementById("regNumber").classList.remove("invalid");

  if (!name) {
    document.getElementById("studentName").classList.add("invalid");
    document.getElementById("nameHint").textContent = "Name is required";
    showToast("Please enter the student's name", "error");
    return null;
  }

  if (!regNo) {
    document.getElementById("regNumber").classList.add("invalid");
    document.getElementById("regHint").textContent = "Registration number is required";
    showToast("Please enter a registration number", "error");
    return null;
  }

  if (students.some(s => s.regNo.toLowerCase() === regNo.toLowerCase())) {
    document.getElementById("regNumber").classList.add("invalid");
    document.getElementById("regHint").textContent = "This reg. number already exists";
    showToast(`Duplicate registration number: ${regNo}`, "error");
    return null;
  }

  const marks = {};
  for (const subj of SUBJECTS) {
    const input = document.getElementById(subj);
    const val = Number(input.value);

    if (input.value === "" || isNaN(val) || val < 0 || val > 100) {
      input.classList.add("invalid");
      showToast(`Invalid marks for ${SUBJECT_LABELS[subj]} (0–100 only)`, "error");
      return null;
    }
    input.classList.remove("invalid");
    marks[subj] = val;
  }

  return { name, regNo, marks };
}

// ============================================================
// REQUIRED FUNCTION 2: calculateTotal()
// ============================================================
function calculateTotal(marks) {
  return SUBJECTS.reduce((sum, subj) => sum + marks[subj], 0);
}

// ============================================================
// REQUIRED FUNCTION 3: calculatePercentage()
// ============================================================
function calculatePercentage(total) {
  return (total / (SUBJECTS.length * 100)) * 100;
}

// ============================================================
// REQUIRED FUNCTION 4: calculateGrade()
// ============================================================
function calculateGrade(percentage) {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

// ============================================================
// REQUIRED FUNCTION 5: checkStatus()
// ============================================================
function checkStatus(marks) {
  return SUBJECTS.every(subj => marks[subj] >= 40) ? "Pass" : "Fail";
}

// ============================================================
// REQUIRED FUNCTION 6: addStudent()
// ============================================================
function addStudent(data) {
  const total      = calculateTotal(data.marks);
  const percentage = Number(calculatePercentage(total).toFixed(2));
  const grade      = calculateGrade(percentage);
  const status     = checkStatus(data.marks);

  const student = {
    id: Date.now() + Math.random(),
    name: data.name,
    regNo: data.regNo,
    marks: { ...data.marks },
    total,
    percentage,
    grade,
    status,
    isNew: true
  };

  students.push(student);
  persist();
  refreshUI();
  showToast(`✅ ${student.name} added successfully!`, "success");
}

// ============================================================
// REQUIRED FUNCTION 7: calculateClassAverage()
// ============================================================
function calculateClassAverage() {
  if (students.length === 0) return 0;
  const sum = students.reduce((acc, s) => acc + s.percentage, 0);
  return Number((sum / students.length).toFixed(2));
}

// ============================================================
// ANALYTICS HELPERS (unique features)
// ============================================================
function calculatePassRate() {
  if (students.length === 0) return 0;
  const passed = students.filter(s => s.status === "Pass").length;
  return Number(((passed / students.length) * 100).toFixed(1));
}

function findHardestSubject() {
  if (students.length === 0) return "—";
  const avgBySubject = {};
  for (const subj of SUBJECTS) {
    const sum = students.reduce((acc, s) => acc + s.marks[subj], 0);
    avgBySubject[subj] = sum / students.length;
  }
  let hardest = SUBJECTS[0];
  for (const subj of SUBJECTS) {
    if (avgBySubject[subj] < avgBySubject[hardest]) hardest = subj;
  }
  return `${SUBJECT_LABELS[hardest]} (${avgBySubject[hardest].toFixed(1)})`;
}

function findMostPopularGrade() {
  if (students.length === 0) return "—";
  const counts = {};
  students.forEach(s => counts[s.grade] = (counts[s.grade] || 0) + 1);
  let best = null, bestCount = 0;
  for (const g in counts) {
    if (counts[g] > bestCount) { best = g; bestCount = counts[g]; }
  }
  return `${best} (${bestCount} students)`;
}

function findTopStudent() {
  if (students.length === 0) return null;
  return students.reduce((best, s) =>
    s.percentage > best.percentage ? s : best, students[0]);
}

// ============================================================
// FILTER + SORT + SEARCH PIPELINE (unique feature)
// ============================================================
function getVisibleStudents() {
  let list = [...students];

  // Filter
  if (uiState.filter === "pass")        list = list.filter(s => s.status === "Pass");
  if (uiState.filter === "fail")        list = list.filter(s => s.status === "Fail");
  if (uiState.filter === "distinction") list = list.filter(s => s.grade === "A");

  // Search
  if (uiState.search) {
    const q = uiState.search.toLowerCase();
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q)
    );
  }

  // Sort
  switch (uiState.sort) {
    case "percentage-desc": list.sort((a, b) => b.percentage - a.percentage); break;
    case "percentage-asc":  list.sort((a, b) => a.percentage - b.percentage); break;
    case "name-asc":        list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "regNo-asc":       list.sort((a, b) => a.regNo.localeCompare(b.regNo)); break;
  }

  return list;
}

// ============================================================
// RENDER TABLE
// ============================================================
function renderTable() {
  const list = getVisibleStudents();
  resultsBody.innerHTML = "";
  visibleCount.textContent = `${list.length} record${list.length !== 1 ? "s" : ""}`;

  if (list.length === 0) {
    resultsBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="13">No students match your criteria.</td>
      </tr>`;
    return;
  }

  list.forEach((s, i) => {
    const tr = document.createElement("tr");
    if (s.status === "Fail") tr.classList.add("row-fail");
    if (s.isNew) { tr.classList.add("new-row"); s.isNew = false; }

    tr.innerHTML = `
      <td class="row-index">${i + 1}</td>
      <td class="student-name">${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.regNo)}</td>
      <td>${s.marks.programming}</td>
      <td>${s.marks.mathematics}</td>
      <td>${s.marks.english}</td>
      <td>${s.marks.database}</td>
      <td>${s.marks.networks}</td>
      <td><strong>${s.total}</strong></td>
      <td>${s.percentage}%</td>
      <td><span class="grade-pill grade-${s.grade}">${s.grade}</span></td>
      <td class="status-${s.status.toLowerCase()}">${s.status}</td>
      <td><button class="btn-delete" data-id="${s.id}">Delete</button></td>
    `;
    resultsBody.appendChild(tr);
  });

  // Attach delete handlers
  resultsBody.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteStudent(btn.dataset.id);
    });
  });
}

// ============================================================
// RENDER SUMMARY STATS
// ============================================================
function renderSummary() {
  totalEl.textContent    = students.length;
  avgEl.textContent      = calculateClassAverage() + "%";
  passRateEl.textContent = calculatePassRate() + "%";
  hardestEl.textContent  = findHardestSubject();
  popularEl.textContent  = findMostPopularGrade();

  const top = findTopStudent();
  topEl.textContent = top ? `${top.name} (${top.percentage}%)` : "—";
}

// ============================================================
// DELETE
// ============================================================
function deleteStudent(id) {
  const student = students.find(s => String(s.id) === String(id));
  if (!student) return;
  if (!confirm(`Delete ${student.name}'s record?`)) return;

  students = students.filter(s => String(s.id) !== String(id));
  persist();
  refreshUI();
  showToast(`🗑️ ${student.name}'s record deleted`, "warning");
}

// ============================================================
// CLEAR ALL
// ============================================================
clearAllBtn.addEventListener("click", () => {
  if (students.length === 0) {
    showToast("No records to clear", "info");
    return;
  }
  if (!confirm("Delete ALL student records? This cannot be undone.")) return;
  students = [];
  persist();
  refreshUI();
  showToast("All records cleared", "warning");
});

// ============================================================
// FORM SUBMIT
// ============================================================
form.addEventListener("submit", e => {
  e.preventDefault();
  const data = validateForm();
  if (!data) return;
  addStudent(data);
  form.reset();
  document.getElementById("studentName").focus();
});

// Live-clear invalid styling when user types
["studentName", "regNumber", ...SUBJECTS].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener("input", () => {
    el.classList.remove("invalid");
  });
});

// ============================================================
// FILL SAMPLE DATA (unique feature)
// ============================================================
fillSample.addEventListener("click", () => {
  const samples = [
    { name: "Ali Khan",      regNo: "REG-001", marks: { programming: 92, mathematics: 88, english: 85, database: 90, networks: 95 } },
    { name: "Sara Ahmed",    regNo: "REG-002", marks: { programming: 82, mathematics: 78, english: 85, database: 80, networks: 85 } },
    { name: "Ahmed Raza",    regNo: "REG-003", marks: { programming: 45, mathematics: 55, english: 60, database: 70, networks: 60 } },
    { name: "Fatima Noor",   regNo: "REG-004", marks: { programming: 30, mathematics: 45, english: 55, database: 60, networks: 50 } }
  ];

  let added = 0;
  samples.forEach(s => {
    // Skip duplicates
    if (students.some(ex => ex.regNo.toLowerCase() === s.regNo.toLowerCase())) return;

    const total      = calculateTotal(s.marks);
    const percentage = Number(calculatePercentage(total).toFixed(2));
    const grade      = calculateGrade(percentage);
    const status     = checkStatus(s.marks);

    students.push({
      id: Date.now() + Math.random(),
      name: s.name,
      regNo: s.regNo,
      marks: { ...s.marks },
      total, percentage, grade, status,
      isNew: true
    });
    added++;
  });

  if (added === 0) {
    showToast("Sample records already exist", "info");
    return;
  }
  persist();
  refreshUI();
  showToast(`🎲 ${added} sample student(s) added`, "info");
});

// ============================================================
// SEARCH / SORT / FILTER HANDLERS
// ============================================================
searchInput.addEventListener("input", e => {
  uiState.search = e.target.value;
  renderTable();
});

sortSelect.addEventListener("change", e => {
  uiState.sort = e.target.value;
  renderTable();
});

filterSelect.addEventListener("change", e => {
  uiState.filter = e.target.value;
  renderTable();
});

// ============================================================
// LOCAL STORAGE
// ============================================================
function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) students = JSON.parse(raw);
  } catch {
    students = [];
  }
}

// ============================================================
// UTILITY
// ============================================================
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function refreshUI() {
  renderTable();
  renderSummary();
}

// ============================================================
// INIT
// ============================================================
loadFromStorage();
refreshUI();