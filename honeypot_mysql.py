#!/usr/bin/env python3
"""
MySQL Honeypot Implementation
Simulates a MySQL database server to capture attack attempts
"""

import socket
import threading
import struct
import hashlib
import os
import logging
from datetime import datetime

class MySQLHoneypot:
    def __init__(self, config):
        self.config = config
        self.host = '0.0.0.0'
        self.port = int(config.get('port', 3306))
        self.mysql_version = config.get('mysql_version', '5.7.36')
        self.database_names = self._parse_databases(config.get('database_names', ''))
        self.user_accounts = self._parse_users(config.get('user_accounts', ''))
        self.ssl_enabled = config.get('ssl_enabled', False)
        self.running = False
        self.server_socket = None
        self.connections = []
        
        # Setup logging
        self.logger = self._setup_logging()
        
    def _setup_logging(self):
        """Setup logging for MySQL honeypot"""
        logger = logging.getLogger(f'mysql_honeypot_{self.port}')
        logger.setLevel(logging.INFO)
        
        # Create file handler
        log_file = f'logs/mysql_honeypot_{self.port}.log'
        os.makedirs('logs', exist_ok=True)
        
        handler = logging.FileHandler(log_file)
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger
        
    def _parse_databases(self, databases_str):
        """Parse database names from configuration"""
        if databases_str:
            return [db.strip() for db in databases_str.strip().split('\n') if db.strip()]
        return ['information_schema', 'mysql', 'performance_schema', 'test_db']
        
    def _parse_users(self, users_str):
        """Parse user accounts from configuration"""
        users = {}
        if users_str:
            for line in users_str.strip().split('\n'):
                if ':' in line:
                    parts = line.split(':')
                    if len(parts) >= 3:
                        username = parts[0].strip()
                        password = parts[1].strip()
                        host = parts[2].strip()
                        users[username] = {'password': password, 'host': host}
        
        # Add default users if none specified
        if not users:
            users = {
                'root': {'password': 'admin123', 'host': 'localhost'},
                'admin': {'password': 'password', 'host': '%'},
                'user': {'password': 'user123', 'host': '%'}
            }
        
        return users
        
    def start(self):
        """Start the MySQL honeypot"""
        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(5)
            self.running = True
            
            self.logger.info(f"MySQL Honeypot started on {self.host}:{self.port}")
            print(f"MySQL Honeypot listening on port {self.port}")
            
            while self.running:
                try:
                    client_socket, address = self.server_socket.accept()
                    client_thread = threading.Thread(
                        target=self._handle_client,
                        args=(client_socket, address)
                    )
                    client_thread.daemon = True
                    client_thread.start()
                    
                except socket.error:
                    if self.running:
                        self.logger.error("Socket error in main loop")
                    break
                    
        except Exception as e:
            self.logger.error(f"Failed to start MySQL honeypot: {e}")
            print(f"Error starting MySQL honeypot: {e}")
            
    def stop(self):
        """Stop the MySQL honeypot"""
        self.running = False
        if self.server_socket:
            self.server_socket.close()
        
        # Close all client connections
        for conn in self.connections:
            try:
                conn.close()
            except:
                pass
        self.connections.clear()
        
        self.logger.info("MySQL Honeypot stopped")
        print(f"MySQL Honeypot on port {self.port} stopped")

def create_mysql_honeypot(config):
    """Factory function to create MySQL honeypot"""
    return MySQLHoneypot(config)

# Legacy function for backward compatibility
def log_mysql_attempt(ip, port, data):
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] Connection from {ip}:{port} | Data: {data.decode(errors='ignore')}\n"
    print(log_entry.strip())
    
    log_file = 'logs/mysql_honeypot_legacy.log'
    os.makedirs('logs', exist_ok=True)
    with open(log_file, 'a') as f:
        f.write(log_entry)

def run_mysql_honeypot(host='0.0.0.0', port=3306):
    """Legacy function for simple MySQL honeypot"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((host, port))
        s.listen(5)
        print(f"MySQL honeypot listening on {host}:{port}")

        while True:
            conn, addr = s.accept()
            with conn:
                ip, port = addr
                try:
                    # Simulate MySQL handshake packet
                    fake_handshake = b'\x10\x00\x00\x01\x0a5.7.33\x00\x08\x00\x00\x00\x44\x2a\x2e\x1b\x00\xff\xf7\x08\x02\x00\x0f\x80\x15\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x6d\x79\x73\x71\x6c\x5f\x68\x70\x00'
                    conn.sendall(fake_handshake)

                    data = conn.recv(1024)
                    log_mysql_attempt(ip, port, data)

                    # Simulate server response
                    conn.sendall(b'\xff\x00\x00\x02\x15Access denied.\n')

                except Exception as e:
                    print(f"[!] Error handling connection: {e}")

if __name__ == "__main__":
    # Test configuration
    test_config = {
        'port': 3307,
        'mysql_version': '5.7.36',
        'database_names': 'test_db\nproduction\ncustomer_data',
        'user_accounts': 'root:admin123:localhost\nuser:password:%',
        'ssl_enabled': False
    }
    
    honeypot = MySQLHoneypot(test_config)
    try:
        honeypot.start()
    except KeyboardInterrupt:
        honeypot.stop()
