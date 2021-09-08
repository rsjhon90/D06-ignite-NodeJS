import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { validate as isUuid } from 'uuid';

let createUserUseCase: CreateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe('Create User use case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
  })


  it('Should be able create a new User', async () => {
    const user = await createUserUseCase.execute({
      name: 'John',
      email: 'john@example.com',
      password: '1234'
    })

    expect(user).toBeDefined()
    expect(user).toHaveProperty('id')
    expect(isUuid(user.id as string)).toBeTruthy()
  })

  it('Should not be able create a new user with same email', async () => {
    await createUserUseCase.execute({
      name: 'John',
      email: 'john@example.com',
      password: '1234'
    })

    expect(async () => {
      await createUserUseCase.execute({
        name: 'Mark',
        email: 'john@example.com',
        password: '4321'
      })
    }).rejects.toBeInstanceOf(CreateUserError)
  })

  it('Should be able to encrypt password', async () => {
    const user = await createUserUseCase.execute({
      name: 'John',
      email: 'john@example.com',
      password: '1234'
    })

    expect(user.password).not.toEqual('1234')
  })
})
