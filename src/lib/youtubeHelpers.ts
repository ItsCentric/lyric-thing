import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ytsr from 'ytsr';

export async function searchForSong(uri: string, accessToken: string) {
	const trackId = uri.split(':')[2];
	if (!trackId) throw new Error('Invalid URI');
	const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	if (!trackRes.ok) throw new Error('Failed to fetch track');
	const trackData: SpotifyApi.TrackObjectFull = await trackRes.json();
	const youtubeResults = await ytsr(
		`${trackData.name} ${trackData.artists.map((artist) => artist.name).join(' ')} audio`,
		{
			limit: 1
		}
	);
	const youtubeResult = youtubeResults.items[0];
	if (youtubeResult.type !== 'video') throw new Error('No video found');
	const video = youtubeResult as ytsr.Video;

	return video;
}

export async function downloadAsAudioInMemory(url: string) {
	const options: ytdl.downloadOptions = {
		quality: 'highestaudio'
	};
	const videoReadableStream = ytdl(url, options);
	const mp3Data: never[] = [];
	const youtubeDownloadPromise = new Promise((resolve: (value: Buffer) => void, reject) => {
		const ffmpegCommand = ffmpeg(videoReadableStream)
			.format('mp3')
			.audioBitrate(128)
			.on('error', (error) => {
				console.error(`Error: ${error}`);
				reject(error);
			})
			.on('end', async () => {
				const mp3Buffer = Buffer.concat(mp3Data);

				resolve(mp3Buffer);
			});

		const mp3ReadableStream = ffmpegCommand.pipe();

		mp3ReadableStream.on('data', (chunk) => {
			mp3Data.push(chunk as never);
		});
	});

	return youtubeDownloadPromise;
}
