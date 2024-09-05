export async function getCheckoutLink() {
	const checkoutSessionResponse = await fetch('payment/create-checkout-session', {
		method: 'POST'
	});
	const urlJson = await checkoutSessionResponse.json();
	window.location.replace(urlJson.url);
}
