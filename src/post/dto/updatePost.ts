import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsNotEmpty()
  readonly title?: string;

  @IsNotEmpty()
  @IsOptional()
  readonly body?: string;
}
