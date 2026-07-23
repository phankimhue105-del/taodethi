import React, { useState } from 'react';
import { Sparkles, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { Question } from '../types';

interface QuestionEditModalProps {
  question: Question | null;
  subjectName: string;
  grade: string;
  onClose: () => void;
  onSaveUpdatedQuestion: (updated: Question) => void;
}

export const QuestionEditModal: React.FC<QuestionEditModalProps> = ({
  question,
  subjectName,
  grade,
  onClose,
  onSaveUpdatedQuestion,
}) => {
  const [instruction, setInstruction] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!question) return null;

  const handleApplyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/edit-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentQuestion: question,
          instruction,
          subjectName,
          grade,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Yêu cầu thất bại (Lỗi ${response.status}): ${errorText || response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Phản hồi từ máy chủ không phải JSON: ${text.substring(0, 300)}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Không thể chỉnh sửa câu hỏi.');
      }

      onSaveUpdatedQuestion(data.question);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối với AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Tăng độ khó lên cấp độ Vận dụng cao',
    'Thay đổi toàn bộ tham số / số liệu',
    'Chuyển thành câu hỏi liên hệ thực tế đời sống',
    'Giải thích chi tiết hơn nữa trong phần đáp án',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">
              Chỉnh Sửa Câu {question.number} Với AI
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleApplyEdit} className="p-6 space-y-4">
          {/* Current Question Preview */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="font-bold text-blue-900">Nội dung hiện tại:</span>
            <p className="text-slate-800 italic">{question.content}</p>
          </div>

          {/* Quick Preset Prompt Chips */}
          <div>
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">
              Gợi ý yêu cầu nhanh:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstruction(p)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Nhập hướng dẫn chỉnh sửa chi tiết cho AI:
            </label>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ví dụ: Đổi bài toán tìm x thành tìm diện tích hình chữ nhật; hoặc chọn bài thơ mới..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || !instruction.trim()}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                isLoading || !instruction.trim()
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Đang chỉnh sửa...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Áp dụng cập nhật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
