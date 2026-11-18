// =============================================================================
// The Banyan Kitchen - Common Helper Functions
// =============================================================================

// Default foods data for instant fallback if backend server is not running
var SAMPLE_FOODS = [
  {
    id: 1,
    name: "Truffle Alfredo Pasta",
    category: "Main Course",
    price: 520,
    quantity: 12,
    image: "../static/assets/images/pasta.jpg",
    description: "Creamy fettuccine with garlic herbs and truffle oil"
  },
  {
    id: 2,
    name: "Classic Margherita Pizza",
    category: "Pizza",
    price: 480,
    quantity: 10,
    image: "../static/assets/images/pizza.jpg",
    description: "Fresh tomato sauce, basil, and molten mozzarella"
  },
  {
    id: 3,
    name: "Grilled Tenderloin Steak",
    category: "Main Course",
    price: 990,
    quantity: 8,
    image: "../static/assets/images/steak.jpg",
    description: "Char-grilled and seasoned with house herb butter"
  },
  {
    id: 4,
    name: "BBQ Chicken Burger",
    category: "Burgers",
    price: 460,
    quantity: 15,
    image: "../static/assets/images/burger.jpg",
    description: "Juicy grilled patty with smokey house sauce"
  },
  {
    id: 5,
    name: "Garden Fresh Salad",
    category: "Starters",
    price: 320,
    quantity: 20,
    image: "../static/assets/images/salad.jpg",
    description: "Crisp seasonal greens, feta cheese, and citrus dressing"
  },
  {
    id: 6,
    name: "Chocolate Lava Cake",
    category: "Desserts",
    price: 350,
    quantity: 9,
    image: "../static/assets/images/dessert.jpg",
    description: "Warm molten chocolate core served with vanilla whip"
  },
  {
    id: 7,
    name: "Fresh Lime Soda",
    category: "Drinks",
    price: 120,
    quantity: 25,
    image: "../static/assets/images/lime-soda.jpg",
    description: "Chilled sparkling soda with fresh squeezed mint & lime"
  },
  {
    id: 8,
    name: "Crispy Veg Bites",
    category: "Starters",
    price: 260,
    quantity: 18,
    image: "../static/assets/images/veg-bites.jpg",
    description: "Golden crumbed vegetable bites with spicy dip"
  }
];

// Helper to normalize image paths so they work in both Flask and direct browser preview
function fixImagePath(path) {
  if (!path) {
    return "../static/assets/images/fallback-food.jpg";
  }
  if (path.indexOf("http") === 0) {
    return path;
  }
  if (path.indexOf("/static/") === 0) {
    return ".." + path;
  }
  return path;
}

// Easy helper function to communicate with the Flask backend server
// It avoids advanced async/await syntax and uses standard fetch with callbacks.
function sendRequest(url, method, data, onSuccess, onError) {
  var options = {
    method: method ? method : "GET",
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  fetch(url, options)
    .then(function(response) {
      if (response.status === 204) {
        return null;
      }
      return response.json();
    })
    .then(function(result) {
      if (result && result.error) {
        if (onError) {
          onError(result.error);
        } else {
          alert(result.error);
        }
      } else {
        if (onSuccess) {
          onSuccess(result);
        }
      }
    })
    .catch(function(error) {
      if (onError) {
        onError("Server is offline or not reachable.");
      } else {
        console.log("Request notice:", error);
      }
    });
}

// Format a number as Indian Rupee (e.g., 520 becomes "₹520.00")
function formatMoney(amount) {
  return "₹" + Number(amount).toFixed(2);
}

// Update the cart item counter badge in the navbar
function updateCartCount() {
  sendRequest("/api/cart", "GET", null, function(cartItems) {
    var cartCountElement = document.getElementById("cartCount");
    if (!cartCountElement || !cartItems) {
      return;
    }

    var totalQuantity = 0;
    for (var i = 0; i < cartItems.length; i++) {
      totalQuantity = totalQuantity + cartItems[i].quantity;
    }

    cartCountElement.textContent = totalQuantity;
  });
}

// Check if a user is currently logged in, and update the navigation bar
function updateUserMenu() {
  sendRequest("/api/current-user", "GET", null, function(user) {
    var loginButton = document.querySelector(".navbar a[href='login.html']");
    if (!user || !loginButton) {
      return;
    }

    // If the logged-in user is an administrator, add the ADMIN link to the navbar
    if (user.role === "admin") {
      var contactLink = document.querySelector(".navbar a[href='contact.html']");
      if (contactLink) {
        var adminNavItem = document.createElement("li");
        var isAdminPage = window.location.pathname.indexOf("admin.html") !== -1;
        adminNavItem.className = "nav-item";
        adminNavItem.innerHTML = '<a class="nav-link ' + (isAdminPage ? "active" : "") + '" href="admin.html">ADMIN</a>';
        contactLink.closest("li").after(adminNavItem);
      }
    }

    // Change the "LOGIN" button to "LOGOUT"
    loginButton.textContent = "LOGOUT";
    loginButton.href = "#";
    loginButton.setAttribute("aria-label", "Log out");

    loginButton.addEventListener("click", function(event) {
      event.preventDefault();
      sendRequest("/api/logout", "POST", null, function() {
        window.location.href = "index.html";
      });
    });
  });
}

// When the HTML page finishes loading, run these startup functions
document.addEventListener("DOMContentLoaded", function() {
  updateCartCount();
  updateUserMenu();
});
