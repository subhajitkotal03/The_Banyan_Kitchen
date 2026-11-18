import os
import json
from datetime import datetime
from functools import wraps
from threading import Lock
from uuid import uuid4

from flask import Flask, jsonify, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "banyan-kitchen-secret-key-12345")

# Path to the data file where everything is stored
DATA_FILE = os.path.join(app.root_path, "data", "store.json")
DATA_LOCK = Lock()

# Default food menu items
DEFAULT_FOODS = [
    {
        "id": 1,
        "name": "Truffle Alfredo Pasta",
        "category": "Main Course",
        "price": 520,
        "quantity": 12,
        "image": "/static/assets/images/pasta.jpg",
        "description": "Creamy pasta with herbs"
    },
    {
        "id": 2,
        "name": "Classic Margherita Pizza",
        "category": "Pizza",
        "price": 480,
        "quantity": 10,
        "image": "/static/assets/images/pizza.jpg",
        "description": "Tomato, basil and mozzarella"
    },
    {
        "id": 3,
        "name": "Grilled Tenderloin Steak",
        "category": "Main Course",
        "price": 990,
        "quantity": 8,
        "image": "/static/assets/images/steak.jpg",
        "description": "Grilled and full of flavour"
    },
    {
        "id": 4,
        "name": "BBQ Chicken Burger",
        "category": "Burgers",
        "price": 460,
        "quantity": 15,
        "image": "/static/assets/images/burger.jpg",
        "description": "Juicy burger with house sauce"
    },
    {
        "id": 5,
        "name": "Garden Fresh Salad",
        "category": "Starters",
        "price": 320,
        "quantity": 20,
        "image": "/static/assets/images/salad.jpg",
        "description": "Fresh greens and seasonal vegetables"
    },
    {
        "id": 6,
        "name": "Chocolate Lava Cake",
        "category": "Desserts",
        "price": 350,
        "quantity": 9,
        "image": "/static/assets/images/dessert.jpg",
        "description": "Warm chocolate dessert"
    },
    {
        "id": 7,
        "name": "Fresh Lime Soda",
        "category": "Drinks",
        "price": 120,
        "quantity": 25,
        "image": "/static/assets/images/lime-soda.jpg",
        "description": "Refreshing lime drink"
    },
    {
        "id": 8,
        "name": "Crispy Veg Bites",
        "category": "Starters",
        "price": 260,
        "quantity": 18,
        "image": "/static/assets/images/veg-bites.jpg",
        "description": "Crispy bites with dip"
    }
]


# Default initial data structure for new setups
def initial_data():
    return {
        "foods": DEFAULT_FOODS,
        "orders": [],
        "carts": {},
        "messages": [],
        "users": [
            {
                "name": "Admin",
                "email": "admin@banyan.com",
                "password": "admin123",
                "role": "admin"
            },
            {
                "name": "Customer",
                "email": "customer@banyan.com",
                "password": "1234",
                "role": "customer"
            }
        ]
    }


# Read data from the JSON file using standard Python json module
def read_data():
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    if not os.path.exists(DATA_FILE):
        write_data(initial_data())
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


