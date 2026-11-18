// =============================================================================
// The Banyan Kitchen - Authentication JavaScript (Login & Register)
// =============================================================================

var loginForm = document.getElementById("loginForm");
var registerForm = document.getElementById("registerForm");
var showRegisterForm = document.getElementById("showRegisterForm");
var showLoginForm = document.getElementById("showLoginForm");

var loginEmail = document.getElementById("loginEmail");
var loginPassword = document.getElementById("loginPassword");
var loginMessage = document.getElementById("loginMessage");

var registerName = document.getElementById("registerName");
var registerEmail = document.getElementById("registerEmail");
var registerPassword = document.getElementById("registerPassword");
var registerMessage = document.getElementById("registerMessage");

// Toggle to show Registration Form
if (showRegisterForm) {
  showRegisterForm.addEventListener("click", function() {
    registerForm.classList.remove("d-none");
    loginForm.classList.add("d-none");
    showRegisterForm.parentElement.classList.add("d-none");
  });
}

// Toggle to show Login Form
if (showLoginForm) {
  showLoginForm.addEventListener("click", function() {
    registerForm.classList.add("d-none");
    loginForm.classList.remove("d-none");
    if (showRegisterForm && showRegisterForm.parentElement) {
      showRegisterForm.parentElement.classList.remove("d-none");
    }
  });
}

// Handle Login Form Submit
if (loginForm) {
  loginForm.addEventListener("submit", function(event) {
    event.preventDefault();
    loginMessage.textContent = "";

    var loginData = {
      email: loginEmail.value.trim(),
      password: loginPassword.value
    };

    sendRequest(
      "/api/login",
      "POST",
      loginData,
      function(user) {
        // Redirect according to user role
        if (user.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "menu.html";
        }
      },
      function(errorMessage) {
        loginMessage.textContent = errorMessage;
      }
    );
  });
}

// Handle Registration Form Submit
if (registerForm) {
  registerForm.addEventListener("submit", function(event) {
    event.preventDefault();
    registerMessage.textContent = "";

    var registerData = {
      name: registerName.value.trim(),
      email: registerEmail.value.trim(),
      password: registerPassword.value
    };

    sendRequest(
      "/api/register",
      "POST",
      registerData,
      function(user) {
        // Automatically logged in upon successful registration
        if (user.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "menu.html";
        }
      },
      function(errorMessage) {
        registerMessage.textContent = errorMessage;
      }
    );
  });
}
