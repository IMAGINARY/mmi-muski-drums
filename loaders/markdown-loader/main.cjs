/**
 * Provides a CommonJS wrapper for Webpack
 */

async function wrapper(...args) {
  // eslint-disable-next-line import/extensions
  const { markdownLoader } = await import('./markdown-loader.mjs');

  return markdownLoader.call(this, ...args);
}

module.exports = wrapper;
