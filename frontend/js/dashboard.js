if (!localStorage.getItem("token")) {
  window.location.href = "login.html";
}

const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  localStorage.clear();
  window.location.href = "login.html";
}

document.getElementById("user-name").textContent = user.name;
document.getElementById("user-points").textContent = user.points;
document.getElementById("welcome-name").textContent = user.name;
document.getElementById("total-points").textContent = 0;

function getTaskBasePoints(task) {
  const rewardPoints = Number(task.reward_points);
  const base = Number.isFinite(rewardPoints) ? rewardPoints : 10;

  if (task.urgent && task.urgent_expires_at) {
    const completedAt = task.completed_at ? new Date(task.completed_at) : null;
    const urgentExpiresAt = new Date(task.urgent_expires_at);
    if (completedAt && completedAt <= urgentExpiresAt) {
      return base * 2;
    }
  }

  return base;
}

function getCurrentUserTaskShare(task, totalPoints) {
  const members = task.team_members?.length
    ? task.team_members
    : [{ roll_number: task.accepted_by }];

  const memberIndex = members.findIndex(
    (member) => member.roll_number === user.roll_number
  );

  if (memberIndex === -1 || !members.length) return 0;

  const share = Math.floor(totalPoints / members.length);
  const remainder = totalPoints - share * members.length;
  return memberIndex === 0 ? share + remainder : share;
}

function calculateEarnedPoints(tasks) {
  return tasks.reduce((total, task) => {
    const rewardWasPaid =
      task.status === "verified" ||
      (task.status === "completed" && !task.escrow_locked);

    if (!rewardWasPaid) return total;

    const basePoints = getTaskBasePoints(task);
    return total + getCurrentUserTaskShare(task, basePoints);
  }, 0);
}

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
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
    document.getElementById("total-points").textContent = calculateEarnedPoints(
      acceptedTasks.tasks
    );

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

async function loadPreferences() {
  try {
    const data = await apiCall("/users/preferences", "GET");
    document.getElementById("skills-input").value = (data.skills || []).join(", ");
    document.getElementById("courses-input").value = (data.courses || []).join(", ");
    document.getElementById("escrow-badge").textContent =
      "Escrow: " + (data.escrow_points || 0) + " pts";
  } catch (error) {
    console.error("Error loading preferences:", error);
  }
}

document.getElementById("prefs-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const skills = document.getElementById("skills-input").value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const courses = document.getElementById("courses-input").value
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  try {
    await apiCall("/users/preferences", "PUT", { skills, courses });
    loadPreferences();
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
});

setInterval(loadNotifications, 30000);
loadPreferences();
