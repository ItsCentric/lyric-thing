import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripeClient } from '$lib/stripeClient';
import type Stripe from 'stripe';

export const POST: RequestHandler = async ({ url, locals }) => {
	const session = await locals.getSession();
	if (!session?.user?.providerAccountId) throw error(401, 'Unauthorized');
	try {
		const checkoutSession = await stripeClient.checkout.sessions.create({
			line_items: [
				{
					price: 'price_1NsGmhAu7N5FrOWFaiIOgkzE',
					quantity: 1
				}
			],
			mode: 'payment',
			success_url: `${url.origin}?checkoutSuccess=true`,
			cancel_url: `${url.origin}?checkoutSuccess=false`,
			automatic_tax: { enabled: true },
			metadata: {
				userInfo: JSON.stringify({ id: session.user.providerAccountId, email: session.user.email })
			}
		});
		if (!checkoutSession.url) throw error(500, 'No checkout session url');
		return json(checkoutSession.url);
	} catch (err) {
		const stripeError = err as Stripe.errors.StripeAPIError;
		throw error(stripeError.statusCode || 500, stripeError.message);
	}
};
