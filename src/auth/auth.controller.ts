import { Body, Controller, Get, Post, Render, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@ApiExcludeController()
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    try {
      req.session.user = await this.authService.validateUser(body.email, body.password);
      return res.redirect('/');
    } catch {
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
}
