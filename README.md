# mg-express
Express stuff used on all musicglue services

Automatically sets up logging, error handling, error reporting, and a bunch of other goodness.

# Usage:

```js
import setup from '@musicglue/mg-express';
import { UnprocessableEntityError } from '@musicglue/mg-express/lib/errors';

class UnmountableHorseError extends UnprocessableEntityError {
  constructor(msg) {
    super(msg);
    this.name = 'UnmountableHorseError';
  }
}

export default setup({
  name: 'horse service',
  bugsnag: 'abchorse',
  amazonJSON: true, // enable amazonian horses
  beforeHandlers: (app) => app.use(customHorseRelatedMiddleware()),
  handlers: (app, wrap) => {
    app.get('/horses', wrap(() =>
      Horses.list().then(horses => ({ payload: horses }))));
    app.post('/horses', wrap(({ body }) =>
      Horses.create(body).then(horse => ({ payload: horse, status: 201 }))));
    app.put('/horses/:horseId/mount', wrap(({ params }) => {
      throw new UnmountableHorseError('woah there!');
    }));
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

### bugsnagIgnore - Array<string> - default `[]`
A list of error names that bugsnag should ignore rather than report. e.g.

```js
bugsnagIgnore: [
  'BadRequestError',
  'NotFoundError',
],
```

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

### afterHandlers - function(app) - default `() => null`
Hook called after the handlers are attached, but before the error handling middleware.

### after - function(app) - default `() => null`
Hook called after the app is finished being set up, immediately before it starts listening.

## errors
```js
import * from '@musicglue/mg-express/lib/errors';
```

mg-express has an automatically generated error class for every HTTP response code listed on
http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml

These classes set the name and status required for compatibility with api-error-handler, the
default error handler used by mg-express. To return one of these errors, throw it anywhere in your
handler promise chain. If you want to return a non-200 status code without throwing one of these
errors, have your handler promise resolve to an object with a status property with the status code
you want to use.
