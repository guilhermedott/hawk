import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { MailService } from './mail.service.js';

describe('AuthService password recovery', () => {
  let service: AuthService;
  let users: { findByEmail: ReturnType<typeof vi.fn> };
  let mail: { sendPasswordReset: ReturnType<typeof vi.fn> };
  let transaction: {
    passwordResetToken: {
      create: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    user: { update: ReturnType<typeof vi.fn> };
  };
  let prisma: {
    $transaction: ReturnType<typeof vi.fn>;
    passwordResetToken: {
      create: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    user: { update: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    users = { findByEmail: vi.fn() };
    mail = { sendPasswordReset: vi.fn() };
    transaction = {
      passwordResetToken: {
        create: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: { update: vi.fn() },
    };
    prisma = {
      $transaction: vi.fn((callback) => callback(transaction)),
      passwordResetToken: {
        create: vi.fn(),
        deleteMany: vi.fn(),
        findUnique: vi.fn(),
      },
      user: { update: vi.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
        {
          provide: ConfigService,
          useValue: { getOrThrow: vi.fn(() => 'http://localhost:3000') },
        },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('does not reveal whether an email exists', async () => {
    users.findByEmail.mockResolvedValue(null);

    const result = await service.forgotPassword('unknown@example.com');

    expect(result.message).toContain('Se o e-mail estiver cadastrado');
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('stores only a hash and emails a time-limited reset link', async () => {
    users.findByEmail.mockResolvedValue({ id: 'user-id', email: 'user@example.com' });

    const result = await service.forgotPassword('user@example.com');

    expect(result.message).toContain('Se o e-mail estiver cadastrado');
    const resetUrl = mail.sendPasswordReset.mock.calls[0][1] as string;
    const token = new URL(resetUrl).searchParams.get('token');
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const storedTokenHash = transaction.passwordResetToken.create.mock.calls[0][0].data.tokenHash;
    expect(storedTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(storedTokenHash).not.toBe(token);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(mail.sendPasswordReset).toHaveBeenCalledWith('user@example.com', resetUrl);
  });

  it('updates the password and consumes the reset token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.resetPassword({ token: 'a'.repeat(64), password: 'Password123' }),
    ).resolves.toEqual({ message: 'Senha redefinida com sucesso' });

    const updatedPasswordHash = transaction.user.update.mock.calls[0][0].data.passwordHash;
    expect(await bcrypt.compare('Password123', updatedPasswordHash)).toBe(true);
    expect(transaction.passwordResetToken.deleteMany).toHaveBeenCalledTimes(2);
  });

  it('rejects an expired reset token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      userId: 'user-id',
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.resetPassword({ token: 'a'.repeat(64), password: 'Password123' }))
      .rejects.toThrow('Token inválido ou expirado');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a token already consumed by another reset request', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 60_000),
    });
    const consumedTransaction = {
      passwordResetToken: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      user: { update: vi.fn() },
    };
    prisma.$transaction.mockImplementation((callback) => callback(consumedTransaction));

    await expect(service.resetPassword({ token: 'a'.repeat(64), password: 'Password123' }))
      .rejects.toThrow('Token inválido ou expirado');
    expect(consumedTransaction.user.update).not.toHaveBeenCalled();
  });
});
