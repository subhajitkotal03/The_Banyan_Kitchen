// =============================================================================
// The Banyan Kitchen - Admin Dashboard JavaScript
// =============================================================================

var foods = [];

var adminContent = document.getElementById("adminContent");
var adminDenied = document.getElementById("adminDenied");

var foodTotal = document.getElementById("foodTotal");
var orderTotal = document.getElementById("orderTotal");
var revenueTotal = document.getElementById("revenueTotal");

var adminFoodList = document.getElementById("adminFoodList");
var adminOrders = document.getElementById("adminOrders");
var adminMessages = document.getElementById("adminMessages");

var foodForm = document.getElementById("foodForm");
var foodId = document.getElementById("foodId");
var foodName = document.getElementById("foodName");
var foodCategory = document.getElementById("foodCategory");
var foodPrice = document.getElementById("foodPrice");
var foodImage = document.getElementById("foodImage");
var foodQuantity = document.getElementById("foodQuantity");
var foodFormTitle = document.getElementById("foodFormTitle");
var foodSaveButton = document.getElementById("foodSaveButton");
var adminMessage = document.getElementById("adminMessage");
var cancelEdit = document.getElementById("cancelEdit");
var adminLogout = document.getElementById("adminLogout");

// Display food items in the admin table
function showFoodRows() {
  if (!adminFoodList) {
    return;
  }

  var html = "";
  for (var i = 0; i < foods.length; i++) {
    var food = foods[i];
    html += '<tr>' +
      '<td>' + food.name + '<small class="d-block text-muted">' + food.category + '</small></td>' +
      '<td>' + formatMoney(food.price) + '</td>' +
      '<td>' + food.quantity + '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-outline-dark edit-food me-1" data-id="' + food.id + '">Edit</button>' +
        '<button class="btn btn-sm btn-outline-danger delete-food" data-id="' + food.id + '">Delete</button>' +
      '</td>' +
    '</tr>';
  }

  adminFoodList.innerHTML = html;

  // Attach click listener to Edit buttons
  var editButtons = document.querySelectorAll(".edit-food");
  for (var j = 0; j < editButtons.length; j++) {
    editButtons[j].addEventListener("click", function() {
      var id = Number(this.getAttribute("data-id"));
      editFood(id);
    });
  }

  // Attach click listener to Delete buttons
  var deleteButtons = document.querySelectorAll(".delete-food");
  for (var k = 0; k < deleteButtons.length; k++) {
    deleteButtons[k].addEventListener("click", function() {
      var id = Number(this.getAttribute("data-id"));
      deleteFood(id);
    });
  }
}

// Display orders placed by customers
function showOrderRows(orders) {
  if (!adminOrders) {
    return;
  }

  if (!orders || orders.length === 0) {
    adminOrders.innerHTML = '<tr><td colspan="5" class="text-muted">No orders yet.</td></tr>';
    return;
  }

  var html = "";
  var statuses = ["Received", "Preparing", "Completed", "Cancelled"];

  // Display newest orders first (loop backwards)
  for (var i = orders.length - 1; i >= 0; i--) {
    var order = orders[i];

    var itemsSummary = "";
    for (var m = 0; m < order.items.length; m++) {
      itemsSummary += order.items[m].name + " × " + order.items[m].quantity + "<br>";
    }

    var statusSelectHtml = '<select class="form-select form-select-sm order-status" data-id="' + order.id + '">';
    for (var s = 0; s < statuses.length; s++) {
      var statusOption = statuses[s];
      var isSelected = (statusOption === order.status) ? " selected" : "";
      statusSelectHtml += '<option value="' + statusOption + '"' + isSelected + '>' + statusOption + '</option>';
    }
    statusSelectHtml += '</select>';

    html += '<tr>' +
      '<td>#' + order.id + '<small class="d-block text-muted">' + order.date + '</small></td>' +
      '<td>' + order.customer + '</td>' +
      '<td>' + itemsSummary + '</td>' +
      '<td>' + formatMoney(order.total) + '</td>' +
      '<td>' + statusSelectHtml + '</td>' +
    '</tr>';
  }

  adminOrders.innerHTML = html;

  // Listen for changes on order status dropdowns
  var statusDropdowns = document.querySelectorAll(".order-status");
  for (var n = 0; n < statusDropdowns.length; n++) {
    statusDropdowns[n].addEventListener("change", function() {
      updateOrderStatus(this);
    });
  }
}

