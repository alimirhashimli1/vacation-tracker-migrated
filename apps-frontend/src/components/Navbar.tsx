import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { logout, selectCurrentUser } from '../store/authSlice';
import { Role } from '../types/role';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useSelector(selectCurrentUser);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const isManager = currentUser?.role === Role.Admin || currentUser?.role === Role.SuperAdmin;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-700 transition-colors">
                  <LayoutDashboard className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                  AbsenceManager
                </span>
              </Link>
            </div>
            
            <div className="hidden lg:ml-8 lg:flex lg:space-x-4 items-center">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/dashboard')
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
              {isManager && (
                <Link
                  to="/users"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive('/users')
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Team Management
                </Link>
              )}
            </div>
          </div>

          <div className="hidden lg:flex lg:items-center lg:ml-6 gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-gray-900 leading-none">
                  {currentUser?.firstName} {currentUser?.lastName}
                </span>
                <span className="text-[10px] text-gray-500 capitalize">
                  {currentUser?.role.toLowerCase()}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                <UserIcon className="h-4 w-4 text-indigo-600" />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95 duration-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-16 right-4 left-4 sm:left-auto sm:w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            {isManager && (
              <Link
                to="/users"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive('/users')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="h-5 w-5" />
                Team Management
              </Link>
            )}
            <div className="pt-4 pb-3 border-t border-gray-100 mt-2">
              <div className="flex items-center px-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                  <UserIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-bold text-gray-900 leading-tight">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </div>
                  <div className="text-xs font-medium text-gray-500 capitalize">
                    {currentUser?.role.toLowerCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 text-base font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
