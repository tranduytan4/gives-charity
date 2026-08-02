export interface WebexConnectionStatus {
  connected: boolean;
  webexEmail: string | null;
  webexPersonId: string | null;
  connectedAt: string | null;
}

export interface WebexAuthorizeResponse {
  authorizeUrl: string;
}

export interface PayOSConnectionStatus {
  connected: boolean;
  clientId: string | null;
  connectedAt: string | null;
}

export interface PayOSConnectionRequest {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

export type WebexAuthorizeApiResult = WebexAuthorizeResponse | string;
