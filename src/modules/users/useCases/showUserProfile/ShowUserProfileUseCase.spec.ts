import { hash } from "bcryptjs";
import { v4 as uuidV4 } from "uuid";

import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let showUserProfileUseCase: ShowUserProfileUseCase;
let user: {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
}

describe('Show profile use case', () => {
  const testId = uuidV4()

  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository)

    user = await inMemoryUsersRepository.create({
      name: 'John',
      email: 'john@example.com',
      password: await hash('1234', 8)
    })
  })

  it('Should be able to return user by id', async () => {
    const userResponse = await showUserProfileUseCase.execute(user.id as string)

    expect(userResponse).toEqual(expect.objectContaining(user))
  })

  it('Should be able to report an error when not finding a user.', async () => {
    expect(async () => {
      await showUserProfileUseCase.execute(testId)
    }).rejects.toBeInstanceOf(ShowUserProfileError)
  })
})
