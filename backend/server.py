from flask import Flask, jsonify, request

app = Flask(__name__)

# Тестова база даних замовлень (в майбутньому підключимо Prom API)
mock_orders = [
    {
        "id": "1",
        "orderNumber": "Prom #10492",
        "customerName": "Олена Ковальчук",
        "phone": "+380 67 123 4567",
        "city": "Львів",
        "postOffice": "Відділення №12",
        "status": "new",
        "totalAmount": 1450,
        "createdAt": "10:15",
        "items": [{"id": "item-1", "name": "Бездротові навушники", "quantity": 1, "price": 1450}]
    },
    {
        "id": "2",
        "orderNumber": "Prom #10491",
        "customerName": "Іван Мельник",
        "phone": "+380 50 987 6543",
        "city": "Київ",
        "postOffice": "Відділення №45",
        "status": "processing",
        "totalAmount": 890,
        "createdAt": "09:40",
        "items": [{"id": "item-2", "name": "Чохол для телефону", "quantity": 2, "price": 445}]
    }
]

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "EcomBot Backend Active", "version": "1.0"})

@app.route("/api/orders", methods=["GET"])
def get_orders():
    # Ендпоінт, з якого додаток підтягуватиме замовлення
    return jsonify({"success": True, "orders": mock_orders})

@app.route("/api/webhook/prom", methods=["POST"])
def prom_webhook():
    # Сюди Prom.ua надсилатиме нові замовлення
    data = request.json
    print("Отримано нове замовлення від Prom:", data)
    # Тут буде логіка обробки й сповіщення
    return jsonify({"status": "received"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
    