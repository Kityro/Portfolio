import os
import sys

# Add the current directory to the Python path so imports work correctly
sys.path.insert(0, os.path.dirname(__file__))

# Import the FastAPI application
from main import app
from a2wsgi import ASGIMiddleware

# Wrap the FastAPI (ASGI) application with ASGIMiddleware to convert it to WSGI
application = ASGIMiddleware(app)
