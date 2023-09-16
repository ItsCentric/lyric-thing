import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI, { toFile } from 'openai';
import type { ClientResponseError } from 'pocketbase';
import type PocketBase from 'pocketbase';

const openaiClient = new OpenAI({
	apiKey: OPENAI_API_KEY
});
type VerboseJsonResponse = {
	text: string;
	segments: {
		id: number;
		seek: number;
		start: number;
		end: number;
		text: string;
		tokens: number[];
		temperature: number;
		avg_logprob: number;
		compression_ratio: number;
		no_speech_prob: number;
	}[];
};
export async function generateTranscribedLyrics(
	uri: string,
	mp3Buffer: Buffer,
	pocketbaseClient: PocketBase
) {
	const whisperRes = (await openaiClient.audio.transcriptions.create({
		file: await toFile(mp3Buffer, 'transcription.mp3', { type: 'audio/mp3' }),
		model: 'whisper-1',
		response_format: 'verbose_json',
		language: 'en'
	})) as unknown as VerboseJsonResponse; // bad types, shame on you openai :(
	const mappedSegments = whisperRes.segments.map((segment) => {
		return {
			id: segment.id,
			start: Math.floor(segment.start),
			end: Math.floor(segment.end),
			text: segment.text
		};
	});

	try {
		await pocketbaseClient.collection('lyrics').create({ uri, transcriptions: mappedSegments });
	} catch (error) {
		const pbError = error as ClientResponseError;
		console.log(pbError.status, pbError.message);
	}

	return { uri, transcriptions: mappedSegments };
}
