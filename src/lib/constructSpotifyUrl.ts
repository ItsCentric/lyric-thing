export default function constructSpotifyUrl(uri: string) {
	const [, type, id] = uri.split(':');
	return `https://open.spotify.com/${type}/${id}`;
}
