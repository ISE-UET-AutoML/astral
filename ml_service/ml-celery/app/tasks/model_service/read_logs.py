import paramiko
import time
import re

# Connection details
hostname = "your_server_ip"
port = 2222
username = "root"
password = "your_password"
log_file_path = "/path/to/log_file.txt"  # path to the log file on the server

# Set up the SSH client and SFTP
ssh_client = paramiko.SSHClient()
ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_client.connect(hostname=hostname, port=port, username=username, password=password)
sftp = ssh_client.open_sftp()

# Regular expressions to extract epoch, val_accuracy, and completion
epoch_pattern = re.compile(r"Epoch (\d+),")
accuracy_pattern = re.compile(r"'val_accuracy' reached ([\d\.]+)")
completion_pattern = re.compile(r"(Time limit reached|Signaling Trainer to stop)")

# Initialize tracking variables
last_position = 0  # Tracks the last read position in the file
completed = False

# Periodic reading loop
try:
    while not completed:
        with sftp.open(log_file_path, "r") as remote_file:
            # Move to the last read position
            remote_file.seek(last_position)

            # Read new lines from the file
            new_lines = remote_file.readlines()
            last_position = remote_file.tell()  # Update the position for the next read

            # Process each new line
            for line in new_lines:
                # Check for epoch number
                epoch_match = epoch_pattern.search(line)
                if epoch_match:
                    epoch = int(epoch_match.group(1))
                    print(f"Epoch: {epoch}")

                # Check for validation accuracy
                accuracy_match = accuracy_pattern.search(line)
                if accuracy_match:
                    val_accuracy = float(accuracy_match.group(1))
                    print(f"Validation Accuracy: {val_accuracy}")

                # Check for completion indicator
                if completion_pattern.search(line):
                    completed = True
                    print("Training process has completed.")
                    break

        # Sleep before checking for new lines again
        time.sleep(5)

finally:
    # Close SFTP and SSH connections
    sftp.close()
    ssh_client.close()
