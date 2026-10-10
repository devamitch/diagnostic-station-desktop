export interface FormattedUser {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL?: string;
}


export type AuthError = any;
