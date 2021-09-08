import { hash } from "bcryptjs";
import { verify } from 'jsonwebtoken';

import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";
import authConfig from '../../../../config/auth';

let authenticateUserUseCase: AuthenticateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let user: {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
}

describe('Authenticate User use case', () => {
  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);

    user = await inMemoryUsersRepository.create({
      name: 'John',
      email: 'john@example.com',
      password: await hash('1234', 8)
    })
  })

  it('Should be able to authenticate with email and password', async () => {
    const userToken = await authenticateUserUseCase.execute({
      email: 'john@example.com',
      password: '1234'
    })

    expect(userToken).toBeDefined()
    expect(userToken.user).toEqual(expect.objectContaining({
      id: user.id,
      name: user.name
    }))
    expect(userToken.token).toBeDefined()
    expect(userToken.token.length).toBeGreaterThan(0)
  })

  it('Should not be able to authenticate with incorrect email', async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: 'john2@example.com',
        password: '1234'
      })
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })

  it('Should not be able to authenticate with incorrect password', async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: 'john@example.com',
        password: '4321'
      })
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })

  it('Token should be valid', async () => {
    const userToken = await authenticateUserUseCase.execute({
      email: 'john@example.com',
      password: '1234'
    })

    const { secret, } = authConfig.jwt;
    const tokenPayload = verify(userToken.token, secret)

    expect(tokenPayload).toEqual(expect.objectContaining({
      user,
      sub: user.id
    }))
  })
})
