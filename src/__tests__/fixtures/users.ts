// Test user fixtures for RabbitAI

export const testUsers = {
  free: {
    id: 'user-free-001',
    email: 'free@test.com',
    plan: 'free',
    name: 'Free User',
    createdAt: new Date('2024-01-01'),
  },
  pro: {
    id: 'user-pro-001',
    email: 'pro@test.com',
    plan: 'pro',
    name: 'Pro User',
    createdAt: new Date('2024-01-01'),
  },
  enterprise: {
    id: 'user-ent-001',
    email: 'enterprise@test.com',
    plan: 'enterprise',
    name: 'Enterprise User',
    createdAt: new Date('2024-01-01'),
  },
} as const;

export const invalidUsers = {
  noEmail: {
    id: 'user-invalid-001',
    email: '',
    plan: 'free',
    name: 'No Email User',
  },
  invalidEmail: {
    id: 'user-invalid-002',
    email: 'not-an-email',
    plan: 'free',
    name: 'Invalid Email User',
  },
} as const;

export type TestUser = typeof testUsers[keyof typeof testUsers];
