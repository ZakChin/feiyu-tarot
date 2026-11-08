/** Small interpolation helpers shared by the panel. */

export function fill(template, vars) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!vars || vars[key] === undefined || vars[key] === null) return match;
    return String(vars[key]);
  });
}

export function tr(t, key, vars) {
  try {
    return fill(t(key), vars);
  } catch (error) {
    return key;
  }
}

export function makeFallbackT(dict) {
  const source = dict || {};
  return (key) => (source[key] === undefined ? key : source[key]);
}
