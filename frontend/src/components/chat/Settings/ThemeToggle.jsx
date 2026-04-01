import { useDispatch, useSelector } from 'react-redux';
import { setTheme, selectThemeName } from '../../../redux/slices/themeSlice';

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector(selectThemeName);

  const themes = [
    { 
      name: 'light', 
      label: 'Light',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ),
      color: 'from-yellow-400 to-orange-400'
    },
    { 
      name: 'dark', 
      label: 'Dark',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ),
      color: 'from-indigo-600 to-purple-600'
    },
    { 
      name: 'grey', 
      label: 'Grey',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
        </svg>
      ),
      color: 'from-gray-600 to-gray-700'
    }
  ];

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
      {themes.map((theme) => (
        <button
          key={theme.name}
          onClick={() => dispatch(setTheme(theme.name))}
          className={`
            relative px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2
            ${currentTheme === theme.name 
              ? `bg-gradient-to-r ${theme.color} text-white shadow-lg scale-105 ring-2 ring-white/30` 
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }
          `}
          title={`Switch to ${theme.label} theme`}
        >
          {theme.icon}
          <span className="text-sm">{theme.label}</span>
          
          {currentTheme === theme.name && (
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
