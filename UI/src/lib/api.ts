const BASE_URL = '/api';

// ─── Static fallback list (used only if DB is empty) ──────────────
export const DEFAULT_SERVICES = [
  'Building Construction',
  'Architectural Planning',
  'Structural Design',
  '2D/3D Elevation Design',
  'Building Renovation',
];

/** Map service title → services.json id (for static fallback card images) */
export const SERVICE_ID_MAP: Record<string, string> = {
  'Building Construction': 'building-construction',
  'Architectural Planning': 'architectural-planning',
  'Structural Design': 'structural-design',
  '2D/3D Elevation Design': 'elevation-design',
  'Building Renovation': 'building-renovation',
};

function authHeaders() {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Auth ───────────────────────────────────────────────────────────
export async function loginAdmin(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(err.message || 'Login failed');
  }
  return res.json() as Promise<{ token: string }>;
}

export async function verifyToken() {
  const res = await fetch(`${BASE_URL}/auth/verify`, {
    headers: authHeaders() as HeadersInit,
  });
  return res.ok;
}

export async function registerAdmin(username: string, password: string, email?: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() as object) },
    body: JSON.stringify({ username, password, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function updateAdminProfile(data: { email: string }): Promise<{ message: string; email?: string }> {
  const res = await fetch(`${BASE_URL}/auth/update-profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() as object) },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function updateAdminPassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() as object) },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function requestPasswordReset(username: string): Promise<{ email: string; otp: string }> {
  const res = await fetch(`${BASE_URL}/auth/request-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to request reset' }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function resetPassword(data: { username: string; otp: string; newPassword: string }): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Reset failed' }));
    throw new Error(err.message);
  }
  return res.json();
}

// ─── Service Content ────────────────────────────────────────────────
export async function fetchServiceContent(serviceName: string) {
  const res = await fetch(`${BASE_URL}/services/${encodeURIComponent(serviceName)}`);
  if (!res.ok) throw new Error('Failed to fetch service content');
  return res.json();
}

export async function fetchAllContent() {
  const res = await fetch(`${BASE_URL}/services`);
  if (!res.ok) throw new Error('Failed to fetch content');
  return res.json();
}

export async function uploadContent(formData: FormData) {
  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: authHeaders() as HeadersInit,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(err.message || 'Upload failed');
  }
  return res.json();
}

export async function deleteContent(id: string) {
  const res = await fetch(`${BASE_URL}/upload/${id}`, {
    method: 'DELETE',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(err.message || 'Delete failed');
  }
  return res.json();
}

// ─── Categories ─────────────────────────────────────────────────────
export interface Category { _id: string; name: string; }

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) return [];
  return res.json();
}

export async function addCategory(name: string): Promise<Category> {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() as object) },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to add category' }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to delete category' }));
    throw new Error(err.message);
  }
}

// ─── Achievements ───────────────────────────────────────────────────
export interface Achievement {
  _id: string;
  label: string;
  value: number;
  suffix: string;
  icon: string;
  order: number;
}

export async function fetchAchievements(): Promise<Achievement[]> {
  const res = await fetch(`${BASE_URL}/achievements`);
  if (!res.ok) return [];
  return res.json();
}

export async function addAchievement(data: Omit<Achievement, '_id'>): Promise<Achievement> {
  const res = await fetch(`${BASE_URL}/achievements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() as object) },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to add achievement' }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function updateAchievement(id: string, data: Omit<Achievement, '_id'>): Promise<Achievement> {
  const res = await fetch(`${BASE_URL}/achievements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() as object) },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to update achievement' }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function deleteAchievement(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/achievements/${id}`, {
    method: 'DELETE',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to delete achievement' }));
    throw new Error(err.message);
  }
}

// ─── Analytics & Inquiries ──────────────────────────────────────────

export interface ServiceStat {
  name: string;
  inquiryCount: number;
  contentCount: number;
}

export interface AdminStats {
  totalUploads: number;
  totalInquiries: number;
  acceptedCount: number;
  rejectedCount: number;
  conversionRate: number;
  popularService: string;
  serviceStats: ServiceStat[];
}

export async function fetchAdminStats(): Promise<AdminStats | null> {
  const res = await fetch(`${BASE_URL}/admin/stats`, {
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) return null;
  return res.json();
}

export type InquiryStatus = 'pending' | 'in_discussion' | 'accepted' | 'rejected';

export interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  adminNotes: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  const res = await fetch(`${BASE_URL}/inquiries`, {
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) return [];
  return res.json();
}

export async function submitInquiry(data: Omit<Inquiry, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'adminNotes'>): Promise<void> {
  const res = await fetch(`${BASE_URL}/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to submit inquiry' }));
    throw new Error(err.message || 'Submission failed');
  }
}

export async function acceptInquiry(id: string): Promise<{ inquiry: Inquiry }> {
  const res = await fetch(`${BASE_URL}/inquiries/${id}/accept`, {
    method: 'PUT',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to accept inquiry' }));
    throw new Error(err.message || 'Acceptance failed');
  }
  return res.json();
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<{ inquiry: Inquiry }> {
  const res = await fetch(`${BASE_URL}/inquiries/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() as object) },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to update status' }));
    throw new Error(err.message || 'Status update failed');
  }
  return res.json();
}

export async function saveInquiryNotes(id: string, adminNotes: string): Promise<{ inquiry: Inquiry }> {
  const res = await fetch(`${BASE_URL}/inquiries/${id}/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() as object) },
    body: JSON.stringify({ adminNotes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to save notes' }));
    throw new Error(err.message || 'Notes save failed');
  }
  return res.json();
}


// ─── Reviews ────────────────────────────────────────────────────────

export interface ReviewModel {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  service: string;
  approved: boolean;
  createdAt: string;
}

export async function fetchApprovedReviews(): Promise<ReviewModel[]> {
  const res = await fetch(`${BASE_URL}/reviews`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAllReviewsAdmin(): Promise<ReviewModel[]> {
  const res = await fetch(`${BASE_URL}/reviews/admin`, {
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) return [];
  return res.json();
}

export async function submitReview(data: Omit<ReviewModel, '_id' | 'createdAt' | 'approved'>): Promise<void> {
  const res = await fetch(`${BASE_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit review');
}

export async function toggleReviewApproval(id: string): Promise<ReviewModel> {
  const res = await fetch(`${BASE_URL}/reviews/${id}/approve`, {
    method: 'PUT',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) throw new Error('Failed to update review status');
  return res.json();
}

export async function deleteReview(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/reviews/${id}`, {
    method: 'DELETE',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) throw new Error('Failed to delete review');
}
