
import os
from dotenv import load_dotenv
from app import create_app

# Load environment variables before creating the Flask app
load_dotenv()

app = create_app()

if __name__ == "__main__":
    # Debug is enabled only when explicitly requested
    app.run(
        host="127.0.0.1",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1"
    )
