import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Link, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateShortCode } from './short-code';

/** How many random codes to try before giving up on a pathological collision streak. */
const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async shorten(originalUrl: string): Promise<Link> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateShortCode();
      try {
        return await this.prisma.link.create({ data: { code, originalUrl } });
      } catch (error) {
        // P2002 = unique constraint violation: the code already exists, try another one.
        if (isPrismaError(error, 'P2002')) continue;
        throw error;
      }
    }
    throw new InternalServerErrorException(
      'Could not generate a unique short code, please retry',
    );
  }

  /**
   * Resolves a code to its original URL and counts the visit.
   * A single UPDATE ... SET visits = visits + 1 keeps the counter correct under
   * concurrent requests (no read-modify-write race).
   */
  async resolveAndCountVisit(code: string): Promise<string> {
    try {
      const link = await this.prisma.link.update({
        where: { code },
        data: { visits: { increment: 1 } },
        select: { originalUrl: true },
      });
      return link.originalUrl;
    } catch (error) {
      // P2025 = record to update not found.
      if (isPrismaError(error, 'P2025')) throw notFound(code);
      throw error;
    }
  }

  async getStats(code: string): Promise<Link> {
    const link = await this.prisma.link.findUnique({ where: { code } });
    if (!link) throw notFound(code);
    return link;
  }
}

function notFound(code: string): NotFoundException {
  return new NotFoundException(`Short link "${code}" not found`);
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}
