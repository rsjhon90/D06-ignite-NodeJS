import request from 'supertest';
import { Connection } from "typeorm";
import { v4 as uuidV4 } from 'uuid';
import { hash } from 'bcryptjs';

import createConnection from '../database';
import { app } from '../app';

let connection: Connection;

describe('Authenticate User integration tests', () => {
  const id = uuidV4();

  beforeAll(async () => {
    const password = await hash('1234', 8)
    connection = await createConnection();
    try {
      await connection.runMigrations()

      await connection.query(`INSERT INTO users(id, name, email, password, created_at, updated_at)
      values('${id}', 'john', 'john@example.com', '${password}', 'NOW()', 'NOW()')`);

    } catch (err) {
      console.error(err)
    }
  })

  afterAll(async () => {
    await connection.dropDatabase();

    await connection.close()
  })

  it('POST - Should be able to log in and return JWT token', async () => {
    const response = await request(app).post('/api/v1/sessions')
      .send({
        email: 'john@example.com',
        password: '1234'
      })

    expect(response.status).toBe(200)
    expect(response.body).toBeDefined()
    expect(response.body).toHaveProperty('token')
    expect(response.body.user).toEqual(expect.objectContaining({ id }))
  })

  it('POST - Should not be able to authenticate with incorrect email', async () => {
    const response = await request(app).post('/api/v1/sessions')
    .send({
      email: 'john2@example.com',
      password: '1234'
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toEqual(expect.stringContaining('Incorrect'))
  })

  it('POST - Should not be able to authenticate with incorrect password', async () => {
    const response = await request(app).post('/api/v1/sessions')
    .send({
      email: 'john@example.com',
      password: '4321'
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toEqual(expect.stringContaining('Incorrect'))
  })
})
