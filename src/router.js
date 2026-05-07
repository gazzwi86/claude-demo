function compilePattern(pattern) {
  const keys = [];
  const regexStr = pattern
    .replace(/\/$/, "")
    .replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => {
      keys.push(name);
      return "([^/]+)";
    });
  return { regex: new RegExp(`^${regexStr || "/"}/?$`), keys };
}

function createRouter() {
  const routes = [];

  function add(method, pattern, handler) {
    const { regex, keys } = compilePattern(pattern);
    routes.push({ method: method.toUpperCase(), regex, keys, handler });
  }

  function match(method, pathname) {
    for (const route of routes) {
      if (route.method !== method.toUpperCase()) continue;
      const m = route.regex.exec(pathname);
      if (!m) continue;
      const params = {};
      route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { handler: route.handler, params };
    }
    return null;
  }

  return {
    add,
    match,
    get: (p, h) => add("GET", p, h),
    post: (p, h) => add("POST", p, h),
    put: (p, h) => add("PUT", p, h),
    patch: (p, h) => add("PATCH", p, h),
    delete: (p, h) => add("DELETE", p, h),
  };
}

module.exports = { createRouter, compilePattern };
