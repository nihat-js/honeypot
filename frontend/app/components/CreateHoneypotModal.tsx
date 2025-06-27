import React, { useState } from 'react';
import styled from 'styled-components';

interface CreateHoneypotModalProps {
  honeypotTypes: Record<string, any>;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateHoneypotModal({ honeypotTypes, onClose, onSuccess }: CreateHoneypotModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    port: '',
    tags: '',
    config: {} as any
  });
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);

  const handleTypeChange = (type: string) => {
    const typeData = honeypotTypes[type];
    setFormData(prev => ({
      ...prev,
      type,
      port: typeData?.default_port?.toString() || '',
      config: {}
    }));
    setSelectedType(typeData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/create_honeypot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          port: parseInt(formData.port),
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create honeypot');
      }
    } catch (error) {
      console.error('Failed to create honeypot:', error);
      alert('Failed to create honeypot');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(
    Object.values(honeypotTypes).map((type: any) => type.category)
  ));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Create New Honeypot</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Honeypot Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Production SSH Honeypot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="65535"
                value={formData.port}
                onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2222"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., production, ssh, critical"
              />
            </div>
          </div>

          {/* Honeypot Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Honeypot Type</h3>
            
            {categories.map(category => (
              <div key={category} className="space-y-2">
                <h4 className="text-md font-medium text-gray-700">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(honeypotTypes)
                    .filter(([_, type]: any) => type.category === category)
                    .map(([key, type]: any) => (
                      <label key={key} className="relative">
                        <input
                          type="radio"
                          name="honeypotType"
                          value={key}
                          checked={formData.type === key}
                          onChange={(e) => handleTypeChange(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.type === key 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <div className="font-medium text-sm">{type.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Default port: {type.default_port}
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Type-specific Configuration */}
          {selectedType && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="font-medium text-blue-900">{selectedType.name}</div>
                <div className="text-sm text-blue-700 mt-1">{selectedType.description}</div>
                <div className="text-sm text-blue-600 mt-2">
                  <strong>Features:</strong> {selectedType.features?.join(', ')}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  <strong>Supported Ports:</strong> {selectedType.supported_ports?.join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.type || !formData.port}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Honeypot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
