// src/utils/parseQuery.js

/**
 * Parse URL search string into an object
 *
 * @param {string} search
 * @returns {Record<string, string>}
 */
export function parseQuery(search = "") {
  const params = new URLSearchParams(search);
  const obj = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}
