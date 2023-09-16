export async function getYoutubeURL(spotifyUri: string) {
	const params = new URLSearchParams({ url: encodeURIComponent(spotifyUri), songIfSingle: 'true' });
	const linksRes = await fetch(`https://api.song.link/v1-alpha.1/links?${params.toString()}`);
	if (!linksRes.ok) throw new Error('Could not get track links');
	const linksData = await linksRes.json();
	if (linksData.linksByPlatform.youtube === undefined) return null;
	const youtubeLink = linksData.linksByPlatform.youtube.url;
	return youtubeLink as string;
}
