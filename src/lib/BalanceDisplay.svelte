<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { pb } from './pocketbase';
	import { page } from '$app/stores';
	import { getCheckoutLink } from './stripeHelpers';
	import type { RecordModel } from 'pocketbase';
	import { onDestroy } from 'svelte';

	const { session } = $page.data;
	let userRecord: RecordModel | null;
	$: balance = userRecord?.balance ?? 0;
	$: if (session?.user) {
		pb.collection('users')
			.getFirstListItem(`spotifyId = '${session.user.providerAccountId}'`)
			.then((record) => (userRecord = record));
	}
	$: if (userRecord)
		pb.collection('users').subscribe(userRecord.id, (res) => (balance = res.record.balance));

	onDestroy(async () => {
		if (userRecord) await pb.collection('users').unsubscribe(userRecord.id);
	});
</script>

<main class="flex gap-2 items-center">
	{#if session && balance != null}
		<p class="font-semibold text-xl">
			Current Balance: ${balance.toFixed(2)}
		</p>
		<button
			class="btn btn-icon w-auto p-1 variant-filled-primary"
			on:click={async () => await getCheckoutLink()}><Plus size={16} /></button
		>
	{/if}
</main>
