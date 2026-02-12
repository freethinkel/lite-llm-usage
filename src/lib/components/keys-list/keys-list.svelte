<script lang="ts">
  import type { KeyInfo } from "$lib/types";
  import { KeyItem } from "$lib/components/key-item";

  interface Props {
    keys: KeyInfo[];
  }

  let { keys }: Props = $props();
</script>

{#if keys.length > 0}
  <section class="keys-section">
    <h2>API Keys</h2>
    <ul class="keys-list">
      {#each keys as key (key.key_alias)}
        <KeyItem keyInfo={key} />
      {/each}
    </ul>
  </section>
{/if}

<style>
  .keys-section h2 {
    font-size: 0.625rem;
    font-weight: 500;
    margin: 0 0 8px 0;
    color: oklch(from var(--color-text) l c h / 0.35);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .keys-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
</style>
