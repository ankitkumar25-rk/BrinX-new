const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
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
