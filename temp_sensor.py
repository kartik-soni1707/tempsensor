#This is the script running on ur pi locally to record temp/humidity and send it to a DB!
import time, requests
from datetime import datetime
from zoneinfo import ZoneInfo
import board
import adafruit_dht
import os

dht=None
DB_URL = os.environ.get("<YOUR_DB_URL>")
DB_KEY =  os.environ.get("<YOUR_DB_KEY>")
def insert_sensor_data(temperature, humidity):
    data = [{
        "temperature": temperature,
        "humidity": humidity
    }]
    HEADERS = {
        "apikey": DB_KEY,
        "Authorization": f"Bearer {DB_KEY}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(DB_URL, json=data, headers=HEADERS)
        if response.status_code in [200, 201]:
            print(f"Data inserted: {temperature}°C, {humidity}%")
        else:
            print(f"Failed to insert data: {response.status_code}, {response.text}")
    except Exception as e:
        print(f"Error: {e}")

try:
    dht = adafruit_dht.DHT11(board.D3)
    print(f'Data at {datetime.now(ZoneInfo("America/Los_Angeles")).strftime("%y-%m-%d %H:%M:%S")}')
    try:
        temp = dht.temperature
        hum = dht.humidity
        print(f"Temp: {temp}°C  Humidity: {hum}%")
        insert_sensor_data(temp,hum)
    except RuntimeError:
        print("Error!!")
finally:
    # Cleanup to release GPIO
    if dht:
        print("Dht was set")
        dht.exit()


