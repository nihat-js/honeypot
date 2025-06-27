// Dashboard JavaScript Functions

// Utility function to show loading state on buttons
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Enhanced notification system
function showNotification(message, type = 'info', duration = 5000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after duration
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, duration);
}

// API call wrapper with error handling
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Enhanced start honeypot function
async function startHoneypot(honeypotId, buttonElement = null) {
    if (!confirm('Start this honeypot?')) {
        return;
    }
    
    if (buttonElement) {
        setButtonLoading(buttonElement, true);
    }
    
    try {
        const data = await apiCall('/start_honeypot', {
            method: 'POST',
            body: JSON.stringify({honeypot_id: honeypotId})
        });
        
        if (data.success) {
            showNotification('Honeypot started successfully!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
    } catch (error) {
        showNotification(`Error starting honeypot: ${error.message}`, 'danger');
    } finally {
        if (buttonElement) {
            setButtonLoading(buttonElement, false);
        }
    }
}

// Enhanced stop honeypot function
async function stopHoneypot(honeypotId, buttonElement = null) {
    if (!confirm('Stop this honeypot?')) {
        return;
    }
    
    if (buttonElement) {
        setButtonLoading(buttonElement, true);
    }
    
    try {
        const data = await apiCall('/stop_honeypot', {
            method: 'POST',
            body: JSON.stringify({honeypot_id: honeypotId})
        });
        
        if (data.success) {
            showNotification('Honeypot stopped successfully!', 'warning');
            setTimeout(() => location.reload(), 1000);
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
    } catch (error) {
        showNotification(`Error stopping honeypot: ${error.message}`, 'danger');
    } finally {
        if (buttonElement) {
            setButtonLoading(buttonElement, false);
        }
    }
}

// Enhanced delete honeypot function
async function deleteHoneypot(honeypotId, honeypotName, buttonElement = null) {
    if (!confirm(`Are you sure you want to delete "${honeypotName}"?\nThis will also delete all logs and cannot be undone.`)) {
        return;
    }
    
    if (buttonElement) {
        setButtonLoading(buttonElement, true);
    }
    
    try {
        const data = await apiCall('/delete_honeypot', {
            method: 'POST',
            body: JSON.stringify({honeypot_id: honeypotId})
        });
        
        if (data.success) {
            showNotification('Honeypot deleted successfully!', 'info');
            setTimeout(() => location.reload(), 1000);
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
    } catch (error) {
        showNotification(`Error deleting honeypot: ${error.message}`, 'danger');
    } finally {
        if (buttonElement) {
            setButtonLoading(buttonElement, false);
        }
    }
}

// Status polling for live updates
let statusPollInterval = null;

function startStatusPolling(interval = 30000) {
    if (statusPollInterval) {
        clearInterval(statusPollInterval);
    }
    
    statusPollInterval = setInterval(async () => {
        try {
            // Update status indicators without full page reload
            await updateHoneypotStatuses();
        } catch (error) {
            console.error('Status polling error:', error);
        }
    }, interval);
}

function stopStatusPolling() {
    if (statusPollInterval) {
        clearInterval(statusPollInterval);
        statusPollInterval = null;
    }
}

// Update honeypot statuses dynamically
async function updateHoneypotStatuses() {
    try {
        const response = await fetch('/api/status');
        if (response.ok) {
            const data = await response.json();
            
            // Update status badges and buttons
            Object.entries(data.running || {}).forEach(([honeypotId, status]) => {
                const row = document.getElementById(`honeypot-${honeypotId}`);
                if (row) {
                    const statusCell = row.querySelector('.status-badge');
                    const actionButtons = row.querySelector('.action-buttons');
                    
                    if (statusCell && actionButtons) {
                        updateStatusDisplay(honeypotId, status.is_running, statusCell, actionButtons);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Failed to update statuses:', error);
    }
}

function updateStatusDisplay(honeypotId, isRunning, statusCell, actionButtons) {
    // Update status badge
    statusCell.innerHTML = isRunning 
        ? '<span class="badge bg-success"><i class="bi bi-play-fill"></i> Running</span>'
        : '<span class="badge bg-secondary"><i class="bi bi-stop-fill"></i> Stopped</span>';
    
    // Update action buttons
    const startBtn = actionButtons.querySelector('.btn-success');
    const stopBtn = actionButtons.querySelector('.btn-warning');
    
    if (isRunning) {
        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'inline-block';
    } else {
        if (startBtn) startBtn.style.display = 'inline-block';
        if (stopBtn) stopBtn.style.display = 'none';
    }
}

// Port validation
function validatePort(port) {
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return false;
    }
    
    // Check for privileged ports warning
    if (portNum < 1024) {
        return confirm('You are using a privileged port (< 1024). This may require administrator privileges. Continue?');
    }
    
    return true;
}

// Form validation helpers
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// File upload progress
function handleFileUpload(files, progressCallback) {
    const promises = Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            
            const xhr = new XMLHttpRequest();
            
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && progressCallback) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressCallback(file.name, percentComplete);
                }
            };
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = () => reject(new Error('Upload failed'));
            
            xhr.open('POST', '/upload_file');
            xhr.send(formData);
        });
    });
    
    return Promise.all(promises);
}

// Log viewer utilities
function scrollLogToBottom(logElement) {
    if (logElement) {
        logElement.scrollTop = logElement.scrollHeight;
    }
}

function highlightLogText(logElement, searchTerm) {
    if (!logElement || !searchTerm) return;
    
    const originalText = logElement.textContent;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlightedText = originalText.replace(regex, '<mark>$1</mark>');
    logElement.innerHTML = highlightedText;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+R to refresh
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        location.reload();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Start status polling on dashboard
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
        startStatusPolling();
    }
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }
        }, 5000);
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopStatusPolling();
});

// Export functions for global use
window.honeypotDashboard = {
    startHoneypot,
    stopHoneypot,
    deleteHoneypot,
    showNotification,
    validatePort,
    validateEmail,
    validateUrl,
    handleFileUpload,
    scrollLogToBottom,
    highlightLogText
};
