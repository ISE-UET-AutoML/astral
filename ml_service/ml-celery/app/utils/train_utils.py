import os


def find_in_current_dir(
    file_name,
    dir,
    is_pattern=True,
    extension: str | None = ".csv",
):
    """
    Find a file in the current directory
    if is_pattern is True, return file look like    **file_name**.extension
    if is_pattern is False, return file             file_name
    """
    for file in os.listdir(dir):
        if is_pattern:
            if file_name in file and file.endswith(extension):
                return file
        else:
            if file == file_name:
                return file
    return None
