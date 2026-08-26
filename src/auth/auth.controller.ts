import { Body, Controller, Get, HttpException, Post, Render, Req, Res, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { PageAuthGuard } from './page-auth.guard';

@ApiExcludeController()
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Защита от перебора пароля: после 5 неудачных попыток по email — пауза 5 минут
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly BLOCK_MS = 5 * 60 * 1000;
  private loginAttempts = new Map<string, { count: number; blockedUntil: number }>();

  private isBlocked(email: string): boolean {
    const rec = this.loginAttempts.get(email);
    return !!rec && rec.blockedUntil > Date.now();
  }

  private registerFailure(email: string) {
    const rec = this.loginAttempts.get(email) ?? { count: 0, blockedUntil: 0 };
    rec.count += 1;
    if (rec.count >= AuthController.MAX_ATTEMPTS) {
      rec.blockedUntil = Date.now() + AuthController.BLOCK_MS;
      rec.count = 0;
    }
    this.loginAttempts.set(email, rec);
  }

  @Get('login')
  @Render('auth/login')
  loginForm(@Req() req: Request) {
    return { title: 'Вход', user: req.session.user ?? null };
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (this.isBlocked(body.email)) {
      return res.render('auth/login', {
        title: 'Вход',
        user: null,
        error: 'Слишком много неудачных попыток. Попробуйте через 5 минут.',
        email: body.email,
      });
    }
    try {
      req.session.user = await this.authService.validateUser(body.email, body.password);
      this.loginAttempts.delete(body.email);
      return res.redirect('/');
    } catch {
      this.registerFailure(body.email);
      return res.render('auth/login', {
        title: 'Вход',
        user: null,
        error: 'Неверный email или пароль',
        email: body.email,
      });
    }
  }

  @Get('register')
  @Render('auth/register')
  registerForm(@Req() req: Request) {
    return { title: 'Регистрация', user: req.session.user ?? null };
  }

  @Post('register')
  async register(
    @Body() body: { email: string; name: string; password: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      req.session.user = await this.authService.register(body);
      return res.redirect('/');
    } catch {
      return res.render('auth/register', {
        title: 'Регистрация',
        user: null,
        error: 'Пользователь с таким email уже существует',
        email: body.email,
        name: body.name,
      });
    }
  }

  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy(() => res.redirect('/'));
  }

  @Get('profile')
  @UseGuards(PageAuthGuard)
  @Render('auth/profile')
  profileForm(@Req() req: Request) {
    return { title: 'Профиль', user: req.session.user };
  }

  @Post('profile')
  @UseGuards(PageAuthGuard)
  async updateProfile(
    @Body() body: { name?: string; currentPassword?: string; newPassword?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const updated = await this.authService.updateProfile(req.session.user!.id, body);
      req.session.user = updated;
      return res.render('auth/profile', {
        title: 'Профиль',
        user: updated,
        success: 'Изменения сохранены',
      });
    } catch (e) {
      const message = e instanceof HttpException ? e.message : 'Не удалось сохранить изменения';
      return res.render('auth/profile', {
        title: 'Профиль',
        user: req.session.user,
        error: message,
      });
    }
  }
}
