// Jest mock for @tensorflow/* and @tensorflow-models/*
// The AIModerator uses these for content moderation but falls back to false on error.
// E2E tests do not exercise review moderation paths, so a no-op stub is sufficient.
module.exports = {};
