from fastapi import Request


def get_profiling_service(request: Request):
    return request.app.state.profiling_service


def get_storage_service(request: Request):
    return request.app.state.storage_service
