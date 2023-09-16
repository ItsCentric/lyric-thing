import type { GetLyricsRes } from '../routes/lyrics/+server';

export async function getLyrics(currentTrackUri: string) {
	const lyricsRes = await fetch(`/lyrics?uri=${currentTrackUri}`);
	if (lyricsRes.ok) {
		const lyrics = (await lyricsRes.json()) as {
			uri: GetLyricsRes['uri'];
			transcriptions: GetLyricsRes['transcriptions'];
		};
		return { response: lyricsRes, ...lyrics };
	}
	return { response: lyricsRes, uri: currentTrackUri, transcriptions: [] };
}

let currentIndex = 0;
export async function getThreeNearestActiveLyrics(
	currentTrackPosition: number,
	lyrics: GetLyricsRes
) {
	const trackPositionInSeconds = currentTrackPosition / 1000;
	const lyricsWithActive = lyrics.transcriptions.map((segment) => {
		return {
			...segment,
			active: segment.start <= trackPositionInSeconds && segment.end >= trackPositionInSeconds
		};
	});
	const activeLyricIndex = lyricsWithActive.findIndex((segment) => {
		return !!segment.active;
	});
	if (activeLyricIndex !== -1) {
		currentIndex = activeLyricIndex;
	}
	if (currentIndex === 0) {
		return lyricsWithActive.slice(0, 2);
	}
	return lyricsWithActive.slice(currentIndex - 1, currentIndex + 2);
}
