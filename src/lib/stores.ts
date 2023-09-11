import { writable } from 'svelte/store';

type TrackQueue = {
	previous: Spotify.Track[];
	current?: {
		name: string;
		artists: string[];
		cover: string;
		uris: { track: string; artists: string[] };
	};
	next: Spotify.Track[];
};
export const trackQueue = writable<TrackQueue>({ previous: [], next: [] });
