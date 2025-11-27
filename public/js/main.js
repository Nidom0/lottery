/* =========================
   CMS DASHBOARD JS
   ========================= */

console.log("Dashboard Loaded");

// SIDEBAR
const hamburger = document.getElementById("hamburgerBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

if (hamburger) {
    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        sidebar.classList.toggle("open");
        overlay.classList.toggle("active");
        document.body.classList.toggle("menu-open");
    });
}

if (overlay) {
    overlay.addEventListener("click", () => {
        hamburger.classList.remove("active");
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        document.body.classList.remove("menu-open");
    });
}

// SEARCH FILTER
const searchInput = document.getElementById("searchInput");
const rows = document.querySelectorAll("#customersTable tbody tr");

if (searchInput) {
    searchInput.addEventListener("keyup", () => {
        let value = searchInput.value.toLowerCase();
        rows.forEach(row => {
            let name = row.cells[0].textContent.toLowerCase();
            row.style.display = name.includes(value) ? "" : "none";
        });
    });
}

// FILTER BUTTONS
const filterBtns = document.querySelectorAll(".filter-btn");
if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filter = btn.dataset.filter;

            rows.forEach(row => {
                let show = true;

                const seen = row.cells[3].querySelector(".seen");
                const notSeen = row.cells[3].querySelector(".not-seen");
                const info = row.cells[4].textContent;

                if (filter === "seen") show = !!seen;
                if (filter === "notseen") show = !!notSeen;
                if (filter === "complete") show = info.includes("کامل");
                if (filter === "incomplete") show = info.includes("ناقص");

                row.style.display = show ? "" : "none";
            });
        });
    });
}

