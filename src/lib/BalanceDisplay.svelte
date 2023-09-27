<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { pb } from './pocketbase';
	import { page } from '$app/stores';
	import { getCheckoutLink } from './stripeHelpers';
	import type { RecordModel } from 'pocketbase';

	const { session } = $page.data;
	let userRecord: RecordModel | null;
	$: balance = userRecord?.balance ?? 0;
	pb.collection('users')
		.getFirstListItem(`spotifyId = '${session?.user?.providerAccountId}'` ?? '')
		.then((record) => (userRecord = record));
</script>

<main class="flex gap-2 items-center">
	{#if session && balance}
		<p class="font-semibold text-2xl">
			Balance: ${balance.toFixed(2)}
		</p>
		<button
			class="btn btn-icon w-auto p-1 variant-filled-primary"
			on:click={async () => await getCheckoutLink()}><Plus size={16} /></button
		>
	{/if}
</main>
