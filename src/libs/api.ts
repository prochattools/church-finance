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

export const uploadCsv = async (formData: FormData) => {
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
