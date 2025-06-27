from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, flash
import os
import json
import subprocess
import threading
import datetime
import time
from typing import Dict, List, Optional
import signal
import psutil
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'zip', 'py', 'sh', 'conf'}
HONEYPOT_CONFIGS_FILE = 'honeypot_configs.json'
RUNNING_HONEYPOTS_FILE = 'running_honeypots.json'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure required directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('logs', exist_ok=True)
os.makedirs('templates', exist_ok=True)
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)

# Honeypot types and their default configurations
HONEYPOT_TYPES = {
    'cowrie': {
        'name': 'Cowrie SSH/Telnet Honeypot',
        'description': 'Medium-interaction SSH and Telnet honeypot designed to log brute force attacks and shell interaction.',
        'default_port': 2222,
        'supported_ports': [22, 2222, 23, 2323],
        'features': ['ssh', 'telnet', 'session_recording', 'file_upload', 'fake_filesystem'],
        'category': 'Remote Access',
        'config_fields': ['username', 'password', 'banner', 'fake_commands', 'session_timeout']
    },
    'ftp_honeypot': {
        'name': 'Pure-FTPd Honeypot',
        'description': 'Dedicated FTP honeypot with comprehensive file operation logging and fake directory structures.',
        'default_port': 21,
        'supported_ports': [21, 2121, 9021],
        'features': ['ftp', 'anonymous_login', 'file_operations', 'directory_listing', 'upload_capture'],
        'category': 'File Transfer',
        'config_fields': ['anonymous_login', 'ftp_banner', 'max_connections', 'fake_files', 'upload_dir']
    },
    'telnet_switch': {
        'name': 'Telnet Network Switch Honeypot',
        'description': 'Simulates a Cisco/Juniper network switch or router with Telnet management interface.',
        'default_port': 23,
        'supported_ports': [23, 2323, 992],
        'features': ['telnet', 'command_simulation', 'device_emulation', 'privilege_escalation'],
        'category': 'Network Device',
        'config_fields': ['device_type', 'hostname', 'enable_password', 'motd', 'interface_config']
    },
    'mysql_honeypot': {
        'name': 'MySQL Database Honeypot',
        'description': 'MySQL database honeypot to catch database attacks, SQL injection attempts, and credential harvesting.',
        'default_port': 3306,
        'supported_ports': [3306, 3307, 33060],
        'features': ['mysql', 'sql_logging', 'authentication_logging', 'query_analysis'],
        'category': 'Database',
        'config_fields': ['mysql_version', 'database_names', 'table_schemas', 'user_accounts', 'ssl_enabled']
    },
    'phpmyadmin_honeypot': {
        'name': 'phpMyAdmin Honeypot',
        'description': 'Web-based database administration interface honeypot for catching web-based database attacks.',
        'default_port': 80,
        'supported_ports': [80, 8080, 443, 8443],
        'features': ['http', 'php', 'mysql_simulation', 'web_attacks', 'admin_panel'],
        'category': 'Web Application',
        'config_fields': ['phpmyadmin_version', 'login_page', 'fake_databases', 'error_messages', 'theme']
    },
    'dionaea': {
        'name': 'Dionaea Multi-Protocol Honeypot',
        'description': 'Low-interaction honeypot that captures malware and supports FTP, HTTP, SMB protocols.',
        'default_port': 21,
        'supported_ports': [21, 80, 443, 135, 445],
        'features': ['ftp', 'http', 'smb', 'anonymous_login', 'malware_capture'],
        'category': 'Multi-Service',
        'config_fields': ['protocols', 'malware_dir', 'download_limits', 'blacklists']
    },
    'glastopf': {
        'name': 'Glastopf Web Application Honeypot',
        'description': 'Web application honeypot that simulates common web vulnerabilities and CMS platforms.',
        'default_port': 80,
        'supported_ports': [80, 443, 8080, 8443],
        'features': ['web', 'sql_injection', 'xss', 'file_inclusion', 'cms_simulation'],
        'category': 'Web Application',
        'config_fields': ['web_root', 'cms_type', 'vulnerability_modules', 'response_pages']
    },
    'rdp_honeypot': {
        'name': 'RDP Honeypot',
        'description': 'Remote Desktop Protocol honeypot for Windows-based attacks and credential harvesting.',
        'default_port': 3389,
        'supported_ports': [3389, 3390, 33890],
        'features': ['rdp', 'authentication_logging', 'session_capture', 'screenshot_capture'],
        'category': 'Remote Access',
        'config_fields': ['computer_name', 'domain_name', 'rdp_banner', 'fake_users', 'certificate']
    },
    'smtp_honeypot': {
        'name': 'SMTP Mail Server Honeypot',
        'description': 'Email server honeypot to catch spam, phishing attempts, and mail-based attacks.',
        'default_port': 25,
        'supported_ports': [25, 587, 465, 2525],
        'features': ['smtp', 'email_logging', 'attachment_analysis', 'relay_testing'],
        'category': 'Email',
        'config_fields': ['server_name', 'smtp_banner', 'relay_allowed', 'max_message_size', 'auth_required']
    },
    'conpot': {
        'name': 'Conpot ICS/SCADA Honeypot',
        'description': 'Industrial Control Systems honeypot for critical infrastructure and SCADA networks.',
        'default_port': 502,
        'supported_ports': [102, 502, 161, 47808],
        'features': ['modbus', 'snmp', 's7comm', 'bacnet', 'industrial_protocols'],
        'category': 'Industrial',
        'config_fields': ['device_vendor', 'plc_model', 'registers', 'ladder_logic', 'alarm_conditions']
    }
}

