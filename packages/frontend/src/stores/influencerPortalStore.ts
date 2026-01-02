/**
 * 达人端口状态管理 Store
 */

import { create } from 'zustand';

export interface InfluencerContact {
  id: string;
  accountId: string;
  phone: string;
  name: string | null;
  contactType: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface InfluencerAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accountId: string;
  contactId: string;
}

interface InfluencerPortalState {
  contact: InfluencerContact | null;
  token: InfluencerAuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (contact: InfluencerContact, token: InfluencerAuthToken) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateToken: (token: InfluencerAuthToken) => void;
}

export const useInfluencerPortalStore = create<InfluencerPortalState>()((set) => ({
  contact: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  
  setAuth: (contact, token) => {
    // 保存到 localStorage
    try {
      localStorage.setItem('influencer_token', token.accessToken);
      localStorage.setItem('influencer_refresh_token', token.refreshToken);
      localStorage.setItem('influencer_contact', JSON.stringify(contact));
    } catch (e) {
      console.error('Failed to save auth:', e);
    }
    
    set({
      contact,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: () => {
    try {
      localStorage.removeItem('influencer_token');
      localStorage.removeItem('influencer_refresh_token');
      localStorage.removeItem('influencer_contact');
    } catch (e) {
      // ignore
    }
    set({
      contact: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
  
  updateToken: (token) => {
    set(() => {
      try {
        localStorage.setItem('influencer_token', token.accessToken);
        localStorage.setItem('influencer_refresh_token', token.refreshToken);
      } catch (e) {
        // ignore
      }
      return { token };
    });
  },
}));

export function getContactTypeName(type: string): string {
  const names: Record<string, string> = {
    SELF: '本人',
    ASSISTANT: '助理',
    AGENT: '经纪人',
    OTHER: '其他',
  };
  return names[type] || type;
}
