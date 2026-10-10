import { z } from 'zod';

export const TOKELESS_URLS = {
	login: '/auth/login',
	updatePassword: '/auth/update-password',
	appleLogin: '/auth/apple-login',
} as const;

export const USER_URLS = {
	users: '/users',
	userById: (id: string) => `/users/${id}`,
		deleteAccount: '/users/delete-request',
	cancelDeleteAccount: '/users/delete-cancel',
} as const;

export const EYE_TRACKING_URLS = {
	eyeMetrics: '/eyetracking',
	timeFilter: (filter: string) => `/eyetracking/time-filter?timeFilter=${filter}`,
} as const;

export const FILE_UPLOAD_URL = {
	uploadMultiple: '/files/upload-multiple',
    fileUpload: '/files/upload',
    fileByName: (fileName: string) => `/files/${fileName}`,
} as const;
const SYNC_URLS={
	 eyeMetrics: '/eyetracking/local-datasync',
    getunsycned: '/eyetracking/get-un-synced',
    markSync: '/eyetracking/mark-synced' ,  
	sessions: '/screentime/bulk-time-push',
	getUnsyncedSession: '/screentime/get-unsynced-sessions',
	markSessionSynced: '/screentime/mark-synced-sessions',
	
}as const;

export const VIDEO_URLS={
	eyeExercises: '/gumlet/playlists/f8b4cd3c-8bfa-46d2-9fcc-92a5760264e2/videos',
} as const;


const createDynamicUrl = <T extends string, ID extends z.infer<typeof IdSchema>>(base: T) => ({
	'': '/',
	byId: (id: ID) => `${base}/${id}` as `${T}/${ID}`,

	address: (id: ID) => `${base}/${id}/address` as `${T}/${ID}/address`,
	addressById: (id: ID, addressId: ID) =>
		`${base}/${id}/address/${addressId}` as `${T}/${ID}/address/${ID}`,
});

export const DYNAMIC_URLS = {
	user: createDynamicUrl('/users'),
} as const;

export const URLS = {
	...TOKELESS_URLS,
	...USER_URLS,
	...EYE_TRACKING_URLS,
	...DYNAMIC_URLS,
	...SYNC_URLS,
	...VIDEO_URLS
} as const;

export type URLS_TYPE = (typeof URLS)[keyof typeof URLS];
export type TOKELESS_URLS_TYPE = (typeof TOKELESS_URLS)[keyof typeof TOKELESS_URLS];
export type USER_URLS_TYPE = (typeof USER_URLS)[keyof typeof USER_URLS];
export type EYE_TRACKING_URLS_TYPE = (typeof EYE_TRACKING_URLS)[keyof typeof EYE_TRACKING_URLS];

export const IdSchema = z.string().uuid();
export const NumberSchema = z.number();

export const validateDynamicUrl = (route: keyof typeof DYNAMIC_URLS, ...params: string[]) => {
	if (!DYNAMIC_URLS[route]) {
		throw new Error(`Invalid route: ${route}`);
	}
	params?.forEach((param) => {
		IdSchema.parse(param);
	});
	// @ts-expect-error error
	return DYNAMIC_URLS[route].byId(...params);
};
