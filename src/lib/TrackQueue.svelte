<script lang="ts">
	import constructSpotifyUrl from './constructSpotifyUrl';
	import formatArtistList from './formatArtistList';
	import { trackQueue } from './stores';
</script>

<main class="card w-modal shadow-xl p-4">
	<h2 class="text-3xl mb-4">Track Queue</h2>
	<div class="flex flex-col gap-2">
		{#each $trackQueue.previous as track}
			<div class="flex gap-2 items-center">
				<img
					src={track.album.images[0].url}
					alt={`cover art for ${track.name}`}
					class="aspect-square w-24"
				/>
				<div>
					<a
						href={constructSpotifyUrl(track.uri)}
						class="text-xl font-bold hover:text-tertiary-200 transition-colors block"
						>{track.name}</a
					>
					{@html formatArtistList(track.artists, 'text-surface-400')}
				</div>
			</div>
		{/each}
		{#if $trackQueue.current}
			<div class="flex gap-2 items-center bg-green-300 bg-opacity-20 rounded-md">
				<img
					src={$trackQueue.current.cover}
					alt={`cover art for ${$trackQueue.current.name}`}
					class="aspect-square w-24"
				/>
				<div>
					<a
						href={constructSpotifyUrl($trackQueue.current.uris.track)}
						class="text-xl font-bold hover:text-tertiary-200 transition-colors block"
						>{$trackQueue.current.name}</a
					>
					{@html formatArtistList(
						$trackQueue.current.artists.map((artist, i) => {
							return { name: artist, uri: $trackQueue.current?.uris.artists[i] ?? '' };
						}),
						'text-surface-400'
					)}
				</div>
			</div>
		{/if}
		{#each $trackQueue.next as track}
			<div class="flex gap-2 items-center">
				<img
					src={track.album.images[0].url}
					alt={`cover art for ${track.name}`}
					class="aspect-square w-24"
				/>
				<div>
					<a
						href={constructSpotifyUrl(track.uri)}
						class="text-xl font-bold hover:text-tertiary-200 transition-colors block"
						>{track.name}</a
					>
					{@html formatArtistList(track.artists, 'text-surface-400')}
				</div>
			</div>
		{/each}
	</div>
</main>
