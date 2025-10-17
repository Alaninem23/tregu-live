// types/auth.ts
export type AccountType = 'PERSONAL' | 'BUSINESS' | 'ENTERPRISE';

export interface User {
  id: string;
  email: string;
  accountType: AccountType;
  orgId?: string | null;          // set for BUSINESS/ENTERPRISE users
  name?: string;
  companyName?: string;
  logoUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  tier: 'BUSINESS' | 'ENTERPRISE';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  id: string;
  orgId: string;
  // enterprise policy toggles
  allowPersonalComments: boolean;      // default true
  allowPersonalTransactions: boolean;  // default true
  productVisibility: 'PUBLIC' | 'ORG_ONLY'; // default PUBLIC
  createdAt: Date;
  updatedAt: Date;
}

// Default settings for new ENTERPRISE orgs
export const DEFAULT_ORG_SETTINGS: Omit<OrganizationSettings, 'id' | 'orgId' | 'createdAt' | 'updatedAt'> = {
  allowPersonalComments: true,
  allowPersonalTransactions: true,
  productVisibility: 'PUBLIC'
};
