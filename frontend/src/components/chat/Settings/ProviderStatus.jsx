import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentTheme } from '../../../redux/slices/themeSlice';

const ProviderStatus = ({ selectedProvider }) => {
  const theme = useSelector(selectCurrentTheme);
  const [providers, setProviders] = useState({
    groq: { status: 'checking', latency: null, lastCheck: null },
    gemini: { status: 'checking', latency: null, lastCheck: null }
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    checkProviderHealth();
    const interval = setInterval(checkProviderHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkProviderHealth = async () => {
    const providerList = ['groq', 'gemini'];

    for (const provider of providerList) {
      const startTime = Date.now();

      try {
        const response = await fetch('/api/ai/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ provider })
        });

        const latency = Date.now() - startTime;

        setProviders(prev => ({
          ...prev,
          [provider]: {
            status: response.ok ? 'online' : 'offline',
            latency: response.ok ? latency : null,
            lastCheck: new Date()
          }
        }));
      } catch (error) {
        setProviders(prev => ({
          ...prev,
          [provider]: {
            status: 'offline',
            latency: null,
            lastCheck: new Date()
          }
        }));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-400 bg-green-500/20';
      case 'offline':
        return 'text-red-400 bg-red-500/20';
      case 'checking':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'offline':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'checking':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatLatency = (latency) => {
    if (!latency) return 'N/A';
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(2)}s`;
  };

  const formatLastCheck = (lastCheck) => {
    if (!lastCheck) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastCheck) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const currentProviderStatus = providers[selectedProvider] || { status: 'checking' };

  return (
    <div className={`${theme.colors.bg.secondary} rounded-xl border ${theme.colors.border.primary} overflow-hidden shadow-lg`}>
      {/* Compact Status Display */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-4 flex items-center justify-between hover:${theme.colors.bg.tertiary} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getStatusColor(currentProviderStatus.status)}`}>
            {getStatusIcon(currentProviderStatus.status)}
          </div>
          <div className="text-left">
            <div className={`text-sm font-medium ${theme.colors.text.primary}`}>
              {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} Status
            </div>
            <div className={`text-xs ${theme.colors.text.tertiary}`}>
              {currentProviderStatus.status === 'online'
                ? `Latency: ${formatLatency(currentProviderStatus.latency)}`
                : currentProviderStatus.status}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              checkProviderHealth();
            }}
            className={`p-2 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-all hover:scale-110`}
            title="Refresh status"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <svg
            className={`w-5 h-5 ${theme.colors.text.secondary} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={`p-4 border-t ${theme.colors.border.primary} space-y-3 animate-fade-in`}>
          {Object.entries(providers).map(([provider, data]) => (
            <div
              key={provider}
              className={`p-3 rounded-lg ${theme.colors.bg.tertiary} border ${theme.colors.border.primary} ${
                provider === selectedProvider ? 'ring-2 ring-indigo-500/50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${getStatusColor(data.status)}`}>
                    {getStatusIcon(data.status)}
                  </div>
                  <span className={`font-medium ${theme.colors.text.primary}`}>
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </span>
                  {provider === selectedProvider && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs">
                      Active
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  data.status === 'online' ? 'text-green-400' :
                  data.status === 'offline' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {data.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <div className={`text-xs ${theme.colors.text.tertiary}`}>Latency</div>
                  <div className={`text-sm font-mono ${theme.colors.text.primary}`}>
                    {formatLatency(data.latency)}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${theme.colors.text.tertiary}`}>Last Check</div>
                  <div className={`text-sm font-mono ${theme.colors.text.primary}`}>
                    {formatLastCheck(data.lastCheck)}
                  </div>
                </div>
              </div>

              {/* Performance indicator */}
              {data.latency && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        data.latency < 500 ? 'bg-green-500' :
                        data.latency < 1500 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((data.latency / 3000) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className={`text-xs ${theme.colors.text.tertiary}`}>
                      {data.latency < 500 ? 'Excellent' :
                       data.latency < 1500 ? 'Good' : 'Slow'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Info */}
          <div className={`p-3 rounded-lg ${theme.colors.bg.tertiary} border ${theme.colors.border.primary}`}>
            <div className="flex items-start gap-2">
              <svg className={`w-4 h-4 ${theme.colors.text.tertiary} mt-0.5 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className={`text-xs ${theme.colors.text.tertiary} leading-relaxed`}>
                Status checks run automatically every minute. Green = operational, Yellow = checking, Red = unavailable.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderStatus;
