import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient
from app.routes.inventory import router as inventory_router
from app.routes.finance import router as finance_router
from app.routes.rf_maintenance import router as rf_router

@pytest.fixture(scope="session")
def app() -> FastAPI:
    app = FastAPI(title="Tregu Test API")
    app.include_router(inventory_router)
    app.include_router(finance_router)
    app.include_router(rf_router)
    return app

@pytest.fixture()
def client(app: FastAPI):
    return TestClient(app)
