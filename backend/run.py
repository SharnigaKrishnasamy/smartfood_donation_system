"""
Entry point. Run with:  python run.py

Binds to 0.0.0.0 (not 127.0.0.1) so other devices on the same Wi-Fi/hotspot
can reach the backend at http://<this-laptop's-LAN-IP>:5000
"""

import socket

from app import create_app
from app.extensions import socketio

app = create_app()
from sqlalchemy import inspect
from app.extensions import db

with app.app_context():
    print("Database:", app.config["SQLALCHEMY_DATABASE_URI"])
    print("Tables:", inspect(db.engine).get_table_names())


def get_lan_ip():
    """Best-effort detection of this machine's LAN IP for a friendly startup message."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't actually send data; just used to determine the outbound interface
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except OSError:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


if __name__ == "__main__":
    lan_ip = get_lan_ip()
    port = 5000

    print("=" * 60)
    print(" Smart Food Donation Platform — Backend")
    print("=" * 60)
    print(f" Local:   http://127.0.0.1:{port}")
    print(f" LAN:     http://{lan_ip}:{port}")
    print("   ^ Use this LAN URL as the API base on other devices")
    print("     (phones/laptops) connected to the same Wi-Fi/hotspot.")
    print("=" * 60)

    socketio.run(app, host="0.0.0.0", port=port, debug=True, allow_unsafe_werkzeug=True)
