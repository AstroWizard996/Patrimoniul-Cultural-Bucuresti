
import http.server
import ssl
import socket
import os
import sys

# Define server address and port
PORT = 8000
ADDRESS = "0.0.0.0"

# Files
CERT_FILE = "cert.pem"
KEY_FILE = "key.pem"

def check_certificates():
    missing = []
    if not os.path.exists(CERT_FILE):
        missing.append(CERT_FILE)
    if not os.path.exists(KEY_FILE):
        missing.append(KEY_FILE)
    
    if missing:
        print("Error: Missing SSL certificate files.")
        print(f"Missing: {', '.join(missing)}")
        print("\nPlease generate self-signed certificates using OpenSSL or another tool.")
        print(f"   openssl req -new -x509 -keyout {KEY_FILE} -out {CERT_FILE} -days 365 -nodes")
        return False
    return True

# Function to get local IP address
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def run():
    print("-" * 50)
    print("      Starting Local SSL Web Server")
    print("-" * 50)

    if not check_certificates():
        input("\nPress Enter to exit...")
        sys.exit(1)

    # Create a custom handler to serve files from the current directory
    Handler = http.server.SimpleHTTPRequestHandler

    # Create the server
    httpd = http.server.HTTPServer((ADDRESS, PORT), Handler)

    # Create an SSL context
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    try:
        context.load_cert_chain(certfile=CERT_FILE, keyfile=KEY_FILE)
    except Exception as e:
        print(f"Error loading certificates: {e}")
        input("\nPress Enter to exit...")
        sys.exit(1)

    # Wrap the server socket with SSL
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print(f"Serving HTTPS on port {PORT}")
    print(f"Local access: https://localhost:{PORT}")
    print(f"LAN access:   https://{get_local_ip()}:{PORT}")
    print("\n[NOTE] Accept the 'unsafe' warning in your browser to view the site.")
    print("Use Ctrl+C to stop the server.")
    print("-" * 50)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == "__main__":
    run()
