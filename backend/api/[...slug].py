import sys
import os

# Add the backend directory to the Python path so it can find main.py and other modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from main import app
