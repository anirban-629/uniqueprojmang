import { User } from '@flowline/types';
import { TenantContext } from '../../shared/types/index.js';
import { authRepository, AuthRepository } from './auth.repository.js';
import { CompanyDto, CurrentUserResponseDto } from './auth.types.js';

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}

  public async getUsers(): Promise<User[]> {
    await this.repository.simulateNetwork();
    return this.repository.getUsers();
  }

  public async getCurrentUserContext(tenant: TenantContext): Promise<CurrentUserResponseDto> {
    const users = await this.getUsers();
    const currentUser = users.find(u => u.id === tenant.userId) || users[0];
    return {
      user: currentUser,
      tenant
    };
  }

  public async getCompanies(): Promise<CompanyDto[]> {
    return this.repository.getCompanies();
  }
}

export const authService = new AuthService();
