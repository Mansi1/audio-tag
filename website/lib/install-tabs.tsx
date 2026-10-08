// The install command per package manager, as tabs. VERIFIED: the start page and the docs show the same one
// (the user asked for it), so the commands and markup live here once.
import { CodeBlock } from "./code-block.tsx";

const MANAGERS: [string, string][] = [["npm", "npm install audio-tag"], ["pnpm", "pnpm add audio-tag"], ["yarn", "yarn add audio-tag"], ["bun", "bun add audio-tag"]];

export function InstallTabs() {
  return (
    <div class="tabs install-tabs">
      <div class="tab-list" role="tablist" aria-label="Package manager">
        {MANAGERS.map(([pm], i) => (
          <button class="tab-trigger" role="tab" aria-selected={String(i === 0)} aria-controls={`pm-${pm}`} id={`tab-${pm}`} tabindex={i === 0 ? undefined : "-1"}>{pm}</button>
        ))}
      </div>
      {MANAGERS.map(([pm, cmd], i) => (
        <div class="tab-content" role="tabpanel" id={`pm-${pm}`} aria-labelledby={`tab-${pm}`} tabindex="0" hidden={i > 0}>
          <CodeBlock code={cmd} />
        </div>
      ))}
    </div>
  );
}
