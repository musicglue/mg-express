import sanitise from './textSanitiser';

export default function sanitiseBugsnag(notification) {
  // bugsnag requires us to mutation the supplied object rather than returning
  // a different notification object.

  if (!notification.events) return notification;

  notification.events = notification.events.map(event => { // eslint-disable-line no-param-reassign
    if (!event.exceptions) return event;

    return {
      ...event,
      exceptions: event.exceptions.map(exception => {
        if (!exception.message) return exception;

        return {
          ...exception,
          message: sanitise(exception.message),
        };
      }),
    };
  });

  return notification;
}
