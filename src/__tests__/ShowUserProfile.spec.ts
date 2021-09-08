import request from 'supertest';
import { Connection } from "typeorm";
import { v4 as uuidV4, validate as isUuid } from 'uuid';
import { hash } from 'bcryptjs';

import createConnection from '../database';
import { app } from '../app';

let connection: Connection;

describe('Show User Profile integration tests', () => {
  const id = uuidV4();
  let token: string;
  let user: {
    id?: string;
    name?: string;
    email?: string;
  }

  beforeAll(async () => {
    const password = await hash('1234', 8);

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

  it('GET - Should be able to show user profile without password when authenticated',
    async () => {
      const response = await request(app).get('/api/v1/profile')
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining(user));
    expect(isUuid(response.body.id)).toBeTruthy();
    expect(response.body).not.toHaveProperty('password');
  })

  it('GET - Should not be able to show user profile when unauthenticated',
    async () => {
    const response = await request(app).get('/api/v1/profile')

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message')
  })

  it('GET - Should not be able to show user profile when JWT authentication is invalid.',
    async () => {
    const response = await request(app).get('/api/v1/profile')
      .set({
        Authorization: `Bearer ${uuidV4()}`,
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message')
  })
})
