<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		ListMusic,
		MonitorSpeaker,
		Pause,
		Play,
		Repeat,
		Repeat1,
		Shuffle,
		SkipBack,
		SkipForward,
		Volume1,
		Volume2,
		VolumeX
	} from 'lucide-svelte';
	import {
		RangeSlider,
		getModalStore,
		type ModalSettings,
		getToastStore
	} from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';
	import { formatDuration } from '$lib/formatDuration';
	import TrackQueue from '$lib/TrackQueue.svelte';
	import { trackQueue } from '$lib/stores';
	import constructSpotifyUrl from '$lib/constructSpotifyUrl';
	import formatArtistList from '$lib/formatArtistList';
	import type { GetLyricsRes } from './lyrics/+server';
	import Lyrics from '$lib/Lyrics.svelte';

	let player: Spotify.Player;

	let trackName: string;
	let uris: { track: string; artists: string[] } = { track: '', artists: [] };
	let trackArtists: string[];
	let trackCover: string;
	let trackDuration: number;
	let trackPosition: number;

	// data for design iterations since player resets on page reload
	// let trackName: string = 'Kill Bill';
	// let uris: { track: string; artists: string[] } = { track: '', artists: ['lalalala'] };
	// let trackArtists: string[] = ['SZA'];
	// let trackCover: string = 'https://i.scdn.co/image/ab67616d00001e0270dbc9f47669d120ad874ec1';
	// let trackDuration: number = 123300;
	// let trackPosition: number = 123300 / 2;
	// let lyricsRes = new Response('', { status: 200 });
	// console.log(lyricsRes.blob());
	// let lyrics: GetLyricsRes = {
	// 	uri: '',
	// 	transcriptions: [
	// 		{ id: 1, start: 59, end: 60, text: 'lalalala' },
	// 		{ id: 2, start: 61, end: 62, text: 'lalalalababababab' },
	// 		{ id: 3, start: 63, end: 64, text: 'rararra' }
	// 	]
	// };

	let volume = 0.5;
	let isPlaying = false;
	let playingTrack = false;
	let repeat: 0 | 1 | 2 = 0;
	let shuffle: boolean;
	let previousTracks: Spotify.Track[] = [];
	let nextTracks: Spotify.Track[] = [];

	const positionInterval = setInterval(() => {
		if (!player) return;
		player.getCurrentState().then((state) => {
			if (!state) return;
			trackPosition = state.position;
		});
	}, 1000);
	const trackQueueModal: ModalSettings = {
		type: 'component',
		title: 'Track Queue',
		component: {
			ref: TrackQueue
		}
	};
	const modalStore = getModalStore();
	const toastStore = getToastStore();

	function loadSpotifyPlayer(): Promise<any> {
		return new Promise<void>((resolve, reject) => {
			const scriptTag = document.getElementById('spotify-player');

			if (!scriptTag) {
				const script = document.createElement('script');

				script.id = 'spotify-player';
				script.type = 'text/javascript';
				script.async = false;
				script.defer = true;
				script.src = 'https://sdk.scdn.co/spotify-player.js';
				script.onload = () => resolve();
				script.onerror = (error: any) => reject(new Error(`loadScript: ${error.message}`));

				document.head.appendChild(script);
			} else {
				resolve();
			}
		});
	}
	function initializeSpotifyPlayer() {
		player = new window.Spotify.Player({
			name: 'Lyric Thing',
			volume,
			getOAuthToken: (cb) => {
				if (!$page.data.session?.user?.accessToken) return;
				cb($page.data.session.user.accessToken);
			}
		});

		player.addListener('player_state_changed', handleStateChange);

		player.connect();
	}
	function handleStateChange(state: Spotify.PlaybackState) {
		uris = { track: '', artists: [] };
		const currentTrack = state.track_window.current_track;
		trackName = currentTrack.name;
		uris.track = currentTrack.uri;
		trackArtists = currentTrack.artists.map((artist) => {
			uris.artists.push(artist.uri);
			return artist.name;
		});
		trackCover = currentTrack.album.images[0].url;
		trackDuration = currentTrack.duration_ms;
		trackPosition = state.position;
		isPlaying = !state.paused;
		playingTrack = !!state.track_window.current_track;
		repeat = state.repeat_mode;
		shuffle = state.shuffle;
		previousTracks = state.track_window.previous_tracks;
		nextTracks = state.track_window.next_tracks;
		trackQueue.set({
			previous: previousTracks,
			current: { name: trackName, artists: trackArtists, uris, cover: trackCover },
			next: nextTracks
		});
	}
	function handleVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		player.setVolume(target.valueAsNumber);
	}
	function handleSeek(e: Event) {
		const target = e.target as HTMLInputElement;
		const seekTo = trackDuration * target.valueAsNumber;
		player.seek(seekTo);
	}
	async function handleShuffle() {
		const currentState = await player.getCurrentState();
		if (!currentState) return;
		await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${!currentState.shuffle}`, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${$page.data.session?.user?.accessToken}`
			}
		});
	}
	async function handleRepeat() {
		const stateOptions = ['off', 'track', 'context'];
		const newState = stateOptions[(repeat + 1) % 3];
		await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${newState}`, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${$page.data.session?.user?.accessToken}`
			}
		});
	}

	onMount(async () => {
		if (!window.onSpotifyWebPlaybackSDKReady) {
			window.onSpotifyWebPlaybackSDKReady = initializeSpotifyPlayer;
		} else {
			initializeSpotifyPlayer();
		}
		const query = new URLSearchParams(window.location.search);
		if (query.get('checkoutSuccess') === 'true') {
			toastStore.trigger({ message: 'Checkout successful!', background: 'variant-filled-success' });
			window.history.replaceState({}, '', '/');
		}
		if (query.get('checkoutSuccess') === 'false') {
			toastStore.trigger({ message: 'Checkout canceled.', background: 'variant-filled-error' });
			window.history.replaceState({}, '', '/');
		}

		await loadSpotifyPlayer();
	});

	onDestroy(() => {
		if (player) player.disconnect();
		clearInterval(positionInterval);
	});
