import { mockDb } from '@flowline/mock-db';
import { User } from '@flowline/types';
import { CompanyDto } from './auth.types.js';

const COMPANIES: CompanyDto[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', tenantId: 'acme-corp', name: 'Acme Corp', plan: 'pro' },
  { id: 'b0000000-0000-0000-0000-000000000002', tenantId: 'globex', name: 'Globex Inc', plan: 'enterprise' },
  { id: 'c0000000-0000-0000-0000-000000000003', tenantId: 'initech', name: 'Initech Software', plan: 'free' }
];

export class AuthRepository {
  public async simulateNetwork(): Promise<number> {
    return mockDb.simulateNetwork();
  }

  public getUsers(): User[] {
    return mockDb.getUsers();
  }

  public getCompanies(): CompanyDto[] {
    return [...COMPANIES];
  }
}

export const authRepository = new AuthRepository();
