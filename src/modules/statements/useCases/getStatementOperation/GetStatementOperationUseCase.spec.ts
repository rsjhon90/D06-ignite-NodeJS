import { hash } from "bcryptjs";
import { v4 as uuidV4 } from "uuid";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

describe('Get statement operation use case', () => {
  let inMemoryUsersRepository: InMemoryUsersRepository;
  let inMemoryStatementsRepository: InMemoryStatementsRepository;
  let getStatementOperationUseCase: GetStatementOperationUseCase;
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
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    )

    user = await inMemoryUsersRepository.create({
      name: 'John',
      email: 'john@example.com',
      password: await hash('1234', 8)
    })
  })

  it('Should be able to return a specific statement operation from the user account',
  async () => {
    const operation = await inMemoryStatementsRepository.create({
      user_id: user.id as string,
      amount: 500.60,
      type: OperationType['DEPOSIT'],
      description: 'Daily consumption',
    })

    const statementOperation = await getStatementOperationUseCase.execute({
      statement_id: operation.id as string,
      user_id: user.id as string,
    })

    expect(statementOperation).toMatchObject(operation)
  })

  it('Should be able to throw an error if the user does not exists', async () => {
    const operation = await inMemoryStatementsRepository.create({
      user_id: user.id as string,
      amount: 500.60,
      type: OperationType['DEPOSIT'],
      description: 'Daily consumption',
    })

    expect(async () => {
      await getStatementOperationUseCase.execute({
        statement_id: operation.id as string,
        user_id: uuidV4(),
      })
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)
  })

  it('Should be able to throw an error if the statement operation does not exists', async () => {
    await inMemoryStatementsRepository.create({
      user_id: user.id as string,
      amount: 500.60,
      type: OperationType['DEPOSIT'],
      description: 'Daily consumption',
    })

    expect(async () => {
      await getStatementOperationUseCase.execute({
        statement_id: uuidV4(),
        user_id: user.id as string,
      })
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)
  })
})
