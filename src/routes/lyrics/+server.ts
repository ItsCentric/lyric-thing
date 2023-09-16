import { json, error, type RequestHandler } from '@sveltejs/kit';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { downloadAsAudioInMemory, searchForSong } from '$lib/youtubeHelpers';
import { generateTranscribedLyrics } from '$lib/openaiHelpers';
import { getYoutubeURL } from '$lib/songlinkHelpers';

const pb = new PocketBase('http://127.0.0.1:8090');

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

	if (!uri) throw error(400, 'No URI provided');

	try {
		const dbSearchRes = await pb.collection('lyrics').getFirstListItem(`uri = '${uri}'`);
		return json(dbSearchRes);
	} catch (err) {
		const pbError = err as ClientResponseError;
		if (pbError.status === 404) {
			try {
				if (!session?.user?.accessToken) throw error(401, 'Not logged in');
				const res =
					(await getYoutubeURL(uri)) ?? (await searchForSong(uri, session.user.accessToken));
				const mp3Buffer = await downloadAsAudioInMemory(typeof res === 'string' ? res : res.url);
				const lyrics = await generateTranscribedLyrics(uri, mp3Buffer, pb);

				return json(lyrics);
			} catch (err) {
				throw error(500);
			}
		}
	}
	throw error(500, 'Unknown error');
};
