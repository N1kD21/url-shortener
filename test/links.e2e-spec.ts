import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { setupSwagger } from '../src/swagger';

const CODE_PATTERN = /^[0-9A-Za-z]{7}$/;

interface ShortenResponse {
  code: string;
  shortUrl: string;
  originalUrl: string;
}

interface StatsResponse {
  code: string;
  originalUrl: string;
  visits: number;
  createdAt: string;
}

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
}

const body = <T>(res: Response): T => res.body as T;

describe('URL shortener (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupSwagger(app);
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const shorten = (payload: unknown) =>
    request(http).post('/shorten').send(payload);

  async function shortenOk(url: string): Promise<string> {
    const res = await shorten({ url }).expect(201);
    return body<ShortenResponse>(res).code;
  }

  describe('POST /shorten', () => {
    it('returns a short code for a valid URL', async () => {
      const url = 'https://example.com/some/long/path?with=query';
      const res = await shorten({ url }).expect(201);

      const { code, shortUrl, originalUrl } = body<ShortenResponse>(res);
      expect(code).toMatch(CODE_PATTERN);
      expect(shortUrl).toMatch(new RegExp(`/${code}$`));
      expect(originalUrl).toBe(url);
    });

    it('rejects a missing url field', async () => {
      const res = await shorten({}).expect(400);

      expect(body<ErrorResponse>(res)).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: ['url is required and must be a string'],
      });
    });

    it.each([
      'not a url',
      'example.com',
      'ftp://example.com/file',
      'javascript:alert(1)',
      'https://',
    ])('rejects malformed URL %p', async (url) => {
      const res = await shorten({ url }).expect(400);

      expect(body<ErrorResponse>(res).message).toEqual([
        'url must be a valid http(s) URL',
      ]);
    });

    it('rejects a non-string url', async () => {
      const res = await shorten({ url: 12345 }).expect(400);

      expect(body<ErrorResponse>(res).message).toEqual([
        'url is required and must be a string',
      ]);
    });

    it('rejects an overly long URL', async () => {
      const url = 'https://example.com/' + 'a'.repeat(2048);
      const res = await shorten({ url }).expect(400);

      expect(body<ErrorResponse>(res).message).toEqual([
        'url must be at most 2048 characters long',
      ]);
    });

    it('rejects unknown fields', async () => {
      const res = await shorten({
        url: 'https://example.com',
        custom: 'nope',
      }).expect(400);

      expect(body<ErrorResponse>(res).message).toEqual([
        'property custom should not exist',
      ]);
    });

    it('rejects a non-JSON body', async () => {
      await request(http)
        .post('/shorten')
        .set('Content-Type', 'text/plain')
        .send('https://example.com')
        .expect(400);
    });
  });

  describe('GET /:code', () => {
    it('redirects with 302 to the original URL', async () => {
      const code = await shortenOk('https://example.com/target');

      const res = await request(http).get(`/${code}`).expect(302);
      expect(res.headers.location).toBe('https://example.com/target');
    });

    it('returns a JSON 404 for an unknown code', async () => {
      const res = await request(http).get('/doesnotexist').expect(404);

      expect(body<ErrorResponse>(res)).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Short link "doesnotexist" not found',
      });
    });
  });

  describe('GET /stats/:code', () => {
    it('starts at zero visits and counts each redirect', async () => {
      const code = await shortenOk('https://example.com/counted');

      const before = await request(http).get(`/stats/${code}`).expect(200);
      expect(body<StatsResponse>(before)).toMatchObject({
        code,
        originalUrl: 'https://example.com/counted',
        visits: 0,
      });
      expect(typeof body<StatsResponse>(before).createdAt).toBe('string');

      await request(http).get(`/${code}`).expect(302);
      await request(http).get(`/${code}`).expect(302);
      await request(http).get(`/${code}`).expect(302);

      const after = await request(http).get(`/stats/${code}`).expect(200);
      expect(body<StatsResponse>(after).visits).toBe(3);
    });

    it('does not count stats lookups as visits', async () => {
      const code = await shortenOk('https://example.com/stats-only');

      await request(http).get(`/stats/${code}`).expect(200);
      const res = await request(http).get(`/stats/${code}`).expect(200);
      expect(body<StatsResponse>(res).visits).toBe(0);
    });

    it('returns a JSON 404 for an unknown code', async () => {
      const res = await request(http).get('/stats/doesnotexist').expect(404);

      expect(body<ErrorResponse>(res)).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Short link "doesnotexist" not found',
      });
    });
  });

  describe('API docs', () => {
    it('serves the OpenAPI document with all three endpoints', async () => {
      const res = await request(http).get('/docs-json').expect(200);

      const paths = Object.keys(body<{ paths: object }>(res).paths);
      expect(paths).toEqual(
        expect.arrayContaining(['/shorten', '/stats/{code}', '/{code}']),
      );
    });

    it('serves Swagger UI instead of treating "docs" as a short code', async () => {
      const res = await request(http).get('/docs').expect(200);
      expect(res.text).toContain('swagger-ui');
    });
  });
});
