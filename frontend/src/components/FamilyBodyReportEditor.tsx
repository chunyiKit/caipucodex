import type { FamilyMemberBodyReport } from '@/types';

type FieldKind = 'text' | 'textarea' | 'number' | 'int';

interface BodyReportFieldConfig {
  key: keyof FamilyMemberBodyReport;
  label: string;
  kind: FieldKind;
}

interface BodyReportFieldGroup {
  title: string;
  description: string;
  fields: BodyReportFieldConfig[];
}

const BODY_REPORT_GROUPS: BodyReportFieldGroup[] = [
  {
    title: '识别概览',
    description: '体测时间、设备、建议等基础信息。',
    fields: [
      { key: 'measured_at', label: '体测时间', kind: 'text' },
      { key: 'source_device', label: '设备来源', kind: 'text' },
      { key: 'body_type', label: '身体类型', kind: 'text' },
      { key: 'score', label: '身体得分', kind: 'int' },
      { key: 'advice', label: '建议说明', kind: 'textarea' },
    ],
  },
  {
    title: '核心指标',
    description: '首页主要展示的体重、BMI 和体脂率。',
    fields: [
      { key: 'weight_jin', label: '体重(斤)', kind: 'number' },
      { key: 'weight_delta_jin', label: '体重变化(斤)', kind: 'number' },
      { key: 'bmi', label: 'BMI', kind: 'number' },
      { key: 'bmi_delta', label: 'BMI变化', kind: 'number' },
      { key: 'bmi_status', label: 'BMI状态', kind: 'text' },
      { key: 'body_fat_pct', label: '体脂率(%)', kind: 'number' },
      { key: 'body_fat_delta', label: '体脂率变化', kind: 'number' },
      { key: 'body_fat_status', label: '体脂状态', kind: 'text' },
    ],
  },
  {
    title: '人体成分',
    description: '体水分量、脂肪量、蛋白质量、骨盐量和肌肉量。',
    fields: [
      { key: 'water_mass_jin', label: '体水分量(斤)', kind: 'number' },
      { key: 'fat_mass_jin', label: '脂肪量(斤)', kind: 'number' },
      { key: 'protein_mass_jin', label: '蛋白质量(斤)', kind: 'number' },
      { key: 'bone_mass_jin', label: '骨盐量(斤)', kind: 'number' },
      { key: 'muscle_mass_jin', label: '肌肉量(斤)', kind: 'number' },
      { key: 'muscle_mass_status', label: '肌肉量状态', kind: 'text' },
    ],
  },
  {
    title: '身体参数',
    description: '肌肉率、水分率、蛋白质率和盐量率。',
    fields: [
      { key: 'muscle_rate_pct', label: '肌肉率(%)', kind: 'number' },
      { key: 'muscle_rate_delta', label: '肌肉率变化', kind: 'number' },
      { key: 'muscle_rate_status', label: '肌肉率状态', kind: 'text' },
      { key: 'body_water_pct', label: '身体水分(%)', kind: 'number' },
      { key: 'body_water_delta', label: '身体水分变化', kind: 'number' },
      { key: 'body_water_status', label: '身体水分状态', kind: 'text' },
      { key: 'protein_pct', label: '蛋白质率(%)', kind: 'number' },
      { key: 'protein_delta', label: '蛋白质率变化', kind: 'number' },
      { key: 'protein_status', label: '蛋白质率状态', kind: 'text' },
      { key: 'salt_pct', label: '盐量率(%)', kind: 'number' },
      { key: 'salt_delta', label: '盐量率变化', kind: 'number' },
      { key: 'salt_status', label: '盐量率状态', kind: 'text' },
    ],
  },
  {
    title: '代谢和脂肪',
    description: '内脏脂肪、基础代谢、腰臀比、身体年龄等。',
    fields: [
      { key: 'visceral_fat_level', label: '内脏脂肪等级', kind: 'int' },
      { key: 'visceral_fat_delta', label: '内脏脂肪变化', kind: 'number' },
      { key: 'visceral_fat_status', label: '内脏脂肪状态', kind: 'text' },
      { key: 'bmr_kcal', label: '基础代谢(kcal)', kind: 'int' },
      { key: 'bmr_delta', label: '基础代谢变化', kind: 'number' },
      { key: 'bmr_status', label: '基础代谢状态', kind: 'text' },
      { key: 'waist_hip_ratio', label: '腰臀比', kind: 'number' },
      { key: 'waist_hip_status', label: '腰臀比状态', kind: 'text' },
      { key: 'metabolic_age_years', label: '身体年龄', kind: 'int' },
      { key: 'fat_free_mass_jin', label: '去脂体重(斤)', kind: 'number' },
      { key: 'fat_free_mass_delta', label: '去脂体重变化', kind: 'number' },
    ],
  },
  {
    title: '体重建议',
    description: '标准体重与控制建议，可手动修正。',
    fields: [
      { key: 'standard_weight_jin', label: '标准体重(斤)', kind: 'number' },
      { key: 'weight_control_jin', label: '体重控制(斤)', kind: 'number' },
      { key: 'fat_control_jin', label: '脂肪控制(斤)', kind: 'number' },
      { key: 'muscle_control', label: '肌肉控制', kind: 'text' },
    ],
  },
];

