import type { AxiosHeaders, RawAxiosRequestHeaders } from 'axios';
import useAppStore from '@/store';

export function getHeaders(): RawAxiosRequestHeaders | AxiosHeaders {
  try {
   const token=useAppStore.getState().auth.token;
    if (!token) {
      throw new Error('');
    }

    return {
      // 'x-auth-token': token,
      'Authorization': `Bearer ${token}`,
    };
  } catch {
    return {
      Authorization: `Bearer `,
    };
  }
}
