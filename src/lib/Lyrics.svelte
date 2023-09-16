<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { GetLyricsRes } from '../routes/lyrics/+server';
	import { flip } from 'svelte/animate';
	import { getLyrics, getThreeNearestActiveLyrics } from './lyricHelpers';

	export let currentTrackUri: string;
	export let trackPosition: number;
	const flyInParameters = { y: 50, duration: 300 };
	const flyOutParameters = { y: -50, duration: 300 };
	let nearestThreeLyrics: Awaited<ReturnType<typeof getThreeNearestActiveLyrics>> = [];
	let lyricsTrackUri: string;
	let lyricsRes: GetLyricsRes = { response: new Response(), uri: '', transcriptions: [] };

	$: if (currentTrackUri !== lyricsTrackUri) {
		lyricsTrackUri = currentTrackUri;
		nearestThreeLyrics = [];
		lyricsRes = { response: new Response(), uri: '', transcriptions: [] };
		getLyrics(currentTrackUri).then((res) => (lyricsRes = res));
	}
	$: if (lyricsRes)
		getThreeNearestActiveLyrics(trackPosition, lyricsRes).then((res) => (nearestThreeLyrics = res));
</script>

<main class="flex flex-col gap-2 justify-center text-center md:text-right font-semibold text-3xl">
	{#if !lyricsRes.response.bodyUsed && lyricsRes.response.ok}
		<p in:fly={flyInParameters} out:fly={flyOutParameters} class="text-surface-400 animate-pulse">
			Getting lyrics...
		</p>
	{:else if !lyricsRes.response.bodyUsed && !lyricsRes.response.ok}
		{@const { response } = lyricsRes}
		<p in:fly={flyInParameters} out:fly={flyOutParameters} class="text-error-500">
			Something went wrong
		</p>
		<p class="text-base text-error-500">
			{response.status}: {response.statusText}
		</p>
	{:else}
		{#each nearestThreeLyrics as lyric, i (lyric.id)}
			<span animate:flip={{ duration: 300 }} in:fly={flyInParameters} out:fly={flyOutParameters}>
				<p
					class={`transition-colors duration-300 ${
						lyric.active ? 'text-white' : 'text-surface-400'
					}`}
				>
					{lyric.text}
				</p>
			</span>
		{/each}
	{/if}
</main>
