import React, { useState } from 'react';

interface ConfigurationModalProps {
  honeypot: {
    id: string;
    name: string;
    type: string;
    config: any;
  };
  honeypotType?: {
    name: string;
    config_fields: string[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfigurationModal({ honeypot, honeypotType, onClose, onSuccess }: ConfigurationModalProps) {
  const [config, setConfig] = useState(honeypot.config || {});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/configure_honeypot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          honeypot_id: honeypot.id,
          config
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Failed to update configuration:', error);
      alert('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const renderConfigField = (field: string) => {
    const value = config[field] || '';
    
    switch (field) {
      case 'username':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setConfig(prev => ({ ...prev, [field]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="admin"
          />
        );
      
      case 'password':
        return (
          <input
            type="password"
            value={value}
            onChange={(e) => setConfig(prev => ({ ...prev, [field]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="password123"
          />
        );
      
      case 'banner':
      case 'ftp_banner':
      case 'smtp_banner':
      case 'rdp_banner':
        return (
          <textarea
            value={value}
            onChange={(e) => setConfig(prev => ({ ...prev, [field]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Welcome to the system"
          />
        );
      
      case 'anonymous_login':
      case 'ssl_enabled':
      case 'auth_required':
      case 'relay_allowed':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => setConfig(prev => ({ ...prev, [field]: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2">Enable</span>
          </label>
        );
      
      case 'max_connections':
      case 'session_timeout':
      case 'max_message_size':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setConfig(prev => ({ ...prev, [field]: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        );
      
      case 'database_names':
      case 'fake_files':
      case 'fake_users':
      case 'user_accounts':
        return (
          <textarea
            value={Array.isArray(value) ? value.join('\n') : value}
            onChange={(e) => setConfig(prev => ({ 
              ...prev, 
              [field]: e.target.value.split('\n').filter(Boolean) 
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="One item per line"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setConfig(prev => ({ ...prev, [field]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        );
    }
  };

  const getFieldDescription = (field: string) => {
    const descriptions: Record<string, string> = {
      username: 'Default username for login attempts',
      password: 'Default password for login attempts',
      banner: 'Welcome banner displayed to connecting users',
      ftp_banner: 'FTP server welcome message',
      smtp_banner: 'SMTP server identification banner',
      rdp_banner: 'RDP connection banner',
      anonymous_login: 'Allow anonymous FTP access',
      ssl_enabled: 'Enable SSL/TLS encryption',
      auth_required: 'Require authentication',
      relay_allowed: 'Allow email relay (SMTP)',
      max_connections: 'Maximum concurrent connections',
      session_timeout: 'Session timeout in seconds',
      max_message_size: 'Maximum message size in bytes',
      database_names: 'List of fake database names (one per line)',
      fake_files: 'List of fake files to display (one per line)',
      fake_users: 'List of fake user accounts (one per line)',
      user_accounts: 'List of user accounts (one per line)'
    };
    return descriptions[field] || 'Configuration option';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Configure Honeypot</h2>
              <p className="text-sm text-gray-500">{honeypot.name} ({honeypotType?.name || honeypot.type})</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {honeypotType?.config_fields?.map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                {renderConfigField(field)}
                <p className="text-xs text-gray-500 mt-1">{getFieldDescription(field)}</p>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                No configuration options available for this honeypot type.
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
