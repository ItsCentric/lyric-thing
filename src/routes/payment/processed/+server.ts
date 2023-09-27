import { STRIPE_WEBHOOK_SIGNATURE } from '$env/static/private';
import { pb } from '$lib/pocketbase';
import { stripeClient } from '$lib/stripeClient';
import { error, type RequestHandler } from '@sveltejs/kit';
import type { ClientResponseError } from 'pocketbase';
import type Stripe from 'stripe';

export const POST: RequestHandler = async ({ request }) => {
	const stripeSignature = request.headers.get('stripe-signature');
	if (!stripeSignature) throw error(401, 'Unauthorized');
	const requestBody = await request.text();

	try {
		const event = stripeClient.webhooks.constructEvent(
			requestBody,
			stripeSignature,
			STRIPE_WEBHOOK_SIGNATURE
		);
		if (event.type === 'checkout.session.completed') {
			const dataObject: { id: string } = event.data.object as { id: string };
			const sessionWithLineItems = await stripeClient.checkout.sessions.retrieve(dataObject.id, {
				expand: ['line_items']
			});
			if (!sessionWithLineItems.metadata?.userInfo) throw error(401, 'Unauthorized');
			const user = JSON.parse(sessionWithLineItems.metadata?.userInfo) as {
				id: string;
				email: string;
			};
			const lineItems = sessionWithLineItems.line_items;
			if (!lineItems) throw error(500, 'No items purchased');
			const saleData = lineItems.data[0];
			const amountPaid = saleData.amount_total - saleData.amount_tax;
			try {
				const pbUser = await pb.collection('users').getFirstListItem(`spotifyId = '${user.id}'`);
				await pb.collection('users').update(pbUser.id, {
					spotifyId: user.id,
					email: user.email,
					'balance+': amountPaid / 100
				});
			} catch (err) {
				const pbError = err as ClientResponseError;
				console.log(pbError);
				throw error(pbError.status, pbError.message);
			}
		}
	} catch (err) {
		const stripeError = err as Stripe.errors.StripeSignatureVerificationError;
		console.log(stripeError);
		throw error(stripeError.statusCode || 500, stripeError.message);
	}

	return new Response();
};
