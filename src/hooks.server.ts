import { SvelteKitAuth } from '@auth/sveltekit';
import Spotify from '@auth/core/providers/spotify';
import { AUTH_SECRET, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '$env/static/private';

export const handle = SvelteKitAuth({
	providers: [
		Spotify({
			clientId: SPOTIFY_CLIENT_ID,
			clientSecret: SPOTIFY_CLIENT_SECRET,
			authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(
				'user-read-email user-read-currently-playing streaming'
			)}`
		})
	],
	secret: AUTH_SECRET,
	callbacks: {
		async jwt({ token, account }) {
			if (account) {
				token.accessToken = account.access_token;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.accessToken = token.accessToken as string;
			}
			return session;
		}
	}
});
