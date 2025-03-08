import requests
import http.cookiejar
from settings.config import get_config

API_URL = get_config().BACKEND_IP

# Create a session
session = requests.Session()
session.cookies = http.cookiejar.CookieJar()


# Function to refresh the token
def refresh_token():
    response = session.get(f"{API_URL}/refresh-token")
    response.raise_for_status()
    return response.json()


# Response interceptor to handle token expiration
def handle_response(response):
    if "/login" in response.url or "/refresh-token" in response.url:
        return response

    if response.status_code == 200:
        if "jwt expired" in response.text:  # Adjust based on your API response
            session.cookies.clear("accessToken")  # Clear the expired token
            new_tokens = refresh_token()
            access_token = new_tokens.get("accessToken")
            if access_token:
                session.cookies.set("accessToken", access_token)
                return response  # Return the original response

    return response


# Function to make a POST request
def make_post_request(endpoint, data):
    url = f"{API_URL}{endpoint}"
    response = session.post(url, json=data)
    return handle_response(response)


def make_get_request(endpoint):
    url = f"{API_URL}{endpoint}"
    response = session.get(url)
    return handle_response(response)
