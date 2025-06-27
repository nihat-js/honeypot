# 🍯 Honeypot Management Dashboard

A comprehensive web-based dashboard for managing multiple honeypots with an intuitive interface. Companies can easily deploy, configure, and monitor various types of honeypots to detect and analyze security threats.

![Dashboard](https://img.shields.io/badge/Status-Active-green) ![Python](https://img.shields.io/badge/Python-3.7+-blue) ![Flask](https://img.shields.io/badge/Flask-2.3+-orange)

## ✨ Features

### 🎯 Supported Honeypot Types
- **Cowrie**: SSH/Telnet honeypot for capturing brute force attacks and shell interactions
- **Dionaea**: Multi-protocol honeypot for malware capture (FTP, HTTP, SMB)
- **Glastopf**: Web application honeypot for detecting web-based attacks
- **Conpot**: Industrial Control Systems (ICS/SCADA) honeypot
- **Honeyd**: Virtual honeypot with multiple OS simulation
- **Custom**: Basic configurable honeypot for specific needs

### 🛠️ Configuration Options
- **Port Selection**: Choose from standard or custom ports
- **Authentication**: Set fake usernames and passwords
- **Anonymous Access**: Configure anonymous login for FTP honeypots
- **File Upload**: Upload bait files (PDFs, documents, CTF challenges)
- **Environment Templates**: Banking, IoT, Medical, Industrial systems
- **Custom Banners**: Set fake service banners
- **Logging Options**: Enable/disable session recording and command logging
- **Alert Integration**: Email, Slack, Discord, webhook notifications
- **Storage Options**: Local or cloud storage for logs

### 📊 Dashboard Features
- **Real-time Status**: Live monitoring of honeypot status
- **Activity Logs**: View and download interaction logs
- **Statistics**: Connection counts, unique IPs, activity timeline
- **Bulk Management**: Start/stop multiple honeypots
- **Log Analysis**: Top attacker IPs and recent activity
- **Search & Filter**: Find specific honeypots by type, status, or tags

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- Windows, Linux, or macOS
- Administrator privileges (for privileged ports < 1024)

### Installation

1. **Clone or Download** the project:
   ```bash
   git clone <repository-url>
   cd honeypot-dashboard
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Application**:
   ```bash
   python run.py
   ```

4. **Access Dashboard**:
   Open your browser and navigate to: `http://localhost:5000`

## 📖 Usage Guide

### 1. Creating a Honeypot

1. **Select Type**: Choose from available honeypot types on the dashboard
2. **Configure Settings**:
   - Set a name and port
   - Configure authentication (if applicable)
   - Set custom banners
   - Choose environment template
   - Upload bait files
   - Configure logging and alerts
3. **Save Configuration**: Click "Save Configuration"
4. **Start Honeypot**: Click the "Start" button in the dashboard

### 2. Managing Honeypots

- **Start/Stop**: Use action buttons in the honeypot list
- **View Logs**: Click "Logs" to see real-time activity
- **Edit Configuration**: Use "Edit" to modify settings
- **Delete**: Remove honeypot and all associated data

### 3. Monitoring Activity

- **Dashboard Overview**: See total, active, and inactive honeypots
- **Real-time Logs**: View live connection attempts and interactions
- **Download Logs**: Export activity logs for analysis
- **Statistics**: Monitor top attackers and recent activity

### 4. Alert Configuration

Configure alerts to be notified of honeypot activity:
- **Email**: Set email address for notifications
- **Webhooks**: Integrate with Slack, Discord, or custom endpoints
- **Retention**: Set log retention period

## 🔧 Configuration Examples

### SSH Honeypot (Cowrie)
```
Type: Cowrie
Port: 2222
Username: admin
Password: password123
Banner: Welcome to Ubuntu 18.04.3 LTS
Template: Default Environment
Logging: Enabled
Session Recording: Enabled
```

### FTP Honeypot (Dionaea)
```
Type: Dionaea
Port: 21
Anonymous Login: Enabled
Banner: 220 FTP server ready
Template: Default Environment
Logging: Enabled
```

### Web Honeypot (Glastopf)
```
Type: Glastopf
Port: 80
Template: Banking System
Bait Files: login.php, admin.pdf
Logging: Enabled
```

## 📁 File Structure

```
honeypot-dashboard/
├── app.py                 # Main Flask application
├── run.py                 # Application entry point
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/            # HTML templates
│   ├── dashboard.html    # Main dashboard
│   ├── configure.html    # Configuration page
│   └── logs.html        # Log viewer
├── static/              # Static assets
│   ├── css/
│   │   └── dashboard.css # Styles
│   └── js/
│       └── dashboard.js  # JavaScript functions
├── logs/                # Honeypot logs (auto-created)
├── uploads/             # Uploaded bait files (auto-created)
├── honeypot_configs.json # Saved configurations
└── running_honeypots.json # Running honeypot status
```

## 🛡️ Security Considerations

### Important Notes
- **Firewall**: Ensure proper firewall rules are in place
- **Isolation**: Consider running honeypots in isolated network segments
- **Monitoring**: Regularly monitor honeypot activity
- **Updates**: Keep the dashboard and dependencies updated
- **Backups**: Backup configuration and log data regularly

### Recommended Practices
1. Use non-standard ports when possible
2. Implement proper network segmentation
3. Monitor resource usage
4. Set up log rotation
5. Configure appropriate alert thresholds

## 🔍 Troubleshooting

### Common Issues

**Port Already in Use**
```
Error: [Errno 98] Address already in use
Solution: Choose a different port or stop the conflicting service
```

**Permission Denied (Privileged Ports)**
```
Error: [Errno 13] Permission denied
Solution: Run with administrator privileges or use ports > 1024
```

**Honeypot Won't Start**
```
Check: Port availability, permissions, firewall settings
View: Honeypot logs for specific error messages
```

### Log Locations
- Application logs: Console output
- Honeypot logs: `logs/` directory
- Configuration: `honeypot_configs.json`
- Running status: `running_honeypots.json`

## 📊 Monitoring & Analytics

### Built-in Analytics
- Connection statistics
- IP address tracking
- Command analysis (for interactive honeypots)
- Timeline visualization
- Export capabilities

### Integration Options
- **SIEM Integration**: Export logs to security tools
- **API Access**: Programmatic access to honeypot data
- **Custom Dashboards**: Build additional monitoring tools

## 🤝 Contributing

Contributions are welcome! Please consider:
- Adding new honeypot types
- Improving the user interface
- Enhancing security features
- Adding integration options
- Documentation improvements

## 📄 License

This project is provided as-is for educational and security research purposes. Please ensure compliance with local laws and regulations when deploying honeypots.

## 🆘 Support

For issues, questions, or feature requests:
1. Check the troubleshooting section
2. Review the configuration examples
3. Consult the Flask and honeypot documentation
4. Consider network and system requirements

---

**⚠️ Disclaimer**: This tool is intended for authorized security testing and research only. Ensure you have proper authorization before deploying honeypots in any environment.
