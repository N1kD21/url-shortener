import { ApiProperty } from '@nestjs/swagger';

/** Response shapes, used only to document the API in Swagger. */

export class ShortenResponseDto {
  @ApiProperty({ example: 'aZ3kQ9x' })
  code!: string;

  @ApiProperty({ example: 'http://localhost:3000/aZ3kQ9x' })
  shortUrl!: string;

  @ApiProperty({
    example: 'https://example.com/some/very/long/path?with=query',
  })
  originalUrl!: string;
}

export class StatsResponseDto {
  @ApiProperty({ example: 'aZ3kQ9x' })
  code!: string;

  @ApiProperty({
    example: 'https://example.com/some/very/long/path?with=query',
  })
  originalUrl!: string;

  @ApiProperty({ example: 3, description: 'Number of redirects served' })
  visits!: number;

  @ApiProperty({ example: '2026-10-01T10:15:42.000Z' })
  createdAt!: Date;
}

export class ValidationErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({
    type: [String],
    example: ['url must be a valid http(s) URL'],
    description: 'One message per invalid field',
  })
  message!: string[];
}

export class NotFoundErrorDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: 'Not Found' })
  error!: string;

  @ApiProperty({ example: 'Short link "aZ3kQ9x" not found' })
  message!: string;
}
