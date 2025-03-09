# config.py
import configparser

# Tạo đối tượng configparser
config = configparser.ConfigParser()

# Đọc tệp environment.ini
config.read("environment.ini")

# Lưu trữ các biến môi trường
HOST = config["monitoring_service"]["host"]
PORT = config["monitoring_service"]["port"]
