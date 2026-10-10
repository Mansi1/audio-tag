// ChevronIcon: the down chevron of the accordions (default class) and of Combobox (class "select-chevron").
// VERIFIED: make e2e opens the accordions and checks the Combobox styles that place and turn it.
import type { Props } from "defuss";

export const ChevronIcon = ({ class: className = "accordion-chevron" }: Props & { class?: string }) => (
  <svg class={className} aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg>
);
