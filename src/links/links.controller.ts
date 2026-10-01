import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Redirect,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiFoundResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { config } from '../config';
import {
  NotFoundErrorDto,
  ShortenResponseDto,
  StatsResponseDto,
  ValidationErrorDto,
} from './dto/link-responses.dto';
import { ShortenUrlDto } from './dto/shorten-url.dto';
import { LinksService } from './links.service';

const codeParam = ApiParam({
  name: 'code',
  description: 'Short code returned by POST /shorten',
  example: 'aZ3kQ9x',
});

@ApiTags('links')
@Controller()
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Post('shorten')
  @ApiOperation({ summary: 'Create a short link' })
  @ApiCreatedResponse({ type: ShortenResponseDto })
  @ApiBadRequestResponse({
    type: ValidationErrorDto,
    description:
      'Missing, non-string, malformed or too long url, or unknown fields',
  })
  async shorten(@Body() dto: ShortenUrlDto): Promise<ShortenResponseDto> {
    const link = await this.links.shorten(dto.url);
    return {
      code: link.code,
      shortUrl: `${config.baseUrl}/${link.code}`,
      originalUrl: link.originalUrl,
    };
  }

  @Get('stats/:code')
  @ApiOperation({ summary: 'Get visit statistics for a short link' })
  @codeParam
  @ApiOkResponse({ type: StatsResponseDto })
  @ApiNotFoundResponse({ type: NotFoundErrorDto })
  async stats(@Param('code') code: string): Promise<StatsResponseDto> {
    const link = await this.links.getStats(code);
    return {
      code: link.code,
      originalUrl: link.originalUrl,
      visits: link.visits,
      createdAt: link.createdAt,
    };
  }

  /**
   * 302 rather than 301 on purpose: a 301 is cached by browsers, which would
   * then skip this endpoint entirely and the visit counter would stop counting.
   */
  @Get(':code')
  @Redirect(undefined, HttpStatus.FOUND)
  @ApiOperation({
    summary: 'Redirect to the original URL and count the visit',
    description:
      'Swagger UI follows the redirect with fetch, so "Try it out" may show a CORS ' +
      'or network error even though the call succeeded. Use a browser tab or ' +
      '`curl -i` to see the 302 itself.',
  })
  @codeParam
  @ApiFoundResponse({
    description: 'Redirect to the original URL',
    headers: {
      Location: {
        description: 'The original URL',
        schema: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ type: NotFoundErrorDto })
  async redirect(@Param('code') code: string) {
    const url = await this.links.resolveAndCountVisit(code);
    return { url };
  }
}
