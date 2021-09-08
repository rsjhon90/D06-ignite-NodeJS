import request from 'supertest';
import { Connection } from "typeorm";
import { v4 as uuidV4 } from 'uuid';
import { hash } from 'bcryptjs';

import createConnection from '../database';
import { app } from '../app';

let connection: Connection;

describe('List Balance integration tests', () => {
  const idGenerated = uuidV4();
  let token: string;

  beforeAll(async () => {
    const password = await hash('1234', 8)
    connection = await createConnection();
    try {
      await connection.runMigrations()

      await connection.query(`INSERT INTO users(id, name, email, password, created_at, updated_at)
      values('${idGenerated}', 'john', 'john@example.com', '${password}', 'NOW()', 'NOW()')`);

    } catch (err) {
      console.error(err)
    }

    const responseToken = await request(app).post('/api/v1/sessions')
      .send({
        email: 'john@example.com',
        password: '1234'
      })

    token = responseToken.body.token;
  })

  afterAll(async () => {
    await connection.dropDatabase();

    await connection.close();
  })

  it('GET - Should be able to list balance and all statement operations from user account',
  async () => {
    await request(app).post('/api/v1/statements/deposit')
      .send({
        amount: 500.80,
        description: 'Daily consumption'
      })
      .set({
        Authorization: `Bearer ${token}`,
      })

    const operation = await request(app).post('/api/v1/statements/withdraw')
      .send({
        amount: 250.60,
        description: 'Daily consumption'
      })
      .set({
        Authorization: `Bearer ${token}`,
      })

    const response = await request(app).get('/api/v1/statements/balance')
      .set({
        Authorization: `Bearer ${token}`
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('balance')
    expect(response.body.statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: operation.body.id
        }),
      ])
    )
  })

  it("GET - Should not be able to list balance if unauthenticated or unauthorized",
  async () => {
    const response = await request(app).post('/api/v1/statements/balance')
      .send({
        amount: 650.60,
        description: 'Daily consumption'
      })
      .set({
        Authorization: `Bearer ${uuidV4()}`,
      })

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  })
})
