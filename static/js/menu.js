// =============================================================================
// The Banyan Kitchen - Menu Page JavaScript
// =============================================================================

var menuFoods = document.getElementById("menuFoods");

var allFoods = [];

// Display all food cards
function showFoods() {
  if (!menuFoods) {
    return;
  }

  if (allFoods.length === 0) {
    menuFoods.innerHTML = '<div class="col-12"><p class="text-center text-muted py-5">No food items available.</p></div>';
    return;
  }

  // Build the HTML cards for all food items
  var html = "";
  for (var i = 0; i < allFoods.length; i++) {
    var item = allFoods[i];
    var isOutOfStock = item.quantity <= 0;
    var stockLabel = isOutOfStock ? "Out of stock" : (item.quantity + " available");
    var disabledAttr = isOutOfStock ? " disabled" : "";
    var imageSrc = fixImagePath(item.image);

    html += '<div class="col-6 col-md-4 col-lg-3">' +
      '<div class="food-card">' +
        '<img src="' + imageSrc + '" alt="' + item.name + '">' +
        '<div class="food-card-body">' +
          '<span class="food-category">' + item.category + '</span>' +
          '<h5>' + item.name + '</h5>' +
          '<p class="small text-muted">' + (item.description || "") + '</p>' +
          '<div class="d-flex justify-content-between align-items-center mt-auto">' +
            '<strong>' + formatMoney(item.price) + '</strong>' +
            '<button class="add-button" data-id="' + item.id + '"' + disabledAttr + ' title="Add to cart">' +
              '<i class="bi bi-plus-lg"></i>' +
            '</button>' +
          '</div>' +
          '<p class="stock-text">' + stockLabel + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  menuFoods.innerHTML = html;

  // Add click listener to each "Add to Cart" (+) button
  var addButtons = document.querySelectorAll(".add-button");
  for (var k = 0; k < addButtons.length; k++) {
    addButtons[k].addEventListener("click", function() {
      var foodId = Number(this.getAttribute("data-id"));
      addToCart(foodId);
    });
  }
}

// Send request to server to add selected item to cart
function addToCart(foodId) {
  var requestData = {
    food_id: foodId
  };

  sendRequest(
    "/api/cart",
    "POST",
    requestData,
    function(response) {
      updateCartCount();
      alert("Item added to cart!");
    },
    function(errorMessage) {
      alert(errorMessage);
    }
  );
}

// Initial function to fetch all foods from the server and render the page
function startMenu() {
  sendRequest(
    "/api/foods",
    "GET",
    null,
    function(foods) {
      allFoods = foods;
      showFoods();
    },
    function(error) {
      // If server is offline, use default sample dishes
      allFoods = SAMPLE_FOODS;
      showFoods();
    }
  );
}

// Start loading the menu
startMenu();
