export class HttpError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'HttpError';
    this.status = 500;
  }

}
export class BadRequestError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "BadRequestError";
    this.status = 400;
  }

}
export class UnauthorizedError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "UnauthorizedError";
    this.status = 401;
  }

}
export class PaymentRequiredError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "PaymentRequiredError";
    this.status = 402;
  }

}
export class ForbiddenError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "ForbiddenError";
    this.status = 403;
  }

}
export class NotFoundError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "NotFoundError";
    this.status = 404;
  }

}
export class MethodNotAllowedError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "MethodNotAllowedError";
    this.status = 405;
  }

}
export class NotAcceptableError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "NotAcceptableError";
    this.status = 406;
  }

}
export class ProxyAuthenticationRequiredError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "ProxyAuthenticationRequiredError";
    this.status = 407;
  }

}
export class RequestTimeoutError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "RequestTimeoutError";
    this.status = 408;
  }

}
export class ConflictError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "ConflictError";
    this.status = 409;
  }

}
export class GoneError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "GoneError";
    this.status = 410;
  }

}
export class LengthRequiredError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "LengthRequiredError";
    this.status = 411;
  }

}
export class PreconditionFailedError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "PreconditionFailedError";
    this.status = 412;
  }

}
export class PayloadTooLargeError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "PayloadTooLargeError";
    this.status = 413;
  }

}
export class UriTooLongError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "UriTooLongError";
    this.status = 414;
  }

}
export class UnsupportedMediaTypeError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "UnsupportedMediaTypeError";
    this.status = 415;
  }

}
export class RangeNotSatisfiableError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "RangeNotSatisfiableError";
    this.status = 416;
  }

}
export class ExpectationFailedError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "ExpectationFailedError";
    this.status = 417;
  }

}
export class MisdirectedRequestError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "MisdirectedRequestError";
    this.status = 421;
  }

}
export class UnprocessableEntityError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "UnprocessableEntityError";
    this.status = 422;
  }

}
export class LockedError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "LockedError";
    this.status = 423;
  }

}
export class FailedDependencyError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "FailedDependencyError";
    this.status = 424;
  }

}
export class TooEarlyError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "TooEarlyError";
    this.status = 425;
  }

}
export class UpgradeRequiredError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "UpgradeRequiredError";
    this.status = 426;
  }

}
export class PreconditionRequiredError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "PreconditionRequiredError";
    this.status = 428;
  }

}
export class TooManyRequestsError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "TooManyRequestsError";
    this.status = 429;
  }

}
export class RequestHeaderFieldsTooLargeError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "RequestHeaderFieldsTooLargeError";
    this.status = 431;
  }

}
export class UnavailableForLegalReasonsError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "UnavailableForLegalReasonsError";
    this.status = 451;
  }

}
export class InternalServerError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "InternalServerError";
    this.status = 500;
  }

}
export class NotImplementedError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "NotImplementedError";
    this.status = 501;
  }

}
export class BadGatewayError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "BadGatewayError";
    this.status = 502;
  }

}
export class ServiceUnavailableError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "ServiceUnavailableError";
    this.status = 503;
  }

}
export class GatewayTimeoutError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "GatewayTimeoutError";
    this.status = 504;
  }

}
export class HttpVersionNotSupportedError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "HttpVersionNotSupportedError";
    this.status = 505;
  }

}
export class VariantAlsoNegotiatesError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "VariantAlsoNegotiatesError";
    this.status = 506;
  }

}
export class InsufficientStorageError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "InsufficientStorageError";
    this.status = 507;
  }

}
export class LoopDetectedError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "LoopDetectedError";
    this.status = 508;
  }

}
export class NotExtendedError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "NotExtendedError";
    this.status = 510;
  }

}
export class NetworkAuthenticationRequiredError extends HttpError {
  constructor(msg) {
    super(msg);
    this.name = "NetworkAuthenticationRequiredError";
    this.status = 511;
  }

}