import { assetUrl } from '@/api/client';
import { FamilyMemberAvatar } from '@/components/FamilyMemberAvatar';
import type { FamilyMember } from '@/types';

interface FamilyBodyReportProps {
  member: FamilyMember;
  onEdit: () => void;
  onUpload: () => void;
  isUploading: boolean;
  isDesktop?: boolean;
}

function formatNumber(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return Number(value).toFixed(digits).replace(/\.0$/, '');
}

function formatDelta(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) return '';
  const sign = value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(digits).replace(/\.0$/, '')}`;
}

function getStatusTone(status?: string | null) {
  if (!status) return 'muted';
  if (/(标准|正常|健康|良好)/.test(status)) return 'ok';
  if (/(不足|偏低|偏瘦)/.test(status)) return 'cool';
  return 'warn';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

function formatHeight(heightCm?: number | null) {
  return heightCm ? `${heightCm} cm` : '待填写';
}

function formatSignature(signature?: string | null) {
  return signature?.trim() || '这个成员还没有填写个人签名。';
}

function MetricCard({
  label,
  value,
  unit,
  delta,
  status,
}: {
  label: string;
  value?: number | null;
  unit?: string;
  delta?: number | null;
  status?: string | null;
}) {
  const tone = getStatusTone(status);

  return (
    <article className="family-body-metric-card">
      <div className="family-body-metric-card__value">
        <strong>{formatNumber(value)}</strong>
        {unit ? <span>{unit}</span> : null}
      </div>
      <div className="family-body-metric-card__meta">
        <p>{label}</p>
        {delta || delta === 0 ? <small>{delta === 0 ? '持平' : `${delta > 0 ? '↑' : '↓'} ${formatDelta(delta).replace('+', '')}`}</small> : null}
      </div>
      {status ? <em className={`family-status family-status--${tone}`}>{status}</em> : null}
    </article>
  );
}

function CompositionRow({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="family-body-composition__row">
      <span>{label}</span>
      <strong>{formatNumber(value)} 斤</strong>
    </div>
  );
}

export function FamilyBodyReport({ member, onEdit, onUpload, isUploading, isDesktop = false }: FamilyBodyReportProps) {
  const report = member.body_report;
  const compactMetrics = report
    ? [
        { label: '肌肉量', value: report.muscle_mass_jin, unit: '斤', status: report.muscle_mass_status },
        { label: '肌肉率', value: report.muscle_rate_pct, unit: '%', delta: report.muscle_rate_delta, status: report.muscle_rate_status },
        { label: '身体水分', value: report.body_water_pct, unit: '%', delta: report.body_water_delta, status: report.body_water_status },
        { label: '蛋白质率', value: report.protein_pct, unit: '%', delta: report.protein_delta, status: report.protein_status },
        { label: '盐量率', value: report.salt_pct, unit: '%', delta: report.salt_delta, status: report.salt_status },
        { label: '基础代谢', value: report.bmr_kcal, unit: 'kcal', delta: report.bmr_delta, status: report.bmr_status },
        { label: '内脏脂肪', value: report.visceral_fat_level, status: report.visceral_fat_status },
        { label: '身体年龄', value: report.metabolic_age_years, unit: '岁' },
        { label: '腰臀比', value: report.waist_hip_ratio, delta: null, status: report.waist_hip_status },
        { label: '去脂体重', value: report.fat_free_mass_jin, unit: '斤', delta: report.fat_free_mass_delta },
      ]
    : [];

  return (
    <div className={`family-detail-layout family-detail-layout--report ${isDesktop ? 'family-detail-layout--desktop' : ''}`.trim()}>
      <section className="hero-card hero-card--welcome family-detail-hero family-detail-hero--redesigned">
        <div className="family-detail-hero__top">
          <div className="family-detail-hero__identity">
            <FamilyMemberAvatar name={member.name} avatarUrl={member.avatar_url} large />
            <div className="family-detail-hero__heading">
              <p className="eyebrow">Member Health Profile</p>
              <h1>{member.name}</h1>
              <p>{formatSignature(member.signature)}</p>
              <small>{report?.measured_at ? `最近体测 ${report.measured_at}` : `档案创建于 ${formatDate(member.created_at)}`}</small>
            </div>
          </div>
          <div className="family-section-head__actions">
            <button type="button" className="primary-button inline-button" onClick={onUpload} disabled={isUploading}>
              {isUploading ? '识别中...' : '上传体测截图'}
            </button>
            <button type="button" className="secondary-button inline-button" onClick={onEdit}>
              编辑资料
            </button>
          </div>
        </div>

        <div className="family-detail-hero__body">
          <div className="family-weight-panel">
            <p className="eyebrow">Latest Reading</p>
            <div className="family-weight-panel__value">
              <strong>{formatNumber(report?.weight_jin)}</strong>
              <span>斤</span>
            </div>
            <div className="family-weight-panel__meta">
              <span>{report?.body_type || '等待识别'}</span>
              <small>
                {report?.weight_delta_jin !== null && report?.weight_delta_jin !== undefined
                  ? `相比上次 ${report.weight_delta_jin > 0 ? '上升' : report.weight_delta_jin < 0 ? '下降' : '持平'} ${report.weight_delta_jin ? `${formatNumber(Math.abs(report.weight_delta_jin))} 斤` : ''}`.trim()
                  : '上传截图后自动更新最新身体参数'}
              </small>
            </div>
          </div>

          <div className="family-overview-panel">
            <article className="family-overview-card family-overview-card--score">
              <p>身体得分</p>
              <strong>{report?.score ?? '--'}</strong>
              <span>{report?.advice || '上传同样样式的体测图后，这里会显示识别出的建议。'}</span>
            </article>
            <article className="family-overview-card">
              <p>BMI</p>
              <strong>{formatNumber(report?.bmi)}</strong>
              <span>{report?.bmi_status || '待识别'}</span>
            </article>
            <article className="family-overview-card">
              <p>体脂率</p>
              <strong>{formatNumber(report?.body_fat_pct)}%</strong>
              <span>{report?.body_fat_status || '待识别'}</span>
            </article>
          </div>
        </div>
      </section>

      {report ? (
        <>
          <section className="detail-card family-body-composition-card">
            <div className="family-section-head">
              <div>
                <p className="eyebrow">Composition</p>
                <h2>人体成分组成</h2>
              </div>
              <span className="pill pill--plain">{report.source_device || 'OCR 识别结果'}</span>
            </div>
            <div className="family-body-composition">
              <div className="family-body-composition__list">
                <CompositionRow label="体水分量" value={report.water_mass_jin} />
                <CompositionRow label="脂肪量" value={report.fat_mass_jin} />
                <CompositionRow label="骨盐量" value={report.bone_mass_jin} />
                <CompositionRow label="蛋白质量" value={report.protein_mass_jin} />
              </div>
            </div>
          </section>

          <section className="family-body-metric-grid">
            {compactMetrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </section>

          <section className="detail-card family-body-advice-card">
            <div className="family-section-head">
              <div>
                <p className="eyebrow">Recommendation</p>
                <h2>体重建议</h2>
              </div>
              {report.body_type ? <span className="pill pill--plain">身体类型 {report.body_type}</span> : null}
            </div>
            <div className="family-body-advice-grid">
              <div className="family-body-advice-item">
                <span>标准体重</span>
                <strong>{formatNumber(report.standard_weight_jin)} 斤</strong>
              </div>
              <div className="family-body-advice-item">
                <span>体重控制</span>
                <strong>{formatNumber(report.weight_control_jin)} 斤</strong>
              </div>
              <div className="family-body-advice-item">
                <span>脂肪控制</span>
                <strong>{formatNumber(report.fat_control_jin)} 斤</strong>
              </div>
              <div className="family-body-advice-item">
                <span>肌肉控制</span>
                <strong>{report.muscle_control || '--'}</strong>
              </div>
            </div>
          </section>

          {report.source_image_url ? (
            <section className="detail-card family-body-source-card">
              <div className="family-section-head">
                <div>
                  <p className="eyebrow">Source</p>
                  <h2>最近识别截图</h2>
                </div>
                {report.measured_at ? <span className="pill pill--plain">{report.measured_at}</span> : null}
              </div>
              <div className="family-body-source-card__content">
                <img src={assetUrl(report.source_image_url)} alt={`${member.name} 的体测截图`} />
                <div>
                  <p>后续继续上传同样样式的体脂秤截图，系统会覆盖为最新一份身体数据。</p>
                  {report.advice ? <strong>{report.advice}</strong> : null}
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="detail-card family-report-empty-card">
          <p className="eyebrow">Body Report</p>
          <h2>还没有体测数据</h2>
          <p>上传你定期保存的体脂秤截图后，页面会自动识别体重、BMI、体脂率、肌肉率和建议信息，并按这张参考图的结构整理展示。</p>
          <button type="button" className="primary-button inline-button" onClick={onUpload} disabled={isUploading}>
            {isUploading ? '识别中...' : '立即上传截图'}
          </button>
        </section>
      )}

      <section className="detail-card family-detail-card">
        <div className="family-section-head">
          <div>
            <p className="eyebrow">Profile</p>
            <h2>成员基础档案</h2>
          </div>
        </div>
        <div className="family-detail-grid family-detail-grid--profile">
          <div className="family-detail-item">
            <span>名字</span>
            <strong>{member.name}</strong>
          </div>
          <div className="family-detail-item">
            <span>身高</span>
            <strong>{formatHeight(member.height_cm)}</strong>
          </div>
          <div className="family-detail-item">
            <span>创建时间</span>
            <strong>{formatDate(member.created_at)}</strong>
          </div>
          <div className="family-detail-item">
            <span>最近更新</span>
            <strong>{formatDate(member.updated_at)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
