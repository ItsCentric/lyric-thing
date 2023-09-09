<script lang="ts">
	import '../app.postcss';
	import { AppBar, AppShell } from '@skeletonlabs/skeleton';
	import type { LayoutData } from './$types';
	import { signIn, signOut } from '@auth/sveltekit/client';

	export let data: LayoutData;
</script>

<AppShell slotHeader="opacity-0 hover:opacity-100 transition-opacity">
	<svelte:fragment slot="header">
		<AppBar background="bg-transparent">
			<svelte:fragment slot="trail">
				{#if data.session}
					<button class="btn variant-filled-error ml-auto" on:click={() => signOut()}
						>Sign out</button
					>
				{:else}
					<button class="btn variant-filled-error ml-auto" on:click={() => signIn('spotify')}
						>Sign in with Spotify</button
					>
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<slot />
</AppShell>
