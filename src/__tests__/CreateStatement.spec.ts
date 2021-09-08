import request from 'supertest';
import { Connection } from "typeorm";
import { v4 as uuidV4 } from 'uuid';
import { hash } from 'bcryptjs';

import createConnection from '../database';
import { app } from '../app';

let connection: Connection;

describe('Register statement operation integration tests', () => {
  const id = uuidV4();
  let token: string;
  let user: {
    id?: string;
    name?: string;
    email?: string;
  }

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

    const responseToken = await request(app).post('/api/v1/sessions')
      .send({
        email: 'john@example.com',
        password: '1234'
      })
    user = responseToken.body.user;
    token = responseToken.body.token;
  })

  afterAll(async () => {
    await connection.dropDatabase();

    await connection.close();
  })

  it("POST - Should be able to deposit an amount into the user's account", async () => {
    const response = await request(app).post('/api/v1/statements/deposit')
      .send({
        amount: 500.80,
        description: 'Daily consumption'
      })
      .set({
        Authorization: `Bearer ${token}`,
      })

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toStrictEqual(user.id);
  })

  it("POST - Should be able to withdraw an amount from the user's account",
  async () => {
    const response = await request(app).post('/api/v1/statements/withdraw')
      .send({
        amount: 250.60,
        description: 'Daily consumption'
      })
      .set({
        Authorization: `Bearer ${token}`,
      })

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toStrictEqual(user.id);
  })

  it("POST - Should not be able to withdraw an amount if funds are insufficient",
  async () => {
    const response = await request(app).post('/api/v1/statements/withdraw')
      .send({
        amount: 650.60,
        description: 'Daily consumption'
      })
      .set({
        Authorization: `Bearer ${token}`,
      })

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  })

  it("POST - Should not be able to operate deposits and withdraws if unauthenticated or unauthorized",
  async () => {
    const response = await request(app).post('/api/v1/statements/withdraw')
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
