import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createFamilyMember, uploadFamilyMemberAvatar } from '@/api/familyMembers';
import { FamilyMemberFormPanel, type FamilyMemberFormState } from '@/components/FamilyMemberFormPanel';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { FamilyMemberPayload } from '@/types';
import { compressImage } from '@/utils/image';

const EMPTY_FORM: FamilyMemberFormState = { name: '', height_cm: '', avatar_url: '', signature: '' };

function toPayload(form: FamilyMemberFormState): FamilyMemberPayload {
  return {
    name: form.name.trim(),
    height_cm: form.height_cm ? Number(form.height_cm) : null,
    avatar_url: form.avatar_url.trim() || null,
    signature: form.signature.trim() || null,
  };
}

function validateForm(form: FamilyMemberFormState) {
  if (!form.name.trim()) return '请先填写成员名字';
  if (form.height_cm) {
    const height = Number(form.height_cm);
    if (!Number.isFinite(height) || height < 30 || height > 260) return '请输入 30 到 260 之间的身高';
  }
  return '';
}

export function FamilyMemberCreatePage() {
  const { isDesktop } = useBreakpoint();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FamilyMemberFormState>(EMPTY_FORM);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const compressed = await compressImage(file);
      return uploadFamilyMemberAvatar(compressed);
    },
    onSuccess: ({ url }) => {
      setForm((current) => ({ ...current, avatar_url: url }));
      showToast('头像已上传');
    },
    onError: (error: Error) => showToast(error.message || '头像上传失败', 'error'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: FamilyMemberPayload) => createFamilyMember(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['family-members'] });
      showToast('家庭成员已添加');
      navigate('/profile', { replace: true });
    },
    onError: (error: Error) => showToast(error.message || '保存失败，请稍后重试', 'error'),
  });

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const handleSave = () => {
    const errorMessage = validateForm(form);
    if (errorMessage) {
      showToast(errorMessage, 'error');
      return;
    }
    createMutation.mutate(toPayload(form));
  };

  return (
    <Screen className={isDesktop ? 'family-create-page family-create-page--desktop' : 'family-create-page'}>
      <TopBar title="新增家庭成员" />

      <div className={`family-create-layout ${isDesktop ? 'family-create-layout--desktop' : ''}`}>
        <section className="hero-card hero-card--welcome family-create-hero">
          <div className="avatar-badge">👨‍👩‍👧‍👦</div>
          <div>
            <p className="eyebrow">New Member</p>
            <h1>为家庭新增一位成员</h1>
            <p>头像、名字和身高会保存到后端，保存成功后自动返回“我的”页面。</p>
          </div>
        </section>

        <FamilyMemberFormPanel
          eyebrow="Create"
          title="新增成员资料"
          form={form}
          hint="创建完成后会返回“我的”页面，你可以继续查看所有成员或进入成员档案。"
          fileInputRef={fileInputRef}
          isUploading={uploadMutation.isPending}
          isSaving={createMutation.isPending}
          saveLabel="保存成员"
          onFileChange={handleUpload}
          onSave={handleSave}
          onCancel={() => navigate('/profile')}
          cancelLabel="返回我的"
          onChange={setForm}
        />
      </div>
    </Screen>
  );
}
