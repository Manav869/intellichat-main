import { createSlice } from '@reduxjs/toolkit';

// Theme configurations
export const themes = {
  light: {
    name: 'light',
    colors: {
      // Background colors
      bg: {
        primary: 'bg-white',
        secondary: 'bg-gray-50',
        tertiary: 'bg-gray-100',
        hover: 'hover:bg-gray-100',
        active: 'bg-blue-50'
      },
      // Text colors
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500',
        inverse: 'text-white'
      },
      // Border colors
      border: {
        primary: 'border-gray-200',
        secondary: 'border-gray-300',
        focus: 'border-blue-500'
      },
      // Gradient backgrounds
      gradient: {
        primary: 'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
        header: 'bg-gradient-to-r from-blue-500 to-purple-600',
        button: 'bg-gradient-to-r from-blue-600 to-blue-700'
      },
      // Component specific
      sidebar: 'bg-white border-r border-gray-200',
      header: 'bg-white/90 backdrop-blur-xl border-b border-gray-200',
      input: 'bg-gray-100 text-gray-900 placeholder-gray-500',
      message: {
        user: 'bg-blue-500 text-white',
        assistant: 'bg-gray-100 text-gray-900'
      }
    }
  },
  dark: {
    name: 'dark',
    colors: {
      // Background colors
      bg: {
        primary: 'bg-gray-900',
        secondary: 'bg-gray-800',
        tertiary: 'bg-gray-700',
        hover: 'hover:bg-gray-800',
        active: 'bg-gray-700'
      },
      // Text colors
      text: {
        primary: 'text-white',
        secondary: 'text-gray-300',
        tertiary: 'text-gray-400',
        inverse: 'text-gray-900'
      },
      // Border colors
      border: {
        primary: 'border-gray-800',
        secondary: 'border-gray-700',
        focus: 'border-indigo-500'
      },
      // Gradient backgrounds
      gradient: {
        primary: 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950',
        header: 'bg-gradient-to-r from-indigo-600 to-purple-600',
        button: 'bg-gradient-to-r from-indigo-600 to-indigo-700'
      },
      // Component specific
      sidebar: 'bg-gray-900 border-r border-gray-800',
      header: 'bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50',
      input: 'bg-gray-700 text-white placeholder-gray-400',
      message: {
        user: 'bg-indigo-600 text-white',
        assistant: 'bg-gray-800 text-white'
      }
    }
  },
  grey: {
    name: 'grey',
    colors: {
      // Background colors - keeping everything grey
      bg: {
        primary: 'bg-gray-500',
        secondary: 'bg-gray-600',
        tertiary: 'bg-gray-700',
        hover: 'hover:bg-gray-600',
        active: 'bg-gray-600'
      },
      // Text colors - light for contrast
      text: {
        primary: 'text-white',
        secondary: 'text-gray-200',
        tertiary: 'text-gray-300',
        inverse: 'text-gray-900'
      },
      // Border colors - grey tones
      border: {
        primary: 'border-gray-600',
        secondary: 'border-gray-700',
        focus: 'border-gray-400'
      },
      // Gradient backgrounds - grey gradients
      gradient: {
        primary: 'bg-gradient-to-br from-gray-600 via-gray-500 to-gray-600',
        header: 'bg-gradient-to-r from-gray-700 to-gray-800',
        button: 'bg-gradient-to-r from-gray-700 to-gray-800'
      },
      // Component specific - all grey
      sidebar: 'bg-gray-600 border-r border-gray-700',
      header: 'bg-gray-700 backdrop-blur-xl border-b border-gray-800',
      input: 'bg-gray-700 text-white placeholder-gray-300',
      message: {
        user: 'bg-gray-800 text-white',
        assistant: 'bg-gray-700 text-white'
      }
    }
  }
};

// Get initial theme from localStorage or default to 'dark'
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('app-theme');
  return savedTheme && themes[savedTheme] ? savedTheme : 'dark';
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    currentTheme: getInitialTheme(),
    availableThemes: ['light', 'dark', 'grey']
  },
  reducers: {
    setTheme: (state, action) => {
      const themeName = action.payload;
      if (themes[themeName]) {
        state.currentTheme = themeName;
        localStorage.setItem('app-theme', themeName);
      }
    },
    toggleTheme: (state) => {
      const currentIndex = state.availableThemes.indexOf(state.currentTheme);
      const nextIndex = (currentIndex + 1) % state.availableThemes.length;
      state.currentTheme = state.availableThemes[nextIndex];
      localStorage.setItem('app-theme', state.currentTheme);
    }
  }
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;

// Selector to get current theme object
export const selectCurrentTheme = (state) => themes[state.theme.currentTheme];
export const selectThemeName = (state) => state.theme.currentTheme;
