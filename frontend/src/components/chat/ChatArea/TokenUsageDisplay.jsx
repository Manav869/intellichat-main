import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentTheme } from '../../../redux/slices/themeSlice';

const TokenUsageDisplay = ({ messages }) => {
  const theme = useSelector(selectCurrentTheme);
  const [stats, setStats] = useState({
    totalTokens: 0,
    userTokens: 0,
    assistantTokens: 0,
    messageCount: 0,
    estimatedCost: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Calculate token statistics
    // Note: This is an estimation. Real token counts should come from backend
    const calculateTokens = () => {
      let userTokens = 0;
      let assistantTokens = 0;

      messages.forEach(msg => {
        // Rough estimation: ~4 characters per token
        const estimatedTokens = Math.ceil(msg.content.length / 4);

        if (msg.role === 'user') {
          userTokens += estimatedTokens;
        } else if (msg.role === 'assistant') {
          assistantTokens += estimatedTokens;
        }
      });

      const totalTokens = userTokens + assistantTokens;

      // Rough cost estimation (example pricing)
      // Groq: ~$0.27 per 1M tokens
      // Gemini: ~$0.075 per 1M tokens (input), ~$0.30 per 1M tokens (output)
      const estimatedCost = (totalTokens / 1000000) * 0.27; // Using Groq pricing as baseline

      setStats({
        totalTokens,
        userTokens,
        assistantTokens,
        messageCount: messages.length,
        estimatedCost
      });
    };

    calculateTokens();
  }, [messages]);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCost = (cost) => {
    if (cost < 0.01) {
      return '<$0.01';
    }
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className={`${theme.colors.bg.secondary} rounded-xl border ${theme.colors.border.primary} overflow-hidden shadow-lg`}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-4 flex items-center justify-between hover:${theme.colors.bg.tertiary} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-left">
            <div className={`text-sm font-medium ${theme.colors.text.primary}`}>
              Token Usage
            </div>
            <div className={`text-xs ${theme.colors.text.tertiary}`}>
              {formatNumber(stats.totalTokens)} tokens used
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-600/20 text-purple-300 text-xs font-medium`}>
            {formatCost(stats.estimatedCost)}
          </div>
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
        <div className={`p-4 border-t ${theme.colors.border.primary} space-y-4 animate-fade-in`}>
          {/* Token Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${theme.colors.bg.tertiary} border ${theme.colors.border.primary}`}>
              <div className={`text-xs ${theme.colors.text.tertiary} mb-1`}>User Messages</div>
              <div className={`text-2xl font-bold ${theme.colors.text.primary}`}>
                {formatNumber(stats.userTokens)}
              </div>
              <div className={`text-xs ${theme.colors.text.secondary} mt-1`}>
                tokens sent
              </div>
            </div>

            <div className={`p-3 rounded-lg ${theme.colors.bg.tertiary} border ${theme.colors.border.primary}`}>
              <div className={`text-xs ${theme.colors.text.tertiary} mb-1`}>AI Responses</div>
              <div className={`text-2xl font-bold ${theme.colors.text.primary}`}>
                {formatNumber(stats.assistantTokens)}
              </div>
              <div className={`text-xs ${theme.colors.text.secondary} mt-1`}>
                tokens received
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs ${theme.colors.text.secondary}`}>Token Distribution</span>
              <span className={`text-xs ${theme.colors.text.tertiary}`}>
                {stats.messageCount} messages
              </span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${(stats.userTokens / stats.totalTokens) * 100 || 0}%` }}
                title={`User: ${stats.userTokens} tokens`}
              />
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${(stats.assistantTokens / stats.totalTokens) * 100 || 0}%` }}
                title={`AI: ${stats.assistantTokens} tokens`}
              />
            </div>
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <span className={`text-xs ${theme.colors.text.tertiary}`}>You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <span className={`text-xs ${theme.colors.text.tertiary}`}>AI</span>
              </div>
            </div>
          </div>

          {/* Cost Estimate Info */}
          <div className={`p-3 rounded-lg ${theme.colors.bg.tertiary} border ${theme.colors.border.primary}`}>
            <div className="flex items-start gap-2">
              <svg className={`w-4 h-4 ${theme.colors.text.tertiary} mt-0.5 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className={`text-xs ${theme.colors.text.tertiary} leading-relaxed`}>
                  Cost estimates are approximate and based on current provider pricing.
                  Actual token counts may vary. This is calculated as ~4 characters per token.
                </p>
              </div>
            </div>
          </div>

          {/* Average tokens per message */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded-lg ${theme.colors.bg.tertiary} text-center`}>
              <div className={`text-lg font-bold ${theme.colors.text.primary}`}>
                {stats.messageCount > 0 ? Math.round(stats.totalTokens / stats.messageCount) : 0}
              </div>
              <div className={`text-xs ${theme.colors.text.tertiary}`}>Avg/msg</div>
            </div>
            <div className={`p-2 rounded-lg ${theme.colors.bg.tertiary} text-center`}>
              <div className={`text-lg font-bold ${theme.colors.text.primary}`}>
                {formatNumber(stats.totalTokens)}
              </div>
              <div className={`text-xs ${theme.colors.text.tertiary}`}>Total</div>
            </div>
            <div className={`p-2 rounded-lg ${theme.colors.bg.tertiary} text-center`}>
              <div className={`text-lg font-bold text-green-400`}>
                {formatCost(stats.estimatedCost)}
              </div>
              <div className={`text-xs ${theme.colors.text.tertiary}`}>Est. Cost</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenUsageDisplay;
