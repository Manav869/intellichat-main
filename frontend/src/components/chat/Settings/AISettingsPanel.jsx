import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentTheme } from '../../../redux/slices/themeSlice';

const AISettingsPanel = ({ settings, onSettingsChange, isOpen, onToggle }) => {
  const theme = useSelector(selectCurrentTheme);
  const [localSettings, setLocalSettings] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
    ...settings
  });

  useEffect(() => {
    setLocalSettings(prev => ({ ...prev, ...settings }));
  }, [settings]);

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: parseFloat(value) };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const resetToDefaults = () => {
    const defaults = {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0
    };
    setLocalSettings(defaults);
    onSettingsChange(defaults);
  };

  const presets = {
    creative: { temperature: 0.9, maxTokens: 2000, topP: 0.95 },
    balanced: { temperature: 0.7, maxTokens: 1000, topP: 1.0 },
    precise: { temperature: 0.3, maxTokens: 500, topP: 0.9 },
    coding: { temperature: 0.2, maxTokens: 2000, topP: 0.95 }
  };

  const applyPreset = (preset) => {
    const newSettings = { ...localSettings, ...presets[preset] };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isOpen
            ? `${theme.colors.gradient.button} text-white shadow-lg`
            : `${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.text.primary}`
        }`}
        title="AI Settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span>AI Settings</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 right-0 w-96 ${theme.colors.bg.secondary} rounded-xl shadow-2xl border ${theme.colors.border.primary} p-4 z-50 animate-fade-in backdrop-blur-xl`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${theme.colors.text.primary}`}>AI Parameters</h3>
            <button
              onClick={resetToDefaults}
              className={`text-xs px-3 py-1 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-colors`}
            >
              Reset Defaults
            </button>
          </div>

          {/* Presets */}
          <div className="mb-4">
            <label className={`block text-sm font-medium ${theme.colors.text.secondary} mb-2`}>
              Quick Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(presets).map((preset) => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={`p-2 rounded-lg text-xs font-medium ${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.gradient.button} hover:text-white transition-all`}
                >
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${theme.colors.text.secondary}`}>
                Temperature
                <span className={`ml-2 text-xs ${theme.colors.text.tertiary}`}>
                  (Creativity)
                </span>
              </label>
              <span className={`text-sm font-mono ${theme.colors.text.primary} bg-gradient-to-r ${theme.colors.gradient.button} text-white px-2 py-1 rounded`}>
                {localSettings.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) => handleChange('temperature', e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${theme.colors.text.tertiary}`}>Precise</span>
              <span className={`text-xs ${theme.colors.text.tertiary}`}>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${theme.colors.text.secondary}`}>
                Max Tokens
                <span className={`ml-2 text-xs ${theme.colors.text.tertiary}`}>
                  (Response Length)
                </span>
              </label>
              <span className={`text-sm font-mono ${theme.colors.text.primary} bg-gradient-to-r ${theme.colors.gradient.button} text-white px-2 py-1 rounded`}>
                {localSettings.maxTokens}
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={localSettings.maxTokens}
              onChange={(e) => handleChange('maxTokens', e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${theme.colors.text.tertiary}`}>Short</span>
              <span className={`text-xs ${theme.colors.text.tertiary}`}>Long</span>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <details className="mb-4">
            <summary className={`cursor-pointer text-sm font-medium ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-colors mb-2`}>
              Advanced Settings
            </summary>

            <div className="space-y-4 pl-2 border-l-2 border-indigo-500/30">
              {/* Top P */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${theme.colors.text.tertiary}`}>
                    Top P
                  </label>
                  <span className={`text-xs font-mono ${theme.colors.text.primary}`}>
                    {localSettings.topP.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.topP}
                  onChange={(e) => handleChange('topP', e.target.value)}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Frequency Penalty */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${theme.colors.text.tertiary}`}>
                    Frequency Penalty
                  </label>
                  <span className={`text-xs font-mono ${theme.colors.text.primary}`}>
                    {localSettings.frequencyPenalty.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={localSettings.frequencyPenalty}
                  onChange={(e) => handleChange('frequencyPenalty', e.target.value)}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Presence Penalty */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${theme.colors.text.tertiary}`}>
                    Presence Penalty
                  </label>
                  <span className={`text-xs font-mono ${theme.colors.text.primary}`}>
                    {localSettings.presencePenalty.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={localSettings.presencePenalty}
                  onChange={(e) => handleChange('presencePenalty', e.target.value)}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </details>

          {/* Info Box */}
          <div className={`p-3 rounded-lg ${theme.colors.bg.tertiary} border ${theme.colors.border.primary}`}>
            <p className={`text-xs ${theme.colors.text.tertiary} leading-relaxed`}>
              <strong className={theme.colors.text.secondary}>Tip:</strong> Higher temperature = more creative but less predictable. Lower temperature = more focused and deterministic.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISettingsPanel;
