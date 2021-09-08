import request from 'supertest';
import { Connection } from 'typeorm';

import createConnection from '../database/index';
import { app } from '../app';

let connection: Connection;

describe('Create User integration tests', () => {
  beforeAll(async () => {
    connection = await createConnection();
    try {
      await connection.runMigrations()
    } catch (err) {
      console.error(err)
    }
  })

  afterAll(async () => {
    await connection.dropDatabase();

    await connection.close()
  })


  it('POST - Should be able create a new User', async () => {
    const response = await request(app).post('/api/v1/users').send({
      name: 'John',
      email: 'john@example.com',
      password: '1234'
    })

    expect(response.status).toBe(201)
  })

  it('POST - Should not be able create a new user with same email', async () => {
    await request(app).post('/api/v1/users').send({
      name: 'John',
      email: 'john@example.com',
      password: '1234'
    })

    const response = await request(app).post('/api/v1/users').send({
      name: 'Mark',
      email: 'john@example.com',
      password: '4321'
    })

    expect(response.status).toBe(400)
  })
})

