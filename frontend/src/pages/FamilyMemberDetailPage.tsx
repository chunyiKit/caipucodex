import { useRef, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getFamilyMember, ocrFamilyMemberBodyReport } from '@/api/familyMembers';
import { EmptyState } from '@/components/EmptyState';
import { FamilyBodyReport } from '@/components/FamilyBodyReport';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { prepareBodyReportImage } from '@/utils/image';

export function FamilyMemberDetailPage() {
  const { isDesktop } = useBreakpoint();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const query = useQuery({
    queryKey: ['family-member', id],
    queryFn: () => getFamilyMember(id!),
    enabled: Boolean(id),
  });

  const ocrMutation = useMutation({
    mutationFn: async (file: File) => {
      const prepared = await prepareBodyReportImage(file);
      return ocrFamilyMemberBodyReport(id!, prepared);
    },
    onSuccess: async (member) => {
      queryClient.setQueryData(['family-member', id], member);
      await queryClient.invalidateQueries({ queryKey: ['family-members'] });
      showToast('身体参数已更新');
    },
    onError: (error: Error) => showToast(error.message || '识别失败，请稍后重试', 'error'),
  });

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    ocrMutation.mutate(file);
  };

  return (
    <Screen className={isDesktop ? 'family-detail-page family-detail-page--desktop' : 'family-detail-page'}>
      <TopBar title="成员档案" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handleUpload}
      />

      {query.isPending ? (
        <div className="detail-card family-detail-skeleton" />
      ) : query.isError || !query.data ? (
        <EmptyState
          icon="🧾"
          accent="warm"
          title="成员档案暂时打不开"
          description="可能成员已被删除，或数据还没同步出来。"
          action={
            <button type="button" className="primary-button inline-button" onClick={() => navigate('/profile')}>
              返回我的
            </button>
          }
        />
      ) : (
        <FamilyBodyReport
          member={query.data}
          onEdit={() => navigate(`/profile/family-members/${query.data.id}/edit`)}
          onUpload={() => fileInputRef.current?.click()}
          isUploading={ocrMutation.isPending}
          isDesktop={isDesktop}
        />
      )}
    </Screen>
  );
}
