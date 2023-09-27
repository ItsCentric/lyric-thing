export async function getCheckoutLink() {
	const checkoutSessionResponse = await fetch('payment/create-checkout-session', {
		method: 'POST'
	});
	const url = await checkoutSessionResponse.json();
	window.location.replace(url);
}
