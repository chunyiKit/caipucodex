import type { FamilyMember, FamilyMemberPayload } from '@/types';
import { apiGet, apiSend } from './client';

export function getFamilyMembers() {
  return apiGet<FamilyMember[]>('/api/family-members');
}

export function getFamilyMember(id: string | number) {
  return apiGet<FamilyMember>(`/api/family-members/${id}`);
}

export function createFamilyMember(payload: FamilyMemberPayload) {
  return apiSend<FamilyMember>('/api/family-members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateFamilyMember(id: string | number, payload: FamilyMemberPayload) {
  return apiSend<FamilyMember>(`/api/family-members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteFamilyMember(id: string | number) {
  await apiSend<void>(`/api/family-members/${id}`, { method: 'DELETE' });
}

export async function uploadFamilyMemberAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiSend<{ url: string }>('/api/family-members/upload-avatar', { method: 'POST', body: formData });
}

export async function ocrFamilyMemberBodyReport(id: string | number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiSend<FamilyMember>(`/api/family-members/${id}/body-report/ocr`, { method: 'POST', body: formData });
}
