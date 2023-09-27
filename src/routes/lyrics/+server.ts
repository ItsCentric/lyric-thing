import { json, error, type RequestHandler, type HttpError } from '@sveltejs/kit';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { downloadAsAudioInMemory, searchForSong } from '$lib/youtubeHelpers';
import { generateTranscribedLyrics } from '$lib/openaiHelpers';
import { getYoutubeURL } from '$lib/songlinkHelpers';
import calculateMinutes from '$lib/calculateMinutes';

const pb = new PocketBase('http://127.0.0.1:8090');
const openaiServiceCharge = 0.006;

export type GetLyricsRes = {
	response: Response;
	uri: string;
	transcriptions: {
		id: number;
		start: number;
		end: number;
		text: string;
	}[];
};
export const GET: RequestHandler = async ({ url, locals }) => {
	const session = await locals.getSession();
	const uri = url.searchParams.get('uri');
	const duration = url.searchParams.get('duration');

	if (!uri) throw error(400, 'No URI provided');
	if (!duration) throw error(400, 'No duration provided');

	try {
		const dbSearchRes = await pb.collection('lyrics').getFirstListItem(`uri = '${uri}'`);
		return json(dbSearchRes);
	} catch (err) {
		const pbError = err as ClientResponseError;
		if (pbError.status === 404) {
			try {
				if (!session?.user?.accessToken || !session.user.providerAccountId)
					throw error(401, 'Not logged in');
				const user = await pb
					.collection('users')
					.getFirstListItem(`spotifyId = '${session.user.providerAccountId}'`);
				const neededBalance = openaiServiceCharge * calculateMinutes(parseInt(duration));
				if (user.balance < neededBalance) throw error(402, 'Insufficient funds');
				const res =
					(await getYoutubeURL(uri)) ?? (await searchForSong(uri, session.user.accessToken));
				const mp3Buffer = await downloadAsAudioInMemory(typeof res === 'string' ? res : res.url);
				const lyrics = await generateTranscribedLyrics(
					uri,
					mp3Buffer,
					session.user.providerAccountId,
					neededBalance
				);

				return json(lyrics);
			} catch (err) {
				const serverError = err as HttpError | ClientResponseError;
				if ('isAbort' in serverError) throw error(serverError.status, serverError.message);
				throw error(serverError.status, serverError.body.message);
			}
		}
	}
	throw error(500, 'Unknown error');
};
