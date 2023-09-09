export function formatDuration(duration: number): string {
	const minutes = Math.floor(duration / 60000);
	const seconds = Math.floor((duration % 60000) / 1000);

	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
