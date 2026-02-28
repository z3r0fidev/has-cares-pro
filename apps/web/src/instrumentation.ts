export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    try {
      // @sentry/nextjs is an optional dependency; install it once Next 16 support lands
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('@sentry/nextjs') as { init: (opts: Record<string, unknown>) => void };
      Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
    } catch {
      // Package not installed — Sentry is opt-in
    }
  }
}
