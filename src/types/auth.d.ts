import { type DefaultSession } from '@auth/core/types';

declare module '@auth/sveltekit/node_modules/@auth/core/types' {
	interface Session {
		user?: {
			accessToken?: string;
		} & DefaultSession['user'];
	}
}
