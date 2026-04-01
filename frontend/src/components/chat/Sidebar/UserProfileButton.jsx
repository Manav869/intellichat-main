import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../../redux/slices/authSlice';

const UserProfileButton = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Get first letter of name for avatar
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    dispatch(logoutUser());
    setShowLogoutConfirm(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  // Default avatar SVG that matches the theme
  const DefaultAvatar = () => (
    <svg 
      className="w-8 h-8 text-gray-300" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
        fill="currentColor"
      />
      <path
        d="M12 12C17.5228 12 22 16.4772 22 22H2C2 16.4772 6.47715 12 12 12Z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );

  return (
    <div className="relative border-t border-gray-700 p-4 bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-medium shadow-lg">
              {user?.name ? getInitials(user.name) : <DefaultAvatar />}
            </div>
          )}
          
          {/* User Info */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white truncate max-w-[120px]">
              {user?.name || 'Loading...'}
            </span>
            <span className="text-xs text-gray-400 truncate max-w-[120px]">
              {user?.email || 'Loading...'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors duration-200 group"
          title="Logout"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors duration-200" 
            fill="none"
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="absolute bottom-full left-0 mb-2 w-full p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
            <p className="text-sm text-white mb-4">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleLogoutCancel}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileButton;