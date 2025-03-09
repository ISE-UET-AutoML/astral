# config.py
import configparser

# Tạo đối tượng configparser
config = configparser.ConfigParser()

# Đọc tệp environment.ini
config.read("environment.ini")

# Lưu trữ các biến môi trường
API_KEY = config["vastai"]["API_KEY"]
# Lưu trữ các biến môi trường
HOST = config["resource_service"]["host"]
PORT = config["resource_service"]["port"]
