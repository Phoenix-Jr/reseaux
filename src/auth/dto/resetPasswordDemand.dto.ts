import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordDemandDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}
