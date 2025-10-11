const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_API_USER_ID ?? 'demo-user';

const withUserHeader = (init: RequestInit = {}): RequestInit => {
  const headers = new Headers(init.headers);
  headers.set('x-user-id', DEFAULT_USER_ID);

  return { ...init, headers };
};

export const fetchLedger = async () => {
  const response = await fetch(`${API_BASE_URL}/api/ledger`, withUserHeader({ cache: 'no-store' }));

  if (!response.ok) {
    throw new Error('Failed to load ledger');
  }

  return response.json();
};

export const fetchReview = async () => {
  const response = await fetch(`${API_BASE_URL}/api/review`, withUserHeader({ cache: 'no-store' }));

  if (!response.ok) {
    throw new Error('Failed to load review queue');
  }

  return response.json();
};

export const uploadImportFile = async (formData: FormData) => {
  const response = await fetch(`${API_BASE_URL}/api/upload`, withUserHeader({
    method: 'POST',
    body: formData,
  }));

  if (!response.ok) {
    throw new Error('CSV upload failed');
  }

  return response.json();
};

export const updateCategory = async (id: string, payload: { categoryId?: string | null; categoryName?: string }) => {
  const response = await fetch(`${API_BASE_URL}/api/transactions/${id}/category`, withUserHeader({
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }));

  if (!response.ok) {
    throw new Error('Failed to update transaction category');
  }

  return response.json();
};

export const fetchAccounts = async () => {
  const response = await fetch(`${API_BASE_URL}/api/accounts`, withUserHeader({ cache: 'no-store' }));

  if (!response.ok) {
    throw new Error('Failed to load accounts');
  }

  return response.json();
};

export const saveOpeningBalance = async (accountId: string, payload: {
  effectiveDate: string;
  amount: number | string;
  currency?: string;
  note?: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}/opening-balance`, withUserHeader({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to save opening balance' }));
    throw new Error(error.error ?? 'Failed to save opening balance');
  }

  return response.json();
};

export const lockOpeningBalance = async (balanceId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/opening-balances/${balanceId}/lock`, withUserHeader({
    method: 'POST',
  }));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to lock opening balance' }));
    throw new Error(error.error ?? 'Failed to lock opening balance');
  }

  return response.json();
};

export const fetchReconciliation = async (params: {
  accountId: string;
  month?: number;
  year?: number;
  start?: string;
  end?: string;
}) => {
  const query = new URLSearchParams();
  query.set('accountId', params.accountId);
  if (params.month) query.set('month', String(params.month));
  if (params.year) query.set('year', String(params.year));
  if (params.start) query.set('start', params.start);
  if (params.end) query.set('end', params.end);

  const response = await fetch(`${API_BASE_URL}/api/reconciliation?${query.toString()}`, withUserHeader({ cache: 'no-store' }));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to load reconciliation data' }));
    throw new Error(error.error ?? 'Failed to load reconciliation data');
  }

  return response.json();
};

export const lockLedgerPeriod = async (ledgerId: string, payload?: { note?: string }) => {
  const response = await fetch(`${API_BASE_URL}/api/ledger/${ledgerId}/lock`, withUserHeader({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  }));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to lock ledger' }));
    throw new Error(error.error ?? 'Failed to lock ledger');
  }

  return response.json();
};

export const unlockLedgerPeriod = async (ledgerId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/ledger/${ledgerId}/unlock`, withUserHeader({
    method: 'POST',
  }));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to unlock ledger' }));
    throw new Error(error.error ?? 'Failed to unlock ledger');
  }

  return response.json();
};
