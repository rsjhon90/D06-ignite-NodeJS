import { hash } from "bcryptjs";
import { validate as isUuid, v4 as uuidV4 } from "uuid";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

describe('Create Statement use case', () => {
  let inMemoryUsersRepository: InMemoryUsersRepository;
  let inMemoryStatementsRepository: InMemoryStatementsRepository;
  let createStatementUseCase: CreateStatementUseCase;
  let user: {
    id?: string;
    name: string;
    email: string;
    password: string;
  }
  enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
  }

  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    )

    user = await inMemoryUsersRepository.create({
      name: 'John',
      email: 'john@example.com',
      password: await hash('1234', 8)
    })
  })

  it('Should be able to register a deposit of an amount for a user account', async () => {
    const operation = await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 500.60,
      type: OperationType['DEPOSIT'],
      description: 'Daily consumption',
    })

    expect(operation).toHaveProperty('id')
    expect(isUuid(operation.id as string)).toBeTruthy()
  })

  it('Should be able to register a withdraw of an amount from a user account', async () => {
    await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 500.60,
      type: OperationType['DEPOSIT'],
      description: 'Daily consumption',
    })

    const operation = await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 250.80,
      type: OperationType['WITHDRAW'],
      description: 'Daily consumption',
    })

    expect(operation).toHaveProperty('id')
    expect(isUuid(operation.id as string)).toBeTruthy()
  })

  it('Should not be able to register a withdraw if it exceeds the account amount', async () => {
    await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 500.60,
      type: OperationType['DEPOSIT'],
      description: 'Daily consumption',
    })

    expect(async () => {
      await createStatementUseCase.execute({
        user_id: user.id as string,
        amount: 680.80,
        type: OperationType['WITHDRAW'],
        description: 'Daily consumption',
      })
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
  })

  it('Should not be able to register an operation if the user does not exists', async () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: uuidV4(),
        amount: 360.80,
        type: OperationType['DEPOSIT'],
        description: 'Daily consumption',
      })
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
  })
})
