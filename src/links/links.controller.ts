import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Redirect,
} from '@nestjs/common';
import { config } from '../config';
import { ShortenUrlDto } from './dto/shorten-url.dto';
import { LinksService } from './links.service';

@Controller()
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Post('shorten')
  async shorten(@Body() dto: ShortenUrlDto) {
    const link = await this.links.shorten(dto.url);
    return {
      code: link.code,
      shortUrl: `${config.baseUrl}/${link.code}`,
      originalUrl: link.originalUrl,
    };
  }

  @Get('stats/:code')
  async stats(@Param('code') code: string) {
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
  async redirect(@Param('code') code: string) {
    const url = await this.links.resolveAndCountVisit(code);
    return { url };
  }
}
