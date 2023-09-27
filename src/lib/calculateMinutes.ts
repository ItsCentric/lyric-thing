export default function calculateMinutes(duration: number) {
	const minutes = duration / 60000;
	const fixedMinutesString = minutes.toFixed(2);
	return parseFloat(fixedMinutesString);
}