def load_honeypot_configs():
    """Load honeypot configurations from file"""
    if os.path.exists(HONEYPOT_CONFIGS_FILE):
        with open(HONEYPOT_CONFIGS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_honeypot_configs(configs):
    """Save honeypot configurations to file"""
    with open(HONEYPOT_CONFIGS_FILE, 'w') as f:
        json.dump(configs, f, indent=2)

def load_running_honeypots():
    """Load running honeypots from file"""
    if os.path.exists(RUNNING_HONEYPOTS_FILE):
        with open(RUNNING_HONEYPOTS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_running_honeypots(running):
    """Save running honeypots to file"""
    with open(RUNNING_HONEYPOTS_FILE, 'w') as f:
        json.dump(running, f, indent=2)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def dashboard():
    """Main dashboard page"""
    configs = load_honeypot_configs()
    running = load_running_honeypots()
    
    # Update running status by checking if processes are actually running
    for honeypot_id in list(running.keys()):
        if not is_process_running(running[honeypot_id].get('pid')):
            del running[honeypot_id]
    
    save_running_honeypots(running)
    
    return render_template('dashboard.html', 
                         honeypot_types=HONEYPOT_TYPES,
                         configs=configs,
                         running=running)

@app.route('/configure/<honeypot_type>')
def configure_honeypot(honeypot_type):
    """Configuration page for a specific honeypot type"""
    if honeypot_type not in HONEYPOT_TYPES:
        flash('Invalid honeypot type', 'error')
        return redirect(url_for('dashboard'))
    
    honeypot_info = HONEYPOT_TYPES[honeypot_type]
    configs = load_honeypot_configs()
    
    return render_template('configure.html', 
                         honeypot_type=honeypot_type,
                         honeypot_info=honeypot_info,
                         configs=configs)

@app.route('/save_config', methods=['POST'])
def save_config():
    """Save honeypot configuration"""
    data = request.json
    honeypot_type = data.get('honeypot_type')
    honeypot_id = data.get('honeypot_id', f"{honeypot_type}_{int(time.time())}")
    
    configs = load_honeypot_configs()
    configs[honeypot_id] = {
        'type': honeypot_type,
        'name': data.get('name', f"{honeypot_type} Honeypot"),
        'port': int(data.get('port', HONEYPOT_TYPES[honeypot_type]['default_port'])),
        'username': data.get('username', 'admin'),
        'password': data.get('password', 'password'),
        'anonymous_login': data.get('anonymous_login', False),
        'banner': data.get('banner', ''),
        'template': data.get('template', 'default'),
        'enable_logging': data.get('enable_logging', True),
        'enable_recording': data.get('enable_recording', False),
        'alert_email': data.get('alert_email', ''),
        'alert_webhook': data.get('alert_webhook', ''),
        'log_location': data.get('log_location', 'local'),
        'retention_days': int(data.get('retention_days', 30)),
        'tags': data.get('tags', []),
        'created_at': datetime.datetime.now().isoformat()
    }
    
    save_honeypot_configs(configs)
    return jsonify({'success': True, 'honeypot_id': honeypot_id})

@app.route('/start_honeypot', methods=['POST'])
def start_honeypot():
    """Start a configured honeypot"""
    data = request.json
    honeypot_id = data.get('honeypot_id')
    
    configs = load_honeypot_configs()
    running = load_running_honeypots()
    
    if honeypot_id not in configs:
        return jsonify({'success': False, 'error': 'Configuration not found'})
    
    if honeypot_id in running:
        return jsonify({'success': False, 'error': 'Honeypot is already running'})
    
    config = configs[honeypot_id]
    
    # Start the honeypot process
    try:
        process = start_honeypot_process(honeypot_id, config)
        if process:
            running[honeypot_id] = {
                'pid': process.pid,
                'started_at': datetime.datetime.now().isoformat(),
                'config': config
            }
            save_running_honeypots(running)
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to start honeypot'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/stop_honeypot', methods=['POST'])
def stop_honeypot():
    """Stop a running honeypot"""
    data = request.json
    honeypot_id = data.get('honeypot_id')
    
    running = load_running_honeypots()
    
    if honeypot_id not in running:
        return jsonify({'success': False, 'error': 'Honeypot is not running'})
    
    try:
        pid = running[honeypot_id]['pid']
        if is_process_running(pid):
            stop_process(pid)
        
        del running[honeypot_id]
        save_running_honeypots(running)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/honeypot_logs/<honeypot_id>')
def view_logs(honeypot_id):
    """View logs for a specific honeypot"""
    configs = load_honeypot_configs()
    running = load_running_honeypots()
    
    if honeypot_id not in configs:
        flash('Honeypot not found', 'error')
        return redirect(url_for('dashboard'))
    
    log_file = f"logs/{honeypot_id}_logs.txt"
    logs = []
    
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            logs = f.readlines()[-100:]  # Last 100 lines
    
    return render_template('logs.html', 
                         honeypot_id=honeypot_id,
                         config=configs[honeypot_id],
                         logs=logs,
                         is_running=honeypot_id in running)

@app.route('/download_logs/<honeypot_id>')
def download_logs(honeypot_id):
    """Download logs for a specific honeypot"""
    log_file = f"logs/{honeypot_id}_logs.txt"
    if os.path.exists(log_file):
        return send_file(log_file, as_attachment=True)
    else:
        flash('Log file not found', 'error')
        return redirect(url_for('dashboard'))

@app.route('/upload_file', methods=['POST'])
def upload_file():
    """Upload files for honeypot bait"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file selected'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'})
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return jsonify({'success': True, 'filename': filename})
    
    return jsonify({'success': False, 'error': 'Invalid file type'})

@app.route('/delete_honeypot', methods=['POST'])
def delete_honeypot():
    """Delete a honeypot configuration"""
    data = request.json
    honeypot_id = data.get('honeypot_id')
    
    configs = load_honeypot_configs()
    running = load_running_honeypots()
    
    # Stop if running
    if honeypot_id in running:
        try:
            pid = running[honeypot_id]['pid']
            if is_process_running(pid):
                stop_process(pid)
            del running[honeypot_id]
            save_running_honeypots(running)
        except:
            pass
    
    # Delete configuration
    if honeypot_id in configs:
        del configs[honeypot_id]
        save_honeypot_configs(configs)
    
    # Delete log files
    log_file = f"logs/{honeypot_id}_logs.txt"
    if os.path.exists(log_file):
        os.remove(log_file)
    
    return jsonify({'success': True})

@app.route('/api/status')
def api_status():
    """API endpoint for getting honeypot status"""
    configs = load_honeypot_configs()
    running = load_running_honeypots()
    
    # Update running status by checking if processes are actually running
    for honeypot_id in list(running.keys()):
        if not is_process_running(running[honeypot_id].get('pid')):
            del running[honeypot_id]
    
    save_running_honeypots(running)
    
    return jsonify({
        'total': len(configs),
        'running': len(running),
        'configs': configs,
        'running_details': running
    })

def start_honeypot_process(honeypot_id, config):
    """Start a honeypot process based on its configuration"""
    honeypot_type = config['type']
    
    try:
        # Import appropriate honeypot module
        if honeypot_type == 'ftp_honeypot':
            from honeypot_ftp import create_ftp_honeypot
            honeypot = create_ftp_honeypot(config)
        elif honeypot_type == 'mysql_honeypot':
            from honeypot_mysql import create_mysql_honeypot
            honeypot = create_mysql_honeypot(config)
        elif honeypot_type == 'telnet_switch':
            from honeypot_telnet import create_telnet_honeypot
            honeypot = create_telnet_honeypot(config)
        elif honeypot_type == 'phpmyadmin_honeypot':
            from honeypot_phpmyadmin import create_phpmyadmin_honeypot
            honeypot = create_phpmyadmin_honeypot(config)
        elif honeypot_type == 'cowrie':
            # Use existing cowrie honeypot or create a simple SSH honeypot
            script_content = generate_ssh_honeypot_script(honeypot_id, config)
            return create_script_process(honeypot_id, script_content)
        elif honeypot_type == 'dionaea':
            # Use existing dionaea or create multi-service honeypot
            script_content = generate_multiservice_honeypot_script(honeypot_id, config)
            return create_script_process(honeypot_id, script_content)
        else:
            # Generate basic socket honeypot for other types
            script_content = generate_basic_honeypot_script(honeypot_id, config)
            return create_script_process(honeypot_id, script_content)
        
        # Start the honeypot in a separate thread
        import threading
        honeypot_thread = threading.Thread(target=honeypot.start)
        honeypot_thread.daemon = True
        honeypot_thread.start()
        
        # Create a mock process object for compatibility
        class MockProcess:
            def __init__(self, honeypot_obj):
                self.honeypot = honeypot_obj
                self.pid = os.getpid()  # Use current process PID as placeholder
                
            def terminate(self):
                self.honeypot.stop()
                
        return MockProcess(honeypot)
        
    except Exception as e:
        print(f"Error starting honeypot {honeypot_type}: {e}")
        return None

def create_script_process(honeypot_id, script_content):
    """Create a honeypot process from script content"""
    script_file = f"honeypot_{honeypot_id}.py"
    
    with open(script_file, 'w') as f:
        f.write(script_content)
    
    # Start the process
    try:
        process = subprocess.Popen(['python', script_file], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        return process
    except Exception as e:
        print(f"Error starting honeypot script: {e}")
        return None

def generate_ssh_honeypot_script(honeypot_id, config):
    """Generate SSH honeypot script for Cowrie"""
    port = config.get('port', 2222)
    username = config.get('username', 'admin')
    password = config.get('password', 'password')
    banner = config.get('banner', 'SSH-2.0-OpenSSH_7.4')
    
    return f'''
import socket
import threading
import datetime
import os

LOG_FILE = 'logs/{honeypot_id}.log'
PORT = {port}
USERNAME = "{username}"
PASSWORD = "{password}"
BANNER = "{banner}"

def log_connection(addr, message):
    timestamp = datetime.datetime.now().isoformat()
    ip, port = addr
    log_entry = f"[{{timestamp}}] SSH {{ip}}:{{port}} - {{message}}\\n"
    
    print(log_entry.strip())
    os.makedirs('logs', exist_ok=True)
    with open(LOG_FILE, 'a') as f:
        f.write(log_entry)

def handle_client(conn, addr):
    try:
        # Send SSH banner
        conn.send((BANNER + "\\r\\n").encode())
        log_connection(addr, f"Connection established")
        
        # Simple SSH protocol simulation
        data = conn.recv(1024)
        if data:
            log_connection(addr, f"Received: {{data.decode(errors='ignore')}}")
            
        # Send fake SSH response
        conn.send(b"SSH-2.0-OpenSSH_7.4\\r\\n")
        
    except Exception as e:
        log_connection(addr, f"Error: {{e}}")
    finally:
        conn.close()

def run_honeypot():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(('0.0.0.0', PORT))
        s.listen(5)
        print(f"SSH honeypot listening on port {{PORT}}")
        
        while True:
            try:
                conn, addr = s.accept()
                client_thread = threading.Thread(target=handle_client, args=(conn, addr))
                client_thread.daemon = True
                client_thread.start()
            except Exception as e:
                print(f"Error accepting connection: {{e}}")

if __name__ == "__main__":
    run_honeypot()
'''

def generate_multiservice_honeypot_script(honeypot_id, config):
    """Generate multi-service honeypot script for Dionaea"""
    port = config.get('port', 21)
    
    return f'''
import socket
import threading
import datetime
import os

LOG_FILE = 'logs/{honeypot_id}.log'
PORT = {port}

def log_connection(addr, service, message):
    timestamp = datetime.datetime.now().isoformat()
    ip, port = addr
    log_entry = f"[{{timestamp}}] {{service}} {{ip}}:{{port}} - {{message}}\\n"
    
    print(log_entry.strip())
    os.makedirs('logs', exist_ok=True)
    with open(LOG_FILE, 'a') as f:
        f.write(log_entry)

def handle_ftp_client(conn, addr):
    try:
        conn.send(b"220 Welcome to FTP Server\\r\\n")
        log_connection(addr, "FTP", "Connection established")
        
        while True:
            data = conn.recv(1024)
            if not data:
                break
                
            command = data.decode(errors='ignore').strip()
            log_connection(addr, "FTP", f"Command: {{command}}")
            
            if command.upper().startswith('USER'):
                conn.send(b"331 Password required\\r\\n")
            elif command.upper().startswith('PASS'):
                conn.send(b"230 Login successful\\r\\n")
            elif command.upper().startswith('QUIT'):
                conn.send(b"221 Goodbye\\r\\n")
                break
            else:
                conn.send(b"502 Command not implemented\\r\\n")
                
    except Exception as e:
        log_connection(addr, "FTP", f"Error: {{e}}")
    finally:
        conn.close()

def run_honeypot():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(('0.0.0.0', PORT))
        s.listen(5)
        print(f"Multi-service honeypot listening on port {{PORT}}")
        
        while True:
            try:
                conn, addr = s.accept()
                # Determine service based on port
                if PORT == 21:
                    client_thread = threading.Thread(target=handle_ftp_client, args=(conn, addr))
                else:
                    client_thread = threading.Thread(target=handle_ftp_client, args=(conn, addr))
                client_thread.daemon = True
                client_thread.start()
            except Exception as e:
                print(f"Error accepting connection: {{e}}")

if __name__ == "__main__":
    run_honeypot()
'''

def generate_basic_honeypot_script(honeypot_id, config):
    """Generate basic honeypot script"""
    honeypot_type = config['type']
    port = config.get('port', 8080)
    banner = config.get('banner', f'Welcome to {honeypot_type} server')
    
    return f'''
import socket
import datetime
import os

LOG_FILE = 'logs/{honeypot_id}.log'
PORT = {port}
BANNER = """{banner}"""

def log_connection(addr, data):
    timestamp = datetime.datetime.now().isoformat()
    ip, port = addr
    log_entry = f"[{{timestamp}}] {{addr}} - {{data.decode(errors='ignore')}}\\n"
    
    print(log_entry.strip())
    os.makedirs('logs', exist_ok=True)
    with open(LOG_FILE, 'a') as f:
        f.write(log_entry)

def run_honeypot():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(('0.0.0.0', PORT))
        s.listen(5)
        print(f"{honeypot_type} honeypot listening on port {{PORT}}")
        
        while True:
            try:
                conn, addr = s.accept()
                if BANNER:
                    conn.send((BANNER + "\\r\\n").encode())
                
                data = conn.recv(1024)
                if data:
                    log_connection(addr, data)
                
                conn.close()
            except Exception as e:
                print(f"Error: {{e}}")

if __name__ == "__main__":
    run_honeypot()
'''

def is_process_running(pid):
    """Check if a process with given PID is running"""
    try:
        if pid is None:
            return False
        return psutil.pid_exists(pid)
    except:
        return False

def stop_process(pid):
    """Stop a process with given PID"""
    try:
        if psutil.pid_exists(pid):
            process = psutil.Process(pid)
            process.terminate()
            # Wait for graceful termination
            try:
                process.wait(timeout=5)
            except psutil.TimeoutExpired:
                process.kill()
    except:
        pass

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
