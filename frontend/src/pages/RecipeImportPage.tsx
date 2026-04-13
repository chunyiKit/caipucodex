import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle2, XCircle, FileJson, ChevronDown, ChevronUp } from 'lucide-react';
import { createRecipe } from '@/api/recipes';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/ToastProvider';
import { parseRecipeImportText, recipeImportExample } from '@/utils/recipeImport';

interface ImportFailure {
  name: string;
  reason: string;
}

export function RecipeImportPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [sourceText, setSourceText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [result, setResult] = useState<{ successNames: string[]; failures: ImportFailure[] } | null>(null);

  const handleImport = async () => {
    let payloads;
    try {
      payloads = parseRecipeImportText(sourceText);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSON 解析失败';
      setResult({ successNames: [], failures: [{ name: '格式校验', reason: message }] });
      showToast(message, 'error');
      return;
    }

    setIsImporting(true);
    const successNames: string[] = [];
    const failures: ImportFailure[] = [];

    for (const payload of payloads) {
      try {
        await createRecipe(payload);
        successNames.push(payload.name);
      } catch (error) {
        failures.push({
          name: payload.name,
          reason: error instanceof Error ? error.message : '保存失败',
        });
      }
    }

    setResult({ successNames, failures });
    setIsImporting(false);

    if (successNames.length) {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    }

    if (successNames.length && !failures.length) {
      showToast(`成功导入 ${successNames.length} 个菜谱`);
      return;
    }

    if (successNames.length) {
      showToast(`已导入 ${successNames.length} 个，另有 ${failures.length} 个失败`, 'error');
      return;
    }

    showToast('导入失败，请检查 JSON 内容', 'error');
  };

  const handleFillExample = () => {
    setSourceText(recipeImportExample);
    setResult(null);
    textareaRef.current?.focus();
  };

  const hasText = sourceText.trim().length > 0;

  return (
    <Screen>
      <TopBar title="导入菜谱" />

      <div className="max-w-[640px] mx-auto flex flex-col gap-5 pb-8">
        {/* Input area */}
        <div className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] grid place-items-center">
                <FileJson size={18} className="text-[var(--brand)]" />
              </div>
              <div>
                <h2 className="m-0 text-base font-semibold">粘贴 JSON 内容</h2>
                <p className="m-0 text-xs text-[var(--text-secondary)] mt-0.5">支持数组或 {"{"}"recipes": [...]{"}"} 格式</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFillExample}
              className="px-3 py-1.5 text-xs font-medium text-[var(--brand)] bg-[var(--brand-soft)] rounded-[var(--radius-button)] border-none hover:bg-[rgba(255,56,92,0.14)] transition-colors whitespace-nowrap flex-shrink-0"
            >
              填入示例
            </button>
          </div>

          <div className="px-5 pb-5">
            <textarea
              ref={textareaRef}
              className="w-full min-h-[200px] p-4 text-sm leading-relaxed font-mono rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] resize-y outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--brand)] focus:bg-white"
              placeholder={`{\n  "recipes": [\n    {\n      "name": "番茄炒蛋",\n      "category": "荤菜",\n      "ingredients": [...],\n      "cooking_steps": [...]\n    }\n  ]\n}`}
              value={sourceText}
              onChange={(event) => {
                setSourceText(event.target.value);
                setResult(null);
              }}
            />
          </div>

          <div className="px-5 pb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || !hasText}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[var(--radius-button)] border-none text-base font-semibold text-white bg-[var(--brand)] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[var(--brand-deep)]"
            >
              <Upload size={18} />
              {isImporting ? '导入中...' : '开始导入'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result ? (
          <div className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <h2 className="m-0 text-base font-semibold mb-3">导入结果</h2>

              {result.successNames.length > 0 && (
                <div className="flex gap-3 p-3 rounded-xl bg-[#e8f5e9] mb-3">
                  <CheckCircle2 size={18} className="text-[#2e7d32] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="m-0 text-sm font-medium text-[#2e7d32]">
                      成功导入 {result.successNames.length} 个菜谱
                    </p>
                    <p className="m-0 text-xs text-[#388e3c] mt-1">
                      {result.successNames.join('、')}
                    </p>
                  </div>
                </div>
              )}

              {result.failures.length > 0 && (
                <div className="flex gap-3 p-3 rounded-xl bg-[#fbe9e7]">
                  <XCircle size={18} className="text-[#c13515] flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-medium text-[#c13515]">
                      {result.failures.length} 个菜谱导入失败
                    </p>
                    <ul className="m-0 mt-1 pl-0 list-none">
                      {result.failures.map((failure) => (
                        <li key={`${failure.name}-${failure.reason}`} className="text-xs text-[#d32f2f] mt-1">
                          <span className="font-medium">{failure.name}</span>
                          <span className="text-[#c13515]/70 ml-1">— {failure.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {result.successNames.length > 0 && result.failures.length === 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/recipes')}
                  className="mt-2 w-full h-10 rounded-[var(--radius-button)] border border-[var(--border-color)] bg-white text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                >
                  查看菜谱列表
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Format reference - collapsible */}
        <div className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFormat((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-4 bg-transparent border-none text-left cursor-pointer hover:bg-[var(--surface-secondary)] transition-colors"
          >
            <div>
              <h3 className="m-0 text-sm font-semibold text-[var(--text-primary)]">格式说明</h3>
              <p className="m-0 text-xs text-[var(--text-secondary)] mt-0.5">必填与可选字段参考</p>
            </div>
            {showFormat ? (
              <ChevronUp size={18} className="text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--text-secondary)]" />
            )}
          </button>

          {showFormat && (
            <div className="px-5 pb-5 border-t border-[var(--border-color)]">
              <div className="mt-4 flex flex-col gap-3">
                <div>
                  <p className="m-0 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">必填字段</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['name', 'category', 'ingredients', 'cooking_steps'].map((field) => (
                      <span key={field} className="px-2 py-1 text-xs font-mono rounded-md bg-[var(--brand-soft)] text-[var(--brand)]">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="m-0 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">可选字段</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['description', 'cooking_time', 'difficulty', 'kcal', 'image_url'].map((field) => (
                      <span key={field} className="px-2 py-1 text-xs font-mono rounded-md bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1 mt-1">
                  <p className="m-0"><span className="font-medium text-[var(--text-primary)]">difficulty</span> 不写时默认"中等"，可选值：简单 / 中等 / 困难</p>
                  <p className="m-0"><span className="font-medium text-[var(--text-primary)]">ingredients</span> 和 <span className="font-medium text-[var(--text-primary)]">cooking_steps</span> 支持字符串数组或对象数组</p>
                </div>
              </div>

              <pre className="mt-4 p-4 rounded-xl bg-[var(--surface-secondary)] text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words text-[var(--text-secondary)]">
                {recipeImportExample}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}
