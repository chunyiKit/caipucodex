import { type ChangeEvent, type RefObject } from 'react';
import { FamilyMemberAvatar } from '@/components/FamilyMemberAvatar';

export interface FamilyMemberFormState {
  name: string;
  height_cm: string;
  avatar_url: string;
  signature: string;
}

interface FamilyMemberFormPanelProps {
  title: string;
  eyebrow: string;
  form: FamilyMemberFormState;
  hint: string;
  fileInputRef: RefObject<HTMLInputElement>;
  isUploading: boolean;
  isSaving: boolean;
  saveLabel: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  cancelLabel: string;
  onChange: (next: FamilyMemberFormState) => void;
  dangerAction?: React.ReactNode;
  extraSection?: React.ReactNode;
}

export function FamilyMemberFormPanel({
  title,
  eyebrow,
  form,
  hint,
  fileInputRef,
  isUploading,
  isSaving,
  saveLabel,
  onFileChange,
  onSave,
  onCancel,
  cancelLabel,
  onChange,
  dangerAction,
  extraSection,
}: FamilyMemberFormPanelProps) {
  const previewName = form.name.trim() || '新成员';

  return (
    <section className="detail-card family-editor-card family-create-card">
      <div className="family-section-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {dangerAction}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        hidden
        onChange={onFileChange}
      />

      <button
        type="button"
        className="family-avatar-stage"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <FamilyMemberAvatar name={previewName} avatarUrl={form.avatar_url} large />
        <div>
          <strong>{isUploading ? '头像上传中...' : '上传自定义头像'}</strong>
          <span>支持 PNG、JPG、WEBP、SVG，上传后会直接写入后端文件存储。</span>
        </div>
      </button>

      <label className="field-label" htmlFor="family-member-form-name">
        名字
      </label>
      <input
        id="family-member-form-name"
        className="text-input"
        value={form.name}
        onChange={(event) => onChange({ ...form, name: event.target.value })}
        placeholder="例如：妈妈、小宝、爷爷"
      />

      <label className="field-label" htmlFor="family-member-form-height">
        身高（cm）
      </label>
      <div className="family-input-with-suffix">
        <input
          id="family-member-form-height"
          className="text-input"
          inputMode="numeric"
          value={form.height_cm}
          onChange={(event) => onChange({ ...form, height_cm: event.target.value.replace(/[^\d]/g, '') })}
          placeholder="例如：168"
        />
        <span>cm</span>
      </div>

      <label className="field-label" htmlFor="family-member-form-signature">
        个人签名
      </label>
      <textarea
        id="family-member-form-signature"
        className="text-area"
        value={form.signature}
        onChange={(event) => onChange({ ...form, signature: event.target.value })}
        placeholder="请输入个人签名"
      />

      {extraSection}

      <p className="family-editor-card__hint">{hint}</p>

      <div className="family-editor-card__actions">
        <button type="button" className="primary-button" onClick={onSave} disabled={isSaving || isUploading}>
          {isSaving ? '保存中...' : saveLabel}
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </section>
  );
}
