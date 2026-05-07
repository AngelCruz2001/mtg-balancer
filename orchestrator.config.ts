// Copy this to orchestrator.config.ts in the root of your target project.
// The orchestrator reads it automatically when pointing at your project.

export default {
  projectName: 'mtg-deck-balancer',       // shown in the dashboard header
  ticketsDir: 'docs/tickets',  // where your TICK-NNN-*.md files live
  baseBranch: "main",           // the branch you want to merge into (default: master)
  
  port: 3141,                  // dashboard port (default: 3141)
  validate: [
    { name: 'typecheck', cmd: 'pnpm exec tsc --noEmit' },
    { name: 'build',     cmd: 'pnpm build' },
    // { name: 'test',   cmd: 'pnpm test --run' },
  ],
}
