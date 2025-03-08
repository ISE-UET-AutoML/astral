from utils.gcp import Storage

storage: Storage = Storage()


def get_storage_client() -> Storage:
    global storage
    if storage is None:
        storage = Storage()  # Your function to initialize the client
    return storage
