const VirtualTestNet = require("./scripts/virtual-test-net").default;
const wizardStart = require("./wizard").start;
const { terminal } = require("terminal-kit");

// Start the wizard with proper error handling
wizardStart().catch((error: any) => {
  terminal.red(`\n✗ Fatal error: ${error.message}\n`);
  if (error.stack) {
    terminal.dim(`${error.stack}\n`);
  }
  terminal("\nPress any key to exit...\n");
  terminal.on('key', () => {
    process.exit(1);
  });
});
