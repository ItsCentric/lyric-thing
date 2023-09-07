<script lang="ts">
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
</script>

{#if $page.data.session}
	<main class="flex flex-col h-full justify-center items-center gap-2">
		<h1 class="text-4xl">Hey {$page.data.session.user?.name}!</h1>
		<button class="btn variant-filled-error" on:click={() => signOut()}>Sign out</button>
	</main>
{:else}
	<main class="flex flex-col h-full justify-center items-center gap-2">
		<h1 class="text-4xl">Hey stranger!</h1>
		<button class="btn variant-filled-success" on:click={() => signIn('spotify')}
			>Sign in with Spotify</button
		>
	</main>
{/if}
