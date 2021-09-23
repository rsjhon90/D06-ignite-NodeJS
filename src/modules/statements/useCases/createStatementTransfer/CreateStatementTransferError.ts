import { AppError } from "../../../../shared/errors/AppError";

export namespace CreateStatementTransferError {
  export class SenderNotFound extends AppError {
    constructor() {
      super('User not found', 404);
    }
  }

  export class InsufficientFunds extends AppError {
    constructor() {
      super('Insufficient funds', 400);
    }
  }

  export class ReceiverNotFound extends AppError {
    constructor () {
      super('Receiver not found', 404)
    }
  }

  export class SameFavoredUser extends AppError {
    constructor () {
      super('You cannot transfer to yourself.', 400)
    }
  }
}
