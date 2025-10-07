document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(API_BASE_URL + "/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "dashboard.html";
    } else {
      showError(data.message || "Invalid Email or Password");
    }
  } catch (error) {
    showError("Network error. Please try again.");
    console.error("Login error:", error);
  }
});

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");

  if (errorDiv && errorText) {
    errorText.textContent = message;
    errorDiv.classList.remove("hidden");

    anime({
      targets: "#error-message",
      translateX: [-20, 0],
      opacity: [0, 1],
      duration: 400,
      easing: "easeOutExpo",
    });
  }
}
