// src/utils/parseQuery.js

/**
 * Parse a query string into an object.
 *
 * @param {string} search - window.location.search
 * @returns {Record<string, string>}
 *
 * @example
 * parseQuery("?mock=admin&brand=Acme")
 * // { mock: "admin", brand: "Acme" }
 */
export function parseQuery(search = "") {
  const params = new URLSearchParams(search);
  /** @type {Record<string, string>} */
  const result = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}
