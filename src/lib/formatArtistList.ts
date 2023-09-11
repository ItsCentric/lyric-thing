import constructSpotifyUrl from './constructSpotifyUrl';

export default function formatArtistList(artists: { name: string; uri: string }[], styles: string) {
	const artistAnchors = artists
		.map((artist) => {
			return `<a class="hover:text-tertiary-200 transition-colors" href="${constructSpotifyUrl(
				artist.uri
			)}">${artist.name}</a>`;
		})
		.join(', ');

	return `<span class="${styles}">${artistAnchors}</span>`;
}
