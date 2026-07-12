/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, RefreshCw, ChevronDown, Settings, LogOut, LifeBuoy, User } from 'lucide-react';
import { usePlan, PlanType } from '../../contexts/PlanContext';
import { useAuth } from '../../contexts/AuthContext';
import { canAccess, MANAGEMENT_ROLES, TENANT_ROLES } from '../../permissions';

interface AuthTopBarProps {
  breadcrumbs: string[]; // e.g. ["Workspace", "ESG Dashboard"]
  onNotificationClick?: () => void;
  onAskAIClick?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export default function AuthTopBar({
  breadcrumbs,
  onNotificationClick,
  onAskAIClick,
  searchValue = '',
  onSearchChange,
}: AuthTopBarProps) {
  const navigate = useNavigate();
  const { plan } = usePlan();
  const { user, logout } = useAuth();
  const [value, setValue] = useState(searchValue);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  // ⌘K focus listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('ask-ai-input');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close the profile menu when clicking anywhere outside it
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const userInitials = user?.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'SV';

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className="w-full flex items-center justify-between py-3 px-8 bg-white border-b border-gray-100 sticky top-0 z-35 font-sans h-[72px] shrink-0">
      
      {/* 1. Left-aligned Search input */}
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="ask-ai-input"
            type="text"
            placeholder="Search"
            value={value}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-2 text-sm text-gray-800 bg-gray-50 border border-transparent hover:bg-gray-100 focus:bg-white rounded-full outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150"
          />
        </div>
      </div>

      {/* 2. Right-side items */}
      <div className="flex items-center space-x-4 shrink-0">
        
        <button className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onNotificationClick}
          className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* User Profile */}
        <div className="relative pl-2" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen((open) => !open)}
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-full transition-colors"
            aria-label="Profile menu"
            aria-expanded={profileMenuOpen}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
              {userInitials}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-40 animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name ?? 'User'}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <User className="w-4 h-4 mr-2.5 text-gray-400" />
                  My Profile
                </button>

                {canAccess(user?.role, MANAGEMENT_ROLES) && (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2.5 text-gray-400" />
                    Profile & Settings
                  </button>
                )}

                {canAccess(user?.role, TENANT_ROLES) && (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/support');
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <LifeBuoy className="w-4 h-4 mr-2.5 text-gray-400" />
                    Feedback & Support
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
