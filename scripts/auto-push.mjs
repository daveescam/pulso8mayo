// Helper script to answer drizzle-kit push prompts non-interactively
// Run: node scripts/auto-push.mjs
import { spawn } from 'child_process';

const child = spawn('pnpm', ['db:push'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
});

// Answer "create table" (first option, up arrow + enter) to every prompt
// drizzle-kit uses the first option by default when enter is pressed
// We spam newlines to accept all defaults
const interval = setInterval(() => {
    child.stdin.write('\n');
}, 200);

child.on('close', (code) => {
    clearInterval(interval);
    process.exit(code);
});

setTimeout(() => {
    clearInterval(interval);
    child.kill();
}, 300000);