</script>

<main class="px-4 xl:px-64 h-full flex justify-center items-center">
	{#if playingTrack && $page.data.session}
		<div class="grid grid-cols-2 gap-4 items-center w-full">
			<div class="flex md:flex-row flex-col gap-4 items-center md:mr-auto col-span-2 md:col-span-1">
				<div>
					<img
						src={trackCover}
						alt={`track cover for ${trackName}`}
						class="min-w-[150px] aspect-square"
					/>
				</div>
				<div class="text-center md:text-left">
					<a
						href={constructSpotifyUrl(uris.track)}
						target="_blank"
						class="text-3xl md:text-5xl font-bold line-clamp-2 hover:text-tertiary-200 transition-colors"
						>{trackName}</a
					>
					{@html formatArtistList(
						trackArtists.map((artist, i) => {
							return { name: artist, uri: uris.artists[i] };
						}),
						'text-xl md:text-3xl text-surface-400 whitespace-pre inline-block align-middle line-clamp-2'
					)}
				</div>
			</div>
			<Lyrics currentTrackUri={uris.track} {trackPosition} />
			<div class="col-span-2 flex flex-col gap-2">
				<div class="flex items-center w-full justify-between relative">
					<div>
						<button
							class="btn btn-icon variant-ghost btn-icon-sm"
							on:click={() => modalStore.trigger(trackQueueModal)}
						>
							<ListMusic size={16} />
						</button>
					</div>
					<div class="flex gap-4 items-center absolute left-1/2 -translate-x-1/2">
						<button class="btn btn-icon btn-icon-sm variant-ghost" on:click={handleShuffle}>
							<Shuffle size={16} class={shuffle ? 'text-secondary-500' : ''} />
						</button>
						<button
							class="btn btn-icon variant-filled-primary"
							on:click={() => player.previousTrack()}
						>
							<SkipBack size={24} />
						</button>
						<button
							class="btn btn-icon variant-filled-primary"
							on:click={() => player.togglePlay()}
						>
							{#if !isPlaying}
								<Play size={24} />
							{:else}
								<Pause size={24} />
							{/if}
						</button>
						<button class="btn btn-icon variant-filled-primary" on:click={() => player.nextTrack()}>
							<SkipForward size={24} />
						</button>
						<button class="btn btn-icon btn-icon-sm variant-ghost" on:click={handleRepeat}>
							{#if repeat === 0 || repeat === 1}
								<Repeat size={16} class={repeat === 0 ? '' : 'text-secondary-500'} />
							{:else}
								<Repeat1 size={16} class="text-secondary-500" />
							{/if}
						</button>
					</div>
					<div class="gap-1 items-center hidden md:flex">
						<button
							class="btn btn-icon"
							on:click={() => {
								if (volume === 0) {
									player.setVolume(0.5);
									volume = 0.5;
								} else {
									player.setVolume(0);
									volume = 0;
								}
							}}
						>
							{#if volume > 0 && volume <= 0.5}
								<Volume1 size={24} />
							{:else if volume > 0.5}
								<Volume2 size={24} />
							{:else}
								<VolumeX size={24} />
							{/if}
						</button>
						<RangeSlider
							name="player-volume"
							on:change={handleVolumeChange}
							bind:value={volume}
							max={1}
							step={0.001}
						/>
					</div>
				</div>
				<div class="grow w-full">
					<RangeSlider
						name="player-timeline"
						max={1}
						value={trackPosition / trackDuration}
						on:change={handleSeek}
						step={0.001}
					/>
					<div class="flex justify-between">
						<p class="text-sm text-surface-400">{formatDuration(trackPosition)}</p>
						<p class="text-sm text-surface-400">{formatDuration(trackDuration)}</p>
					</div>
				</div>
			</div>
			<span class="md:hidden inline col-span-2 pb-4">
				<Lyrics currentTrackUri={uris.track} {trackPosition} />
			</span>
		</div>
	{:else}
		<div>
			<h1 class="text-5xl mb-2">Nothing Playing</h1>
			<div class="text-3xl text-surface-400">
				<p>Get the party going!</p>
				<p>- Open Spotify</p>
				<p>- Play a song</p>
				<div class="flex items-center gap-2">
					<p>- Click the</p>
					<MonitorSpeaker />
					<p>button</p>
				</div>
				<p>- Click on "Lyric Thing" in the popup menu</p>
				<p>- Enjoy!</p>
			</div>
		</div>
	{/if}
</main>
