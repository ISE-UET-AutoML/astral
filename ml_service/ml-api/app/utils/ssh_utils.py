import os
import stat
import time
import paramiko

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from vastai import VastAI
from settings.config import VAST_AI_API_KEY

TEMP_DIR="./instance_ssh_keys"
vast_sdk = VastAI(api_key=VAST_AI_API_KEY)

def generate_ssh_key_pair(task_id):
    
    
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    
    # Save the keys to files named with the task_id
    private_key_path = f"{TEMP_DIR}/{task_id}_id_rsa"
    public_key_path = f"{TEMP_DIR}/{task_id}_id_rsa.pub"
    
    if os.path.exists(private_key_path):
        return private_key_path
    
    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )

    # Serialize the private key
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )

    # Generate public key
    public_key = private_key.public_key()

    # Serialize the public key in OpenSSH format
    public_key_openssh = public_key.public_bytes(
        encoding=serialization.Encoding.OpenSSH,
        format=serialization.PublicFormat.OpenSSH
    )

    # Save the private key with strict permissions
    with open(private_key_path, "wb") as f:
        f.write(private_key_pem)
    os.chmod(private_key_path, stat.S_IRUSR | stat.S_IWUSR)  # Permissions 0600: owner read/write only

    # Save the public key with standard permissions
    with open(public_key_path, "wb") as f:
        f.write(public_key_openssh)
    os.chmod(public_key_path, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)  # Permissions 0644

    # Convert the public key to a string format
    public_key_string = public_key_openssh.decode("utf-8")

    print(f"SSH key pair generated and saved as '{private_key_path}' (private key) and '{public_key_path}' (public key).")

    return private_key_path
    
# Example usage
if __name__ == "__main__":
    generate_ssh_key_pair("task123")


def get_private_key_filename(task_id):
    return f"{TEMP_DIR}/{task_id}_id_rsa"

def attach_ssh_key_to_instance(task_id, instance_id):
    public_key_filename = f"{TEMP_DIR}/{task_id}_id_rsa.pub"
    with open(public_key_filename, "rb") as f:
        public_key_string = f.read().decode("utf-8")

    response = vast_sdk.attach_ssh(instance_id=instance_id, ssh_key=public_key_string)
    
    return response


def connect_with_retries(hostname, port, username, private_key_path, max_retries=5, delay=5):
    ssh_client = paramiko.SSHClient()
    ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    retries = 0
    while retries < max_retries:
        try:
            print(f"Attempting to connect to {hostname}:{port} (Attempt {retries + 1}/{max_retries})")
            ssh_client.connect(
                hostname=hostname,
                port=port,
                username=username,
                key_filename=private_key_path,
                timeout=10
            )
            print("Connected successfully.")
            return ssh_client  # Return the connected SSH client
        except (Exception) as e:
            print(f"Connection failed: {e}")
            retries += 1
            if retries < max_retries:
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                print("Max retries reached. Could not connect.")
                raise Exception # Raise the exception after max retries