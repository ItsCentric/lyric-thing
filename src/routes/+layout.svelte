<script lang="ts">
	import '../app.postcss';
	import { AppBar, AppShell, Modal, Toast } from '@skeletonlabs/skeleton';
	import { initializeStores } from '@skeletonlabs/skeleton';
	import { signIn, signOut } from '@auth/sveltekit/client';
	import type { LayoutData } from './$types';
	import BalanceDisplay from '$lib/BalanceDisplay.svelte';

	export let data: LayoutData;

	initializeStores();
</script>

<main class="h-full">
	<Modal />
	<Toast />
	<AppShell slotHeader="opacity-0 hover:opacity-100 transition-opacity">
		<svelte:fragment slot="header">
			<AppBar background="bg-transparent">
				<svelte:fragment slot="lead">
					{#if data.session}
						<BalanceDisplay />
					{/if}
				</svelte:fragment>
				<svelte:fragment slot="trail">
					{#if data.session}
						<button class="btn variant-filled-error ml-auto" on:click={() => signOut()}
							>Sign out</button
						>
					{:else}
						<button
							class="btn variant-filled-error ml-auto"
							on:click={async () => signIn('spotify')}>Sign in with Spotify</button
						>
					{/if}
				</svelte:fragment>
			</AppBar>
		</svelte:fragment>
		<slot />
	</AppShell>
</main>
