// Promise that resolves to a fetch implementation: global fetch (Node >=18) or node-fetch if available.
const impl = (async () => {
  if (typeof fetch !== 'undefined') return fetch;
  try {
    const mod = await import('node-fetch');
    return mod.default || mod;
  } catch (e) {
    throw new Error('fetch is not available. Use Node >=18 or install node-fetch.');
  }
})();

module.exports = impl;

