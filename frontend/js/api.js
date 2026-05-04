const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5003/api"
    : "/api";

async function apiCall(endpoint, method = "GET", data = null) {
  const token = localStorage.getItem("token");

  const config = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(API_BASE_URL + endpoint, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Request failed");
    }

    return responseData;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

window.apiCall = apiCall;
window.API_BASE_URL = API_BASE_URL;

// Auto-populate navbar user info if elements exist
document.addEventListener("DOMContentLoaded", () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const nameEl = document.getElementById("user-name");
      const pointsEl = document.getElementById("user-points");
      if (nameEl) nameEl.textContent = user.name || "User";
      if (pointsEl) pointsEl.textContent = user.points || 0;
    } catch (e) {
      console.error("Failed to parse user data from localStorage");
    }
  }
});
