import { IsString, IsUrl, MaxLength } from 'class-validator';

export class ShortenUrlDto {
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    { message: 'url must be a valid http(s) URL' },
  )
  @MaxLength(2048, { message: 'url must be at most 2048 characters long' })
  @IsString({ message: 'url is required and must be a string' })
  url!: string;
}