// Display messages sent through the Contact Us form
function showMessageRows(messages) {
  if (!adminMessages) {
    return;
  }

  if (!messages || messages.length === 0) {
    adminMessages.innerHTML = '<tr><td colspan="4" class="text-muted">No messages yet.</td></tr>';
    return;
  }

  var html = "";
  // Show newest messages first
  for (var i = messages.length - 1; i >= 0; i--) {
    var msg = messages[i];
    html += '<tr>' +
      '<td>' + msg.date + '</td>' +
      '<td>' + msg.name + '</td>' +
      '<td>' + msg.email + '</td>' +
      '<td>' + msg.message + '</td>' +
    '</tr>';
  }

  adminMessages.innerHTML = html;
}

// Fetch all dashboard data (foods, orders, messages) from the server
function showAdminData() {
  sendRequest("/api/admin/data", "GET", null, function(data) {
    foods = data.foods;

    foodTotal.textContent = foods.length;
    orderTotal.textContent = data.orders.length;

    // Calculate total revenue using a simple loop
    var totalRevenue = 0;
    for (var i = 0; i < data.orders.length; i++) {
      totalRevenue = totalRevenue + data.orders[i].total;
    }
    revenueTotal.textContent = formatMoney(totalRevenue);

    showFoodRows();
    showOrderRows(data.orders);
    showMessageRows(data.messages);
  });
}

// Populate the form to edit an existing food item
function editFood(id) {
  var selectedItem = null;
  for (var i = 0; i < foods.length; i++) {
    if (foods[i].id === id) {
      selectedItem = foods[i];
      break;
    }
  }

  if (!selectedItem) {
    return;
  }

  foodId.value = selectedItem.id;
  foodName.value = selectedItem.name;
  foodCategory.value = selectedItem.category;
  foodPrice.value = selectedItem.price;
  foodImage.value = selectedItem.image;
  foodQuantity.value = selectedItem.quantity;

  foodFormTitle.textContent = "Edit food item";
  foodSaveButton.textContent = "Update food item";
}

// Delete a food item by sending DELETE request to server
function deleteFood(id) {
  if (!confirm("Are you sure you want to delete this food item?")) {
    return;
  }

  sendRequest("/api/admin/foods/" + id, "DELETE", null, function() {
    showAdminData();
  });
}

// Reset the food form back to "Add food item" mode
function clearFoodForm() {
  if (!foodForm) {
    return;
  }
  foodForm.reset();
  foodId.value = "";
  foodFormTitle.textContent = "Add food item";
  foodSaveButton.textContent = "Save food item";
  adminMessage.textContent = "";
}

// Update the order status in the server
function updateOrderStatus(selectElement) {
  var orderId = selectElement.getAttribute("data-id");
  var newStatus = selectElement.value;

  sendRequest(
    "/api/admin/orders/" + orderId,
    "PATCH",
    { status: newStatus },
    function() {
      // Status updated successfully
    },
    function(errorMessage) {
      alert(errorMessage);
    }
  );
}

// Handle food form submission (either Add New Food or Update Existing Food)
if (foodForm) {
  foodForm.addEventListener("submit", function(event) {
    event.preventDefault();

    var foodPayload = {
      name: foodName.value.trim(),
      category: foodCategory.value,
      price: Number(foodPrice.value),
      image: foodImage.value.trim(),
      quantity: Number(foodQuantity.value)
    };

    var isEditing = (foodId.value !== "");
    var url = isEditing ? ("/api/admin/foods/" + foodId.value) : "/api/admin/foods";
    var method = isEditing ? "PUT" : "POST";

    sendRequest(
      url,
      method,
      foodPayload,
      function() {
        adminMessage.textContent = "Food item saved successfully!";
        clearFoodForm();
        showAdminData();
      },
      function(errorMessage) {
        adminMessage.textContent = errorMessage;
      }
    );
  });
}

if (cancelEdit) {
  cancelEdit.addEventListener("click", clearFoodForm);
}

// Handle Admin Logout button
if (adminLogout) {
  adminLogout.addEventListener("click", function() {
    sendRequest("/api/logout", "POST", null, function() {
      window.location.href = "login.html";
    });
  });
}

// Start admin panel: verify permissions first
function startAdmin() {
  sendRequest("/api/current-user", "GET", null, function(user) {
    if (!user || user.role !== "admin") {
      // User is not logged in or is not an admin
      if (adminDenied) {
        adminDenied.classList.remove("d-none");
      }
      return;
    }

    // User is authorized as admin
    if (adminContent) {
      adminContent.classList.remove("d-none");
    }

    showAdminData();

    // Auto-refresh admin data every 10 seconds to catch new orders
    window.setInterval(function() {
      showAdminData();
    }, 10000);
  });
}

startAdmin();
