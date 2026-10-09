// CheckIcon: the check mark of the chosen values in a Combobox list.
// VERIFIED: make e2e checks which Combobox options carry it.
import type { Props } from "defuss";

export const CheckIcon = ({ class: className }: Props & { class?: string }) => (
  <svg class={className} aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
