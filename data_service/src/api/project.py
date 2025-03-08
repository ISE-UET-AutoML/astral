from .api import make_get_request


def get_project_infor(project_id):
    return make_get_request(f"/projects/{project_id}")


def get_project_data(project_id):
    return make_get_request(f"/projects/{project_id}/datasets")
    pass
