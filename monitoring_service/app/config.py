# config.py
import configparser

# Tạo đối tượng configparser
config = configparser.ConfigParser()

# Đọc tệp environment.ini
config.read("environment.ini")

# Lưu trữ các biến môi trường
API_KEY = config["vastai"]["api_key"]
