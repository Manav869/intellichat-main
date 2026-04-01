import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentTheme } from '../../../redux/slices/themeSlice';

// These models must match exactly with backend/src/services/aiService.js
// Updated based on actual API availability as of October 2025
const AI_PROVIDERS = {
  groq: {
    name: 'Groq',
    models: [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32K' }
    ]
  },
  gemini: {
    name: 'Gemini',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Latest)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-flash-latest', name: 'Gemini Flash (Auto-Latest)' }
    ]
  }
};

const AIModelSelector = ({ selectedProvider, selectedModel, onUpdate }) => {
  const theme = useSelector(selectCurrentTheme);
  const [provider, setProvider] = useState(selectedProvider || 'groq');
  const [model, setModel] = useState(selectedModel || 'llama-3.1-8b-instant');

  // Update model when provider changes
  useEffect(() => {
    if (provider !== selectedProvider) {
      // Set first model of the new provider
      const firstModel = AI_PROVIDERS[provider].models[0].id;
      setModel(firstModel);
      onUpdate(provider, firstModel);
    }
  }, [provider]);

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
  };

  const handleModelChange = (newModel) => {
    setModel(newModel);
    onUpdate(provider, newModel);
  };

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div>
        <label className={`block text-sm font-medium ${theme.colors.text.secondary} mb-2`}>
          AI Provider
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(AI_PROVIDERS).map(([key, data]) => (
            <button
              key={key}
              onClick={() => handleProviderChange(key)}
              className={`p-3 rounded-lg font-medium transition-all ${
                provider === key
                  ? `bg-gradient-to-r ${theme.colors.gradient.button} text-white shadow-lg scale-105`
                  : `${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.text.primary}`
              }`}
            >
              {data.name}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className={`block text-sm font-medium ${theme.colors.text.secondary} mb-2`}>
          Model
        </label>
        <div className="relative">
          <select
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
            className={`w-full p-3 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.primary} border ${theme.colors.border.primary} focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none`}
          >
            {AI_PROVIDERS[provider].models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
            <svg className={`w-5 h-5 ${theme.colors.text.secondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className={`p-3 rounded-lg ${theme.colors.bg.tertiary} border ${theme.colors.border.primary}`}>
        <p className={`text-xs ${theme.colors.text.tertiary}`}>
          <strong className={theme.colors.text.secondary}>Note:</strong> Your selected model will be used for all new conversations.
        </p>
      </div>
    </div>
  );
};

export default AIModelSelector;
