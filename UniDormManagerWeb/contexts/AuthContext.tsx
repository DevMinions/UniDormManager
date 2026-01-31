
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { checkPermission } from '../services/rbacData';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  isLoading: boolean;
  allRoles: Role[]; // Shared roles for permission checking
  permissions: string[]; // User permissions from backend
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load current user and roles on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { user: currentUser, permissions: userPermissions } = await api.getCurrentUser();
        const roles = await api.getRoles();
        
        setUser({
          ...currentUser,
          roleIds: currentUser.roles?.map((r: any) => r.id) || [],
        } as User);
        setPermissions(userPermissions || []);
        setAllRoles(roles);
      } catch (err) {
        console.error("Failed to fetch auth data", err);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRoles = async () => {
      try {
        const roles = await api.getRoles();
        setAllRoles(roles);
      } catch (err) {
        console.error("Failed to fetch roles for auth context", err);
      }
    };

    initAuth();
    fetchRoles();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: loginUser, token } = await api.login(username, password);
      const roles = await api.getRoles();
      const { permissions: userPermissions } = await api.getCurrentUser();
      
      setUser({
        ...loginUser,
        roleIds: loginUser.roles || [],
      } as User);
      setPermissions(userPermissions || []);
      setAllRoles(roles);
    } catch (err: any) {
      throw new Error(err.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      setPermissions([]);
    }
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    // 优先使用后端返回的权限列表
    if (permissions.length > 0) {
      return permissions.includes(permissionCode);
    }
    // 回退到基于角色的权限检查
    return checkPermission(user, permissionCode, allRoles);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      hasPermission,
      isLoading,
      allRoles,
      permissions
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
