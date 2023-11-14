import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { MailerService } from 'src/mailer/mailer.service';
import { JwtService } from '@nestjs/jwt/dist';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDemandDto } from './dto/resetPasswordDemand.dto';
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmation.dto';
import { DeleteAccountDto } from './dto/deleteAccount.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailServie: MailerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignupDto) {
    const { email, password, username } = signUpDto;
    // Verifier si l'utilisateur est déjà inscrit
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (user) throw new ConflictException('User Already exists');
    // Hasher le mot de passe
    const hash = await bcrypt.hash(password, 10);
    // Enregistrer l'utilisateur dans la base de donnée
    await this.prismaService.user.create({
      data: { email, username, password: hash },
    });
    // Envoyer un email de confirmartion
    await this.mailServie.sendSignupConfirmation(email);
    // Retourner une réponse de succès
    return { data: 'User successfullt created' };
  }

  async signIn(signinDto: SigninDto) {
    const { email, password } = signinDto;
    // Verifier si l'utilisateu est déjà inscrit
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    // Comparer le mot de passe
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Password does not match');
    // Retourner un jwt
    const payload = {
      user: user.userId,
      email: user.email,
    };
    const token = this.jwtService.sign(payload, {
      expiresIn: '1h',
      secret: this.configService.get('SECRET_KEY'),
    });
    return { token, user: { username: user.username, email: user.email } };
  }

  async resetPasswordDemand(resetPasswordDemand: ResetPasswordDemandDto) {
    const { email } = resetPasswordDemand;
    // verifier si l'utilisateur existe
    const user = this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not Found');
    // création de l'otp
    const code = speakeasy.totp({
      secret: this.configService.get('OTP_CODE'),
      digits: 5,
      step: 60 * 15,
      encoding: 'base32',
    });
    const url = 'http://localhost:3000/auth/reset-password-confirmation';
    await this.mailServie.sendResetPassword(email, url, code);
    return { data: 'Reset password mail has been send' };
  }

  async resetPasswordConfirmation(
    resetPasswordConfirm: ResetPasswordConfirmationDto,
  ) {
    const { code, email, password } = resetPasswordConfirm;
    // verifier si l'utilisateur existe
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not Found');
    // Verification de l'otp
    const match = speakeasy.totp.verify({
      secret: this.configService.get('OTP_CODE'),
      token: code,
      digits: 5,
      step: 60 * 15,
      encoding: 'base32',
    });
    if (!match) throw new UnauthorizedException('Invalid/expired token');
    const hash = await bcrypt.hash(password, 10);
    await this.prismaService.user.update({
      where: { email },
      data: { password: hash },
    });
    return { data: 'Password updated' };
  }

  async deleteAccount(userId: number, deleteAccount: DeleteAccountDto) {
    const { password } = deleteAccount;
    // verifier si l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { userId },
    });
    if (!user) throw new NotFoundException('User not Found');
    // Comparer le mot de passe
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Password does not match');
    await this.prismaService.user.delete({ where: { userId } });
    return { data: 'User successfully deleted' };
  }
}