# Write data safely into the JSON file
def write_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    temporary_file = DATA_FILE + ".tmp"
    with open(temporary_file, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
    os.replace(temporary_file, DATA_FILE)


# Get unique identifier for the current browser session's cart
def cart_key():
    if "cart_key" not in session:
        session["cart_key"] = str(uuid4())
    return session["cart_key"]


# Remove sensitive password before sending user data to the browser
def public_user(user):
    return {
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }


# Security decorator to make sure only admin can access certain routes
def admin_required(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        current_user = session.get("user")
        if not current_user or current_user.get("role") != "admin":
            return jsonify({"error": "Admin access required."}), 403
        return view_function(*args, **kwargs)
    return wrapped


# Keep administrators inside the management area instead of customer pages.
def customer_page(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        current_user = session.get("user")
        if current_user and current_user.get("role") == "admin":
            return redirect(url_for("admin"))
        return view_function(*args, **kwargs)
    return wrapped


# Helper function to get full food details for items currently in cart
def cart_items(data):
    quantities = data["carts"].get(cart_key(), {})
    items = []
    for food in data["foods"]:
        food_id_str = str(food["id"])
        if food_id_str in quantities:
            item_copy = dict(food)
            item_copy["quantity"] = quantities[food_id_str]
            items.append(item_copy)
    return items


# =============================================================================
# HTML Page Routes
# =============================================================================

@app.route("/")
@app.route("/index.html")
@customer_page
def home():
    return render_template("index.html")


@app.route("/about.html")
@customer_page
def about():
    return render_template("about.html")


@app.route("/menu.html")
@customer_page
def menu():
    return render_template("menu.html")


@app.route("/contact.html")
@customer_page
def contact():
    return render_template("contact.html")


@app.route("/cart.html")
@customer_page
def cart():
    return render_template("cart.html")


@app.route("/login.html")
def login():
    current_user = session.get("user")
    if current_user and current_user.get("role") == "admin":
        return redirect(url_for("admin"))
    return render_template("login.html")


@app.route("/admin.html")
def admin():
    current_user = session.get("user")
    if not current_user or current_user.get("role") != "admin":
        return redirect(url_for("login"))
    return render_template("admin.html")


# =============================================================================
# API Endpoints
# =============================================================================

# Get list of all available food items
@app.get("/api/foods")
def get_foods():
    with DATA_LOCK:
        data = read_data()
    return jsonify(data["foods"])


# Handle user login
@app.post("/api/login")
def api_login():
    details = request.get_json() or {}
    email = details.get("email", "").strip().lower()
    password = details.get("password", "")

    with DATA_LOCK:
        data = read_data()
        for user in data["users"]:
            if user["email"].lower() == email and user["password"] == password:
                session["user"] = public_user(user)
                return jsonify(session["user"])

    return jsonify({"error": "Incorrect email or password."}), 401


# Handle user registration
@app.post("/api/register")
def api_register():
    details = request.get_json() or {}
    name = details.get("name", "").strip()
    email = details.get("email", "").strip().lower()
    password = details.get("password", "")

    if not name or not email or len(password) < 4:
        return jsonify({"error": "Enter your name, email, and a password with at least 4 characters."}), 400

    with DATA_LOCK:
        data = read_data()
        # Check if email is already taken
        for user in data["users"]:
            if user["email"].lower() == email:
                return jsonify({"error": "An account already exists for this email address."}), 409

        # Create new customer account
        new_user = {
            "name": name,
            "email": email,
            "password": password,
            "role": "customer"
        }
        data["users"].append(new_user)
        write_data(data)

    session["user"] = public_user(new_user)
    return jsonify(session["user"]), 201


# Log out user
@app.post("/api/logout")
def api_logout():
    session.pop("user", None)
    return "", 204


# Check currently logged in user
@app.get("/api/current-user")
def current_user():
    return jsonify(session.get("user"))


# Get items currently in the user's cart
@app.get("/api/cart")
def get_cart():
    with DATA_LOCK:
        data = read_data()
        items = cart_items(data)
    return jsonify(items)


# Add an item to cart
@app.post("/api/cart")
def add_cart_item():
    payload = request.get_json() or {}
    food_id = str(payload.get("food_id"))

    with DATA_LOCK:
        data = read_data()

        # Find the food item in database
        target_food = None
        for food in data["foods"]:
            if str(food["id"]) == food_id:
                target_food = food
                break

        if target_food is None or target_food["quantity"] < 1:
            return jsonify({"error": "This item is unavailable or out of stock."}), 400

        user_cart = data["carts"].setdefault(cart_key(), {})
        current_in_cart = user_cart.get(food_id, 0)

        # Do not allow adding more than available stock
        if current_in_cart < target_food["quantity"]:
            user_cart[food_id] = current_in_cart + 1
        else:
            return jsonify({"error": "Cannot add more. Reached maximum available stock."}), 400

        write_data(data)

    return jsonify({"message": "Item added to cart."}), 201


# Change item quantity in cart (+, -, remove)
@app.patch("/api/cart/<int:food_id>")
def change_cart_item(food_id):
    payload = request.get_json() or {}
    action = payload.get("action")
    key = str(food_id)

    with DATA_LOCK:
        data = read_data()
        user_cart = data["carts"].setdefault(cart_key(), {})

        # Find food in database to check stock
        target_food = None
        for food in data["foods"]:
            if food["id"] == food_id:
                target_food = food
                break

        current_qty = user_cart.get(key, 0)

        if action == "plus":
            if target_food and current_qty < target_food["quantity"]:
                user_cart[key] = current_qty + 1
        elif action == "minus":
            user_cart[key] = current_qty - 1
        elif action == "remove":
            user_cart[key] = 0

        # If quantity becomes 0 or less, remove item from cart
        if user_cart.get(key, 0) <= 0:
            user_cart.pop(key, None)

        write_data(data)

    return "", 204


# Place order for items in the cart
@app.post("/api/checkout")
def checkout():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Please log in before placing an order."}), 401

    with DATA_LOCK:
        data = read_data()
        items = cart_items(data)

        if not items:
            return jsonify({"error": "Your cart is empty."}), 400

        # Verify all items have enough stock
        for item in items:
            for food in data["foods"]:
                if food["id"] == item["id"]:
                    if item["quantity"] > food["quantity"]:
                        return jsonify({"error": f"Not enough stock for {food['name']}."}), 400

        # Calculate subtotal and deduct stock
        subtotal = 0
        for item in items:
            subtotal = subtotal + (item["price"] * item["quantity"])
            for food in data["foods"]:
                if food["id"] == item["id"]:
                    food["quantity"] = food["quantity"] - item["quantity"]

        # Delivery fee is flat ₹40
        delivery_fee = 40
        total_amount = subtotal + delivery_fee

        order = {
            "id": int(datetime.now().timestamp() * 1000),
            "customer": user["email"],
            "items": items,
            "total": total_amount,
            "status": "Received",
            "date": datetime.now().strftime("%d %b %Y, %I:%M %p")
        }

        data["orders"].append(order)
        # Empty the user's cart after placing order
        data["carts"][cart_key()] = {}
        write_data(data)

    return jsonify(order), 201


# Save message from Contact Us form
@app.post("/api/messages")
def save_message():
    message = request.get_json() or {}
    name = message.get("name", "").strip()
    email = message.get("email", "").strip()
    content = message.get("message", "").strip()

    if not name or not email or not content:
        return jsonify({"error": "Please complete every field."}), 400

    with DATA_LOCK:
        data = read_data()
        saved_message = {
            "name": name,
            "email": email,
            "message": content,
            "date": datetime.now().strftime("%d %b %Y, %I:%M %p")
        }
        data["messages"].append(saved_message)
        write_data(data)

    return jsonify({"message": "Your message has been received."}), 201


# =============================================================================
# Admin Endpoints (Requires Admin Role)
# =============================================================================

# Fetch all admin data (foods, orders, messages)
@app.get("/api/admin/data")
@admin_required
def admin_data():
    with DATA_LOCK:
        data = read_data()
    return jsonify({
        "foods": data["foods"],
        "orders": data["orders"],
        "messages": data["messages"]
    })


# Add a new food item
@app.post("/api/admin/foods")
@admin_required
def create_food():
    food = request.get_json() or {}
    name = str(food.get("name", "")).strip()
    category = str(food.get("category", "")).strip()
    price = food.get("price")
    quantity = food.get("quantity")

    if not name or not category or price is None or quantity is None:
        return jsonify({"error": "Please complete all food details."}), 400

    with DATA_LOCK:
        data = read_data()
        # Find maximum existing ID to assign the next ID
        max_id = 0
        for item in data["foods"]:
            if item["id"] > max_id:
                max_id = item["id"]

        new_food = {
            "id": max_id + 1,
            "name": name,
            "category": category,
            "price": float(price),
            "quantity": int(quantity),
            "description": food.get("description") or "Prepared fresh at The Banyan Kitchen",
            "image": food.get("image") or "/static/assets/images/fallback-food.jpg"
        }
        data["foods"].append(new_food)
        write_data(data)

    return jsonify(new_food), 201


# Update an existing food item
@app.put("/api/admin/foods/<int:food_id>")
@admin_required
def update_food(food_id):
    updates = request.get_json() or {}

    with DATA_LOCK:
        data = read_data()
        target_food = None
        for item in data["foods"]:
            if item["id"] == food_id:
                target_food = item
                break

        if target_food is None:
            return jsonify({"error": "Food item not found."}), 404

        if "name" in updates:
            target_food["name"] = updates["name"].strip()
        if "category" in updates:
            target_food["category"] = updates["category"]
        if "price" in updates:
            target_food["price"] = float(updates["price"])
        if "quantity" in updates:
            target_food["quantity"] = int(updates["quantity"])
        if "image" in updates and updates["image"].strip():
            target_food["image"] = updates["image"].strip()
        if "description" in updates and updates["description"].strip():
            target_food["description"] = updates["description"].strip()

        write_data(data)

    return jsonify(target_food)


# Delete a food item
@app.delete("/api/admin/foods/<int:food_id>")
@admin_required
def delete_food(food_id):
    with DATA_LOCK:
        data = read_data()
        updated_foods = []
        for food in data["foods"]:
            if food["id"] != food_id:
                updated_foods.append(food)
        data["foods"] = updated_foods
        write_data(data)

    return "", 204


# Update order status (Received, Preparing, Completed, Cancelled)
@app.patch("/api/admin/orders/<int:order_id>")
@admin_required
def update_order(order_id):
    payload = request.get_json() or {}
    new_status = payload.get("status")

    with DATA_LOCK:
        data = read_data()
        target_order = None
        for order in data["orders"]:
            if order["id"] == order_id:
                target_order = order
                break

        if target_order is None:
            return jsonify({"error": "Order not found."}), 404

        target_order["status"] = new_status
        write_data(data)

    return jsonify(target_order)


# =============================================================================
# Run the application
# =============================================================================
if __name__ == "__main__":
    app.run(debug=True)
