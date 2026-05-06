export type ContractStatus = 'active' | 'suspended' | 'expired';

export interface Contract {
  id: string;
  code: string;
  name: string;
  companyId: string | null;
  startDate: string;
  endDate: string | null;
  status: ContractStatus;
  siteIds: string[];
}
