if (!localStorage.getItem("token")) {
  window.location.href = "index.html";
}

const user = JSON.parse(localStorage.getItem("user"));

document.getElementById("user-name").textContent = user.name;
document.getElementById("user-points").textContent = user.points;
document.getElementById("welcome-name").textContent = user.name;
document.getElementById("total-points").textContent = user.points;

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

async function loadDashboardStats() {
  try {
    const [postedTasks, acceptedTasks] = await Promise.all([
      apiCall("/tasks/my-posted-tasks", "GET"),
      apiCall("/tasks/my-accepted-tasks", "GET"),
    ]);

    document.getElementById("tasks-posted").textContent =
      postedTasks.tasks.length;
    document.getElementById("tasks-accepted").textContent =
      acceptedTasks.tasks.length;

    const completedCount = acceptedTasks.tasks.filter(
      (t) => t.status === "completed" || t.status === "verified"
    ).length;
    document.getElementById("tasks-completed").textContent = completedCount;

    anime({
      targets:
        "#total-points, #tasks-posted, #tasks-accepted, #tasks-completed",
      innerHTML: [0, (el) => el.textContent],
      round: 1,
      duration: 2000,
      easing: "easeOutExpo",
    });
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

async function loadNotifications() {
  try {
    const data = await apiCall("/notifications", "GET");

    if (data.unreadCount > 0) {
      const badge = document.getElementById("notification-badge");
      badge.textContent = data.unreadCount;
      badge.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
  }
}

document.getElementById("notification-btn")?.addEventListener("click", () => {
  window.location.href = "notifications.html";
});

loadDashboardStats();
loadNotifications();

setInterval(loadNotifications, 30000);
