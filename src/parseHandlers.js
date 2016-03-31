const routeRegex = /^(GET|POST|PUT|DELETE) ([a-zA-Z0-9\/\-_:]+)$/;

export default (handlers) =>
  Object.keys(handlers).map(route => {
    const match = route.match(routeRegex);
    if (!match) throw new Error(`Bad route: ${route}`);

    const [, method, url] = match;
    return {
      method: method.toLowerCase(),
      url,
      handler: handlers[route],
    };
  });
