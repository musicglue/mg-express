# mg-express
Express stuff used on all musicglue services

Automatically sets up logging, error handling, error reporting, and a bunch of other goodness.

# Usage:

```js
import setup from 'mg-express';

class UnmountableHorseError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'UnmountableHorseError';
    this.status = 422;
  }
}

export default setup({
  name: 'horse service',
  bugsnag: 'abchorse',
  amazonJSON: true, // enable amazonian horses
  beforeHandlers: (app) => app.use(customHorseRelatedMiddleware()),
  handlers: {
    'GET /horses': () =>
      Horses.list().then(horses => ({ payload: horses })),
    'POST /horses': ({ body }) =>
      Horses.create(body).then(horse => ({ payload: horse, status: 201 })),
    'PUT /horses/:horseId/mount': ({ params }) => {
      throw new UnmountableHorseError('woah there!');
    },
  },
});
```

## options:

### name - string
Name of the service. If provided, the service will serve this string on `GET /`.

### defaultPort - number
Port to use if there's no `process.env.PORT`.

### bugsnag - string
Bugsnag key. If provided and the service isn't in test mode, it'll setup bugsnag and attach it
to the express app

### ping - string - default `'/_____ping_____'`
Ping URL. If provided, the service will serve `OK` on get requests to this route.

### logFormat - string - default `'short'`
Morgan log format. Morgan logging is disabled in test mode.

### defaultContentType - string - default `'application/json'`
If the content-type header isn't set, default it to this. Set to something falsey to disable.

### amazonJSON - boolean - default `false`
Flag to turn on the amazon json middleware. If the user-agent looks like an amazon one, it sets
the content-type header to `'application/json'`.

### bodyParser - middleware - default `bodyParser.json()`
Body parsing middleware to use by default. Pass something falsey to disable body parsing.

### errorHandler - middleware - default `apiErrorHandler()`
Middleware for handling errors.

### before - function(app) - default `() => null`
Hook called before any default middleware are setup up, for custom things.

### beforeHandlers - function(app) - default `() => null`
Hook called after the first set of middleware are set up, but before the handlers are attached.

### handlers - function(app, wrap)
Hook called for attaching handlers. App is your express app, wrap is a useful function for
wrapping handlers to hook into the rest of mg-express's goodness. Handlers wrapped with `wrap`
should take one argument (the request object) and return a Promise of
`{ payload: ?Object, status: ?number }`. `payload` defaults to `{}`, `status` defaults to `200`.

### handlers - `{ [route: string]: (req: Request) => Promise<{status, payload}> }`
The recommended way of setting handlers, as shown in the example above. All handlers of this type
are automatically `wrap`d

### afterHandlers - function(app) - default `() => null`
Hook called after the handlers are attached, but before the error handling middleware.

### after - function(app) - default `() => null`
Hook called after the app is finished being set up, immediately before it starts listening.

