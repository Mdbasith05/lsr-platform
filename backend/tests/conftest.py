import pytest
from app.main import app
from app.core.security import get_current_user, AuthenticatedUser


@pytest.fixture(autouse=True)
def isolated_auth_override(request):
    """
    Test fixture providing an isolated mock AuthenticatedUser for tests
    unless the test is explicitly marked as 'unauthenticated'.
    Guarantees that dependency overrides are strictly contained to tests
    and cleared during teardown.
    """
    if "unauthenticated" in request.keywords:
        # Do not override auth for unauthenticated tests
        app.dependency_overrides.pop(get_current_user, None)
        yield
        return

    mock_user = AuthenticatedUser(
        user_id="adv-rajesh-001",
        tenant_id="chamber-001",
        email="advocate.rajesh@lsr-platform.in",
        role="Senior Empaneled Advocate",
        name="Adv. Rajesh Kumar",
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        yield mock_user
    finally:
        app.dependency_overrides.pop(get_current_user, None)
