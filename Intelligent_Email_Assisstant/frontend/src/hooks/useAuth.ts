import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/index.js';
import { User, UserSettings } from '../api/client.js';
import { useInboxStore } from '../store/useInboxStore.js';

export interface SessionData {
  user: User;
  isGoogleConnected: boolean;
  settings: UserSettings;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const showToast = useInboxStore((state) => state.showToast);

  const { data, isLoading, isFetching } = useQuery<SessionData | null>({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const res = await authApi.getSession();
        return res;
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('assistant_token');
          return null;
        }
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const emailLoginMutation = useMutation({
    mutationFn: ({ email, name }: { email: string; name?: string }) =>
      authApi.emailLogin(email, name),
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('assistant_token', data.token);
      }
      queryClient.setQueryData(['session'], {
        user: data.user,
        isGoogleConnected: true,
        settings: {
          defaultTone: 'Professional',
          aiProvider: 'claude',
          aiModel: 'claude-3-5-sonnet',
          autoClassify: true,
        },
      });
      showToast({
        title: 'Logged In Successfully',
        message: `Welcome back, ${data.user.name || data.user.email}!`,
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
    onError: (err: any) => {
      showToast({
        title: 'Login Failed',
        message: err.response?.data?.error || 'Could not sign in with email.',
        type: 'error',
      });
    },
  });

  const demoLoginMutation = useMutation({
    mutationFn: authApi.demoLogin,
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('assistant_token', data.token);
      }
      queryClient.setQueryData(['session'], {
        user: data.user,
        isGoogleConnected: true,
        settings: {
          defaultTone: 'Professional',
          aiProvider: 'claude',
          aiModel: 'claude-3-5-sonnet',
          autoClassify: true,
        },
      });
      showToast({
        title: 'Demo Session Active',
        message: 'Logged in as Demo Sandbox user.',
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      localStorage.removeItem('assistant_token');
      queryClient.setQueryData(['session'], null);
      queryClient.clear();
      showToast({
        title: 'Logged Out',
        message: 'You have been signed out safely.',
        type: 'info',
      });
    },
    onError: () => {
      localStorage.removeItem('assistant_token');
      queryClient.setQueryData(['session'], null);
      queryClient.clear();
    },
  });

  return {
    user: data?.user,
    isGoogleConnected: data?.isGoogleConnected ?? false,
    settings: data?.settings,
    isLoading: isLoading && isFetching,
    isAuthenticated: !!data?.user,
    emailLogin: emailLoginMutation.mutateAsync,
    isEmailLoginLoading: emailLoginMutation.isPending,
    demoLogin: demoLoginMutation.mutateAsync,
    isDemoLoading: demoLoginMutation.isPending,
    logout: logoutMutation.mutate,
    isLogoutLoading: logoutMutation.isPending,
  };
}