type EditableBodyReportKey = (typeof BODY_REPORT_GROUPS)[number]['fields'][number]['key'];

export type FamilyBodyReportFormState = Record<EditableBodyReportKey, string>;

function getEmptyValue() {
  return '';
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function parseFieldValue(rawValue: string, kind: FieldKind) {
  const value = rawValue.trim();
  if (!value) return null;
  if (kind === 'text' || kind === 'textarea') return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return kind === 'int' ? Math.round(parsed) : parsed;
}

export function createFamilyBodyReportForm(report?: FamilyMemberBodyReport | null): FamilyBodyReportFormState {
  const next = {} as FamilyBodyReportFormState;
  for (const group of BODY_REPORT_GROUPS) {
    for (const field of group.fields) {
      next[field.key as EditableBodyReportKey] = stringifyValue(report?.[field.key]);
    }
  }
  return next;
}

export function buildFamilyBodyReportPayload(
  form: FamilyBodyReportFormState,
  baseReport?: FamilyMemberBodyReport | null,
): FamilyMemberBodyReport | null {
  const next: FamilyMemberBodyReport = { ...(baseReport || {}) };
  for (const group of BODY_REPORT_GROUPS) {
    for (const field of group.fields) {
      next[field.key] = parseFieldValue(form[field.key as EditableBodyReportKey], field.kind) as never;
    }
  }

  const hasData = Object.entries(next).some(([key, value]) => key !== 'source_image_url' && value !== null && value !== undefined && value !== '');
  return hasData ? next : null;
}

interface FamilyBodyReportEditorProps {
  form: FamilyBodyReportFormState;
  onChange: (next: FamilyBodyReportFormState) => void;
}

export function FamilyBodyReportEditor({ form, onChange }: FamilyBodyReportEditorProps) {
  return (
    <section className="family-body-editor">
      <div className="family-body-editor__header">
        <p className="eyebrow">Manual Adjustments</p>
        <h3>体测数据手动修正</h3>
        <span>OCR 识别错了可以直接在这里改，保存后会覆盖成员档案里的展示数据。</span>
      </div>

      {BODY_REPORT_GROUPS.map((group) => (
        <div key={group.title} className="family-body-editor__group">
          <div className="family-body-editor__group-head">
            <strong>{group.title}</strong>
            <span>{group.description}</span>
          </div>
          <div className="family-body-editor__grid">
            {group.fields.map((field) => {
              const value = form[field.key as EditableBodyReportKey] ?? getEmptyValue();
              const isWide = field.kind === 'textarea';
              const inputMode = field.kind === 'int' ? 'numeric' : field.kind === 'number' ? 'decimal' : 'text';

              return (
                <label
                  key={String(field.key)}
                  className={`family-body-editor__field ${isWide ? 'family-body-editor__field--wide' : ''}`.trim()}
                >
                  <span className="field-label">{field.label}</span>
                  {field.kind === 'textarea' ? (
                    <textarea
                      className="text-area"
                      value={value}
                      onChange={(event) => onChange({ ...form, [field.key]: event.target.value })}
                      placeholder={`手动填写${field.label}`}
                    />
                  ) : (
                    <input
                      className="text-input"
                      inputMode={inputMode}
                      value={value}
                      onChange={(event) => onChange({ ...form, [field.key]: event.target.value })}
                      placeholder={`手动填写${field.label}`}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
