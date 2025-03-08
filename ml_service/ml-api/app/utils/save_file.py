import os
import uuid
from settings.config import HOST, PORT


def save_file_to_public(content, file_extension):
    file_path = f"./public/media/{uuid.uuid4().hex}.{file_extension}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    print(f"Saving file to {file_path}")
    with open(file_path, "wb+") as buffer:
        buffer.write(content)
    return f"http://localhost:{PORT}/{file_path.removeprefix('./')}"
