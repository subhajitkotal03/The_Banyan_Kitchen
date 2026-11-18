// =============================================================================
// The Banyan Kitchen - Home Page JavaScript
// =============================================================================

// Render foods list into the featured foods container
function renderFeatured(foods) {
  var featuredFoodsContainer = document.getElementById("featuredFoods");
  if (!featuredFoodsContainer || !foods) {
    return;
  }

  var html = "";
  var limit = foods.length > 4 ? 4 : foods.length;

  for (var i = 0; i < limit; i++) {
    var food = foods[i];
    var imageSrc = fixImagePath(food.image);

    html += '<div class="col-6 col-lg-3">' +
      '<div class="food-card">' +
        '<img src="' + imageSrc + '" alt="' + food.name + '">' +
        '<div class="food-card-body">' +
          '<span class="food-category">' + food.category + '</span>' +
          '<h5>' + food.name + '</h5>' +
          '<p class="small text-muted">' + (food.description || "") + '</p>' +
          '<div class="d-flex justify-content-between align-items-center mt-auto">' +
            '<strong>' + formatMoney(food.price) + '</strong>' +
            '<a class="round-arrow" href="menu.html" aria-label="View menu"><i class="bi bi-arrow-right"></i></a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  featuredFoodsContainer.innerHTML = html;
}

// Fetch and display featured food items on the home page
function showFeaturedFoods() {
  sendRequest(
    "/api/foods",
    "GET",
    null,
    function(foods) {
      // Backend responded successfully
      renderFeatured(foods);
    },
    function(error) {
      // If server is not running (e.g. previewing files directly), use sample dishes
      renderFeatured(SAMPLE_FOODS);
    }
  );
}

// Run the function when home page loads
showFeaturedFoods();
