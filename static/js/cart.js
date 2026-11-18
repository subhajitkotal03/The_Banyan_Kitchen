// =============================================================================
// The Banyan Kitchen - Cart Page JavaScript
// =============================================================================

var cartItems = document.getElementById("cartItems");
var subtotalText = document.getElementById("subtotal");
var deliveryText = document.getElementById("delivery");
var grandTotalText = document.getElementById("grandTotal");
var cartMessage = document.getElementById("cartMessage");
var checkoutButton = document.getElementById("checkoutButton");

// Fetch cart items from server and render the cart table & totals
function showCart() {
  if (!cartItems) {
    return;
  }

  sendRequest("/api/cart", "GET", null, function(cart) {
    // 1. Calculate subtotal using a simple loop
    var subtotal = 0;
    for (var i = 0; i < cart.length; i++) {
      subtotal = subtotal + (cart[i].price * cart[i].quantity);
    }

    // 2. If cart is empty, show empty message
    if (cart.length === 0) {
      cartItems.innerHTML = '<p class="text-muted mb-0">Your cart is empty. <a href="menu.html">Explore the menu</a>.</p>';
    } else {
      // 3. Build HTML for each cart row
      var html = "";
      for (var j = 0; j < cart.length; j++) {
        var item = cart[j];
        var itemTotal = item.price * item.quantity;
        var imageSrc = fixImagePath(item.image);

        html += '<div class="cart-row">' +
          '<img src="' + imageSrc + '" alt="' + item.name + '">' +
          '<div class="flex-grow-1">' +
            '<h6>' + item.name + '</h6>' +
            '<p class="mb-1 text-muted">' + formatMoney(item.price) + ' each</p>' +
            '<div class="quantity-control">' +
              '<button class="qty-button" data-action="minus" data-id="' + item.id + '">−</button>' +
              '<span>' + item.quantity + '</span>' +
              '<button class="qty-button" data-action="plus" data-id="' + item.id + '">+</button>' +
              '<button class="remove-button" data-action="remove" data-id="' + item.id + '">Remove</button>' +
            '</div>' +
          '</div>' +
          '<strong>' + formatMoney(itemTotal) + '</strong>' +
        '</div>';
      }
      cartItems.innerHTML = html;
    }

    // 4. Update the totals in the order summary
    var delivery = (subtotal > 0) ? 40 : 0;
    var grandTotal = subtotal + delivery;

    subtotalText.textContent = formatMoney(subtotal);
    deliveryText.textContent = formatMoney(delivery);
    grandTotalText.textContent = formatMoney(grandTotal);

    // 5. Attach event listeners to quantity buttons (+, -, remove)
    attachCartButtonListeners();
  });
}

// Function to handle quantity change (+, -, remove)
function changeQuantity(foodId, action) {
  sendRequest(
    "/api/cart/" + foodId,
    "PATCH",
    { action: action },
    function() {
      // Refresh cart view and badge count in navbar
      showCart();
      updateCartCount();
    },
    function(errorMessage) {
      alert(errorMessage);
    }
  );
}

// Attach click listeners to all +, -, and Remove buttons
function attachCartButtonListeners() {
  var buttons = document.querySelectorAll(".qty-button, .remove-button");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function() {
      var foodId = this.getAttribute("data-id");
      var action = this.getAttribute("data-action");
      changeQuantity(foodId, action);
    });
  }
}

// Handle placing the order when "Place order" button is clicked
if (checkoutButton) {
  checkoutButton.addEventListener("click", function() {
    cartMessage.textContent = "";

    sendRequest(
      "/api/checkout",
      "POST",
      null,
      function(order) {
        // Order successfully created
        cartMessage.className = "small text-success mt-3 mb-0";
        cartMessage.textContent = "Order placed successfully! Order ID: #" + order.id;
        showCart();
        updateCartCount();
      },
      function(errorMessage) {
        // Order failed (e.g. not logged in or cart empty)
        cartMessage.className = "small text-danger mt-3 mb-0";
        cartMessage.textContent = errorMessage;
      }
    );
  });
}

// Load cart on page startup
showCart();
