/**
 * View Switcher Utility
 * Allows switching between Patient View and Staff View for testing/development
 */

import { cookies } from 'next/headers';

export type ViewMode = 'patient' | 'staff';

const VIEW_MODE_COOKIE = 'holovitals_view_mode';

/**
 * Get current view mode
 */
export function getViewMode(): ViewMode {
  const cookieStore = cookies();
  const viewMode = cookieStore.get(VIEW_MODE_COOKIE)?.value as ViewMode;
  return viewMode || 'patient'; // Default to patient view
}

/**
 * Set view mode
 */
export function setViewMode(mode: ViewMode): void {
  const cookieStore = cookies();
  cookieStore.set(VIEW_MODE_COOKIE, mode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

/**
 * Toggle view mode
 */
export function toggleViewMode(): ViewMode {
  const current = getViewMode();
  const newMode = current === 'patient' ? 'staff' : 'patient';
  setViewMode(newMode);
  return newMode;
}

/**
 * Check if user is in staff view
 */
export function isStaffView(): boolean {
  return getViewMode() === 'staff';
}

/**
 * Check if user is in patient view
 */
export function isPatientView(): boolean {
  return getViewMode() === 'patient';
}

/**
 * Get redirect URL based on view mode
 */
export function getViewRedirectUrl(mode: ViewMode): string {
  if (mode === 'staff') {
    return '/staff/dashboard';
  } else {
    return '/dashboard';
  }
}

/**
 * Client-side view mode management
 */
export const ViewSwitcherClient = {
  /**
   * Get current view mode from localStorage (client-side)
   */
  getViewMode(): ViewMode {
    if (typeof window === 'undefined') return 'patient';
    const mode = localStorage.getItem(VIEW_MODE_COOKIE);
    return (mode as ViewMode) || 'patient';
  },

  /**
   * Set view mode in localStorage (client-side)
   */
  setViewMode(mode: ViewMode): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(VIEW_MODE_COOKIE, mode);
  },

  /**
   * Toggle view mode (client-side)
   */
  toggleViewMode(): ViewMode {
    const current = this.getViewMode();
    const newMode = current === 'patient' ? 'staff' : 'patient';
    this.setViewMode(newMode);
    return newMode;
  },

  /**
   * Check if in staff view (client-side)
   */
  isStaffView(): boolean {
    return this.getViewMode() === 'staff';
  },

  /**
   * Check if in patient view (client-side)
   */
  isPatientView(): boolean {
    return this.getViewMode() === 'patient';
  },
};