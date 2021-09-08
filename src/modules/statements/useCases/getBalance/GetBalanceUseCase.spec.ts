import { hash } from "bcryptjs";
import { v4 as uuidV4 } from "uuid";

import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from './GetBalanceUseCase';

describe('Get Balance account use case', () => {
  let inMemoryUsersRepository: InMemoryUsersRepository;
  let inMemoryStatementsRepository: InMemoryStatementsRepository;
  let getBalanceUseCase: GetBalanceUseCase;
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
    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository,
    )

    user = await inMemoryUsersRepository.create({
      name: 'John',
      email: 'john@example.com',
      password: await hash('1234', 8)
    })
  })

  it("Should be able to list the user's account balance and statements", async () => {
    const operation1 = await inMemoryStatementsRepository.create({
      user_id: user.id as string,
      amount: 500.60,
      type: OperationType['DEPOSIT'],
      description: 'Daily consumption',
    })

    const operation2 = await inMemoryStatementsRepository.create({
      user_id: user.id as string,
      amount: 250.80,
      type: OperationType['WITHDRAW'],
      description: 'Daily consumption',
    })

    const userAccount = await getBalanceUseCase.execute({
      user_id: user.id as string
    })

    const diff = operation1.amount - operation2.amount;

    expect(userAccount.balance).toBe(diff)
    expect(userAccount.statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining(operation2)
      ])
    )
  })

  it('Should be able to throw an error if the user does not exists', async () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: uuidV4()
      })
    }).rejects.toBeInstanceOf(GetBalanceError)
  })
})
