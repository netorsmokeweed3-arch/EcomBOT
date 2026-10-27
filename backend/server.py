import os
from flask import Flask, jsonify
import requests

app = Flask(__name__)

# Твій токен доступу до Prom.ua API
PROM_TOKEN = "3f7ee5349834e4721e43904eb1119c94db65a83c"
PROM_API_URL = "https://my.prom.ua/api/v1/orders/list"


@app.route("/")
def home():
  return "EcomBot Backend is running successfully!"


@app.route("/api/orders", methods=["GET"])
def get_orders():
  headers = {
      "Authorization": f"Bearer {PROM_TOKEN}",
      "Content-Type": "application/json",
  }

  try:
    # Запит до API Prom.ua для отримання замовлень
    response = requests.get(PROM_API_URL, headers=headers)

    if response.status_code == 200:
      data = response.json()
      # Prom зазвичай повертає замовлення у полі 'orders'
      orders = data.get("orders", [])
      return jsonify({"success": True, "orders": orders})
    else:
      print(f"Помилка Prom API: {response.status_code}, {response.text}")
      return jsonify(
          {
              "success": False,
              "message": f"Помилка від Prom API: {response.status_code}",
          }
      ), 500

  except Exception as e:
    print(f"Виняток при запиті до Prom: {e}")
    return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5000)