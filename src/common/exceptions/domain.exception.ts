import { GraphQLError } from "graphql";
import { ApplicationException } from "./application.exception";

export const MapGraphQLError = (error: ApplicationException) => {
  throw new GraphQLError(error.message || "internal server error", {
    extensions: {
      statusCode: error.statusCode,
    },
  });
};
export class BadRequestException extends ApplicationException {
  constructor(message: string = "BadRequestException", options?: ErrorOptions) {
    super(message, 400, options);
  }
}

export class NotFoundException extends ApplicationException {
  constructor(message: string = "NotFoundException", options?: ErrorOptions) {
    super(message, 404, options);
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string = "ConflictException", options?: ErrorOptions) {
    super(message, 409, options);
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string = "ForbiddenException", options?: ErrorOptions) {
    super(message, 403, options);
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(
    message: string = "UnauthorizedException",
    options?: ErrorOptions
  ) {
    super(message, 401, options);
  }
}
