import { SvelteKitAuth } from '@auth/sveltekit';
import Spotify from '@auth/core/providers/spotify';
import { AUTH_SECRET, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '$env/static/private';
import { pb } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';
import type { ClientResponseError } from 'pocketbase';

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
				token.providerAccountId = account.providerAccountId;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.accessToken = token.accessToken as string;
				session.user.providerAccountId = token.providerAccountId as string;
			}
			return session;
		}
	},
	events: {
		async signIn({ account, profile }) {
			if (!account || !profile) throw error(401);
			try {
				await pb.collection('users').getFirstListItem(`spotifyId = '${account.providerAccountId}'`);
			} catch (err) {
				const pbError = err as ClientResponseError;
				try {
					if (pbError.status === 404) {
						await pb.collection('users').create({
							spotifyId: account.providerAccountId,
							email: profile.email
						});
					}
				} catch (err) {
					const pbError = err as ClientResponseError;
					console.log(pbError);
				}
			}
		}
	}
});
