import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementTransferError } from "./CreateStatementTransferError";
import { ICreateStatementTransferDTO } from "./ICreateStamentTransferDTO";

@injectable()
export class CreateStatementTransferUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository,
  ) {}

  async execute({
    sender_id,
    receiver_id,
    amount,
    description
  }: ICreateStatementTransferDTO){
    const senderUser = await this.usersRepository.findById(sender_id);

    if (!senderUser) {
      throw new CreateStatementTransferError.SenderNotFound()
    }

    if (sender_id === receiver_id) {
      throw new CreateStatementTransferError.SameFavoredUser();
    }

    const receiverUser = await this.usersRepository.findById(receiver_id);

    if (!receiverUser) {
      throw new CreateStatementTransferError.ReceiverNotFound();
    }

    const { balance } = await this.statementsRepository.getUserBalance({ user_id: sender_id })

    if (balance < amount) {
      throw new CreateStatementTransferError.InsufficientFunds();
    }

    const statementOperation = await this.statementsRepository.create({
      type: OperationType['TRANSFER'],
      sender_id,
      user_id: receiver_id,
      amount,
      description
    })

    return statementOperation;
  }
}
