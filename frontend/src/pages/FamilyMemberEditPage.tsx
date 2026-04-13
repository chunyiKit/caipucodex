import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteFamilyMember, getFamilyMember, updateFamilyMember, uploadFamilyMemberAvatar } from '@/api/familyMembers';
import {
  buildFamilyBodyReportPayload,
  createFamilyBodyReportForm,
  FamilyBodyReportEditor,
  type FamilyBodyReportFormState,
} from '@/components/FamilyBodyReportEditor';
import { EmptyState } from '@/components/EmptyState';
import { FamilyMemberFormPanel, type FamilyMemberFormState } from '@/components/FamilyMemberFormPanel';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { FamilyMemberPayload } from '@/types';
import { compressImage } from '@/utils/image';

const EMPTY_FORM: FamilyMemberFormState = { name: '', height_cm: '', avatar_url: '', signature: '' };
const EMPTY_BODY_REPORT_FORM: FamilyBodyReportFormState = createFamilyBodyReportForm();

function toForm(name?: string, heightCm?: number | null, avatarUrl?: string | null, signature?: string | null): FamilyMemberFormState {
  return {
    name: name || '',
    height_cm: heightCm ? String(heightCm) : '',
    avatar_url: avatarUrl || '',
    signature: signature || '',
  };
}

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

export function FamilyMemberEditPage() {
  const { isDesktop } = useBreakpoint();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FamilyMemberFormState>(EMPTY_FORM);
  const [bodyReportForm, setBodyReportForm] = useState<FamilyBodyReportFormState>(EMPTY_BODY_REPORT_FORM);

  const query = useQuery({
    queryKey: ['family-member', id],
    queryFn: () => getFamilyMember(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!query.data) return;
    setForm(toForm(query.data.name, query.data.height_cm, query.data.avatar_url, query.data.signature));
    setBodyReportForm(createFamilyBodyReportForm(query.data.body_report));
  }, [query.data]);

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

  const saveMutation = useMutation({
    mutationFn: (payload: FamilyMemberPayload) => updateFamilyMember(id!, payload),
    onSuccess: async (member) => {
      await queryClient.invalidateQueries({ queryKey: ['family-members'] });
      await queryClient.invalidateQueries({ queryKey: ['family-member', id] });
      showToast('成员资料已更新');
      navigate(`/profile/family-members/${member.id}`, { replace: true });
    },
    onError: (error: Error) => showToast(error.message || '保存失败，请稍后重试', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFamilyMember(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['family-members'] });
      showToast('成员已删除');
      navigate('/profile', { replace: true });
    },
    onError: (error: Error) => showToast(error.message || '删除失败，请稍后重试', 'error'),
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
    saveMutation.mutate({
      ...toPayload(form),
      body_report: buildFamilyBodyReportPayload(bodyReportForm, query.data?.body_report),
    });
  };

  const handleDelete = () => {
    if (!query.data) return;
    if (!window.confirm(`确定删除「${query.data.name}」吗？`)) return;
    deleteMutation.mutate();
  };

  return (
    <Screen className={isDesktop ? 'family-create-page family-create-page--desktop' : 'family-create-page'}>
      <TopBar title="编辑成员资料" />

      {!query.data && query.isPending ? (
        <div className="detail-card family-detail-skeleton" />
      ) : query.isError || !query.data ? (
        <EmptyState
          icon="🧾"
          accent="warm"
          title="成员资料暂时打不开"
          description="可能成员已被删除，或数据还没同步出来。"
          action={
            <button type="button" className="primary-button inline-button" onClick={() => navigate('/profile')}>
              返回我的
            </button>
          }
        />
      ) : (
        <div className={`family-create-layout ${isDesktop ? 'family-create-layout--desktop' : ''}`}>
          <section className="hero-card hero-card--welcome family-create-hero">
            <div className="avatar-badge">✏️</div>
            <div>
              <p className="eyebrow">Edit Member</p>
              <h1>编辑家庭成员资料</h1>
              <p>修改保存后会返回成员档案页面；如果不需要这位成员，也可以在这里直接删除。</p>
            </div>
          </section>

          <FamilyMemberFormPanel
            eyebrow="Edit"
            title="编辑成员资料"
            form={form}
            hint="保存后会返回成员档案页；基础信息和手动修正后的体测数据会一起更新。"
            fileInputRef={fileInputRef}
            isUploading={uploadMutation.isPending}
            isSaving={saveMutation.isPending}
            saveLabel="更新资料"
            onFileChange={handleUpload}
            onSave={handleSave}
            onCancel={() => navigate(id ? `/profile/family-members/${id}` : '/profile')}
            cancelLabel="返回档案"
            onChange={setForm}
            extraSection={<FamilyBodyReportEditor form={bodyReportForm} onChange={setBodyReportForm} />}
            dangerAction={
              <button type="button" className="ghost-button small family-editor-card__danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                删除
              </button>
            }
          />
        </div>
      )}
    </Screen>
  );
}
