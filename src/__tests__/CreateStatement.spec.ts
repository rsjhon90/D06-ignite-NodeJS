import request from 'supertest';
import { Connection } from "typeorm";
import { v4 as uuidV4 } from 'uuid';
import { hash } from 'bcryptjs';

import createConnection from '../database';
import { app } from '../app';

let connection: Connection;

describe('Register statement operation integration tests', () => {
  const id1 = uuidV4();
  const id2 = uuidV4();

  let token1: string;
  let user1: {
    id?: string;
    name?: string;
    email?: string;
  }

  let token2: string;
  let user2: {
    id?: string;
    name?: string;
    email?: string;
  }

  beforeAll(async () => {
    const password1 = await hash('1234', 8);
    const password2 = await hash('4321', 8);

    connection = await createConnection();
    try {
      await connection.runMigrations()

      await connection.query(`INSERT INTO users(id, name, email, password, created_at, updated_at)
      values('${id1}', 'john', 'john@example.com', '${password1}', 'NOW()', 'NOW()')`);

      await connection.query(`INSERT INTO users(id, name, email, password, created_at, updated_at)
      values('${id2}', 'Jeff', 'sanu@esejapmiw.ai', '${password2}', 'NOW()', 'NOW()')`);

    } catch (err) {
      console.error(err)
    }

    const responseToken1 = await request(app).post('/api/v1/sessions')
      .send({
        email: 'john@example.com',
        password: '1234'
      });

    user1 = responseToken1.body.user;
    token1 = responseToken1.body.token;

    const responseToken2 = await request(app).post('/api/v1/sessions')
      .send({
        email: 'sanu@esejapmiw.ai',
        password: '4321'
      });

    user2 = responseToken2.body.user;
    token2 = responseToken2.body.token;
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
        Authorization: `Bearer ${token1}`,
      })

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toStrictEqual(user1.id);
  })

  it("POST - Should be able to withdraw an amount from the user's account",
  async () => {
    const response = await request(app).post('/api/v1/statements/withdraw')
      .send({
        amount: 250.60,
        description: 'Daily consumption'
      })
      .set({
        Authorization: `Bearer ${token1}`,
      })

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toStrictEqual(user1.id);
  })

  it("POST - Should not be able to withdraw an amount if funds are insufficient",
  async () => {
    const response = await request(app).post('/api/v1/statements/withdraw')
      .send({
        amount: 650.60,
        description: 'Daily consumption'
      })
      .set({
        Authorization: `Bearer ${token1}`,
      })

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  })

  it("POST - Should be able to transfer an amount from one user to another",
  async () => {
    const response = await request(app).post(`/api/v1/statements/transfers/${user2.id}`)
      .send({
        amount: 100.20,
        description: 'Payment from service'
      })
      .set({
        Authorization: `Bearer ${token1}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.sender_id).toStrictEqual(user1.id);
    expect(response.body.user_id).toStrictEqual(user2.id);
  })

  it("POST - Should not be able to transfer an amount if funds are insufficient",
  async () => {
    const response = await request(app).post(`/api/v1/statements/transfers/${user2.id}`)
      .send({
        amount: 950.20,
        description: 'Payment from service'
      })
      .set({
        Authorization: `Bearer ${token1}`,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  })

  it("POST - Should not be able to transfer an amount if receiver user does not exists",
  async () => {
    const response = await request(app).post(`/api/v1/statements/transfers/${uuidV4()}`)
      .send({
        amount: 15.20,
        description: 'Payment from service'
      })
      .set({
        Authorization: `Bearer ${token1}`,
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  })

  it("POST - Should not be able to operate statements if unauthenticated or unauthorized",
  async () => {
    const response = await request(app).post('/api/v1/statements/withdraw')
      .send({
        amount: 20.15,
        description: 'Daily consumption'
      })
      .set({
        Authorization: `Bearer ${uuidV4()}`,
      })

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  })
})
