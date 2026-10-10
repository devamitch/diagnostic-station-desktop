import { useRouter } from '@/i18n/navigation';
import { UserLoginSchema, UserRegisterSchema } from '@/lib/schema/user';
import useAppStore from '@/store';
import { notify } from '@/utils/toasts';
import { useMutation } from '@tanstack/react-query';
import { useFormMutation } from './use-api';
import { cancelDeleteAccountRequest, deleteAccountRequest } from '@/services/authService';

// Create Admin
export const useRegisterUser = () => {
	const router = useRouter();
	const register = useAppStore((state) => state.auth.register);

	return useFormMutation(
		UserRegisterSchema,
		async (data: Record<string, unknown>) => {
			const { email, password, name } = data as {
				email: string;
				password: string;
				name: string;
			};

			// Default role to USER
			const role: 'ADMIN' | 'USER' = 'USER';
			await register(email, password, name, role);
		},
		{
			onSuccess: () => {
				router.push('/dashboard');
			},
		}
	);
};

// Login Admin
export const useLogin = () => {
	const router = useRouter();
	const login = useAppStore((state) => state.auth.login);
	const { startScreenTime } = useAppStore((state) => state?.screenTime);
	return useFormMutation(
		UserLoginSchema,
		async (data: Record<string, unknown>) => {
			const { email, password } = data as { email: string; password: string };
			await login(email, password);
		},
		{
			mode: 'onSubmit',
			reValidateMode: 'onSubmit',
			onSuccess: () => {
				startScreenTime();

				// toast.success('Login successful');
				notify('Login successful', 'success');
				// if (typeof window !== 'undefined' && window.ipc) {
				// 	// Use Electron notification
				// 	window.ipc.showNotification({
				// 		title: 'Login Successful',
				// 		body: 'You have successfully logged in.',
				// 		actions: [{ text: 'Open' }, { text: 'Dismiss' }],
				// 	});
				// }

				router.push('/dashboard');
			},
			onError: (error: any) => {
				// toast.error(error.response?.data?.message || 'Login failed');
				notify(error.response?.data?.message || 'Login failed', 'error');
			},
		}
	);
};

export const useAppleSavedLogin = () => {
	const router = useRouter();
	const appleSavedLogin = useAppStore((state) => state.auth.appleSavedLogin);
	const { startScreenTime } = useAppStore((state) => state?.screenTime);

	return useMutation({
		mutationFn: appleSavedLogin,
		onSuccess: () => {
			startScreenTime();
			notify('Apple Login successful', 'success');
			router.push('/dashboard');
		},
		onError: (error: any) => {
			console.log('inithe err', error);
			notify(error?.response?.data?.message || 'Apple Login failed', 'error');
		},
	});
};

export function useDeleteRequest() {
  return useMutation({
    mutationKey: ['createDeleteRequest'],
    mutationFn: async (data: DeleteRequest) => {
      const response = await deleteAccountRequest(data);
      return response;
    },
  });
}

export function useDeleteCancel() {
  return useMutation({
    mutationKey: ['cancelDeleteRequest'],
    mutationFn: async () => {
      const response = await cancelDeleteAccountRequest();
      return response;
    },
  });
}