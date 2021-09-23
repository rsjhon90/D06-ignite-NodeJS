import { hash } from "bcryptjs";
import { v4 as uuidV4 } from "uuid";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementTransferError } from "./CreateStatementTransferError";
import { CreateStatementTransferUseCase } from "./CreateStatementTransferUseCase";


describe('Create statement transfer operation', () => {
  let createStatementTransferUseCase: CreateStatementTransferUseCase;
  let inMemoryUsersRepository: InMemoryUsersRepository;
  let inMemoryStatementsRepository: InMemoryStatementsRepository;

  let senderUser: {
    id?: string;
    name: string;
    email: string;
    password: string;
  }
  let receiverUser: {
    id?: string;
    name: string;
    email: string;
    password: string;
  }
  enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
    TRANSFER = 'transfer',
  }

  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementTransferUseCase = new CreateStatementTransferUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );

    senderUser = await inMemoryUsersRepository.create({
      name: 'John',
      email: 'john@example.com',
      password: await hash('1234', 8)
    })

    receiverUser = await inMemoryUsersRepository.create({
      name: 'Randy Soto',
      email: 'ribcu@cokah.td',
      password: await hash('4321', 8)
    })

   await inMemoryStatementsRepository.create({
      user_id: senderUser.id as string,
      amount: 750,
      description: 'Daily consumption',
      type: OperationType['DEPOSIT'],
    })
  })

  it('Should be able to register a transfer of an amount for other user account',
  async () => {
    const statementOperation = await createStatementTransferUseCase.execute({
      sender_id: senderUser.id as string,
      receiver_id: receiverUser.id as string,
      amount: 150,
      description: 'service payment'
    })

    await createStatementTransferUseCase.execute({
      sender_id: receiverUser.id as string,
      receiver_id: senderUser.id as string,
      amount: 50,
      description: 'service payment'
    })

    await inMemoryStatementsRepository.create({
      type: OperationType['WITHDRAW'],
      user_id: senderUser.id as string,
      amount: 100,
      description: 'test'
    })

    expect(statementOperation).toHaveProperty('id');
    expect(statementOperation.type).toEqual(OperationType['TRANSFER'])
  })

  it('Should not be able to register a transfer if insufficient funds',
  async () => {
    await expect(
      createStatementTransferUseCase.execute({
        sender_id: senderUser.id as string,
        receiver_id: receiverUser.id as string,
        amount: 751,
        description: 'service payment'
      })
    ).rejects.toEqual(new CreateStatementTransferError.InsufficientFunds())
  })

  it('Should throw an error if sender does not exists', async () => {
    await expect(
      createStatementTransferUseCase.execute({
        sender_id: uuidV4(),
        receiver_id: receiverUser.id as string,
        amount: 150,
        description: 'service payment'
      })
    ).rejects.toEqual(new CreateStatementTransferError.SenderNotFound())
  })

  it('Should throw an error if receiver does not exists', async () => {
    await expect(
      createStatementTransferUseCase.execute({
        sender_id: senderUser.id as string,
        receiver_id: uuidV4(),
        amount: 150,
        description: 'service payment'
      })
    ).rejects.toEqual(new CreateStatementTransferError.ReceiverNotFound())
  })

  it('Should throw an error if the sender is the same as the receiver', async () => {
    await expect(
      createStatementTransferUseCase.execute({
        sender_id: senderUser.id as string,
        receiver_id: senderUser.id as string,
        amount: 150,
        description: 'service payment'
      })
    ).rejects.toEqual(new CreateStatementTransferError.SameFavoredUser())
  })
})
