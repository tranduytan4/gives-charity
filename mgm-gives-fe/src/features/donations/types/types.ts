export type DonationType = 'MONEY' | 'GOODS';
export type DonationStatus = 'SUCCESSFUL' | 'CANCELLED' | 'PENDING' | 'REJECTED';

export interface DonationPayload {
  campaignId: number;
  donationType: DonationType;
  amount?: number;
  goodsDescription?: string;
  anonymous: boolean;
  transactionId?: string;
  transactionDescription?: string;
  transactionProofUrl?: string;
  message?: string;
  goodsCategory?: string;
  deliveryMethod?: string;
}

export interface PayOSPayload {
  campaignId: number;
  amount: number;
  anonymous: boolean;
  message?: string;
}

export interface PayOSResponseData {
  donationId: number;
  checkoutUrl: string;
  amount: number;
  qrCode?: string;
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  description?: string;
}

export interface DonationResponseData {
  id: number;
  campaignId: number;
  campaignName: string;
  donorName?: string;
  type: DonationType;
  amount?: number | string | null;
  detail?: string | null;
  isAnonymous: boolean;
  status: DonationStatus;
  transactionId?: string | null;
  transactionDescription?: string | null;
  transactionProofUrl?: string | null;
  rejectReason?: string;
  donorEmail?: string;
  message?: string;
  isMessageHidden?: boolean;
  isAmountHidden?: boolean;
  goodsCategory?: string;
  deliveryMethod?: string;
  confirmedAt?: string;
  updatedAt?: string;
  createdAt: string;
}

export interface DonationAdminResponseData extends DonationResponseData {
  userId: number;
  userName: string;
  userEmail: string;
  confirmedById?: number;
  confirmedByName?: string;
  confirmedAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  code?: number;
  message?: string;
  result: {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

export interface StandardApiResponse<T> {
  success: boolean;
  code?: number;
  message?: string;
  result: T;
}

export interface AdminGetDonationsParams {
  status?: DonationStatus | '';
  type?: DonationType | '';
  campaignId?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}
