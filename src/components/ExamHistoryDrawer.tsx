import React from 'react';
import { History, X, Trash2, Calendar, BookOpen, Clock, ChevronRight } from 'lucide-react';
import type { ExamPackage } from '../types';

interface ExamHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedExams: ExamPackage[];
  onSelectExam: (exam: ExamPackage) => void;
  onDeleteExam: (id: string) => void;
  onClearAll: () => void;
}

export const ExamHistoryDrawer: React.FC<ExamHistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedExams,
  onSelectExam,
  onDeleteExam,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Lịch Sử Đề Thi Đã Tạo</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedExams.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <History className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-medium">Chưa có đề thi nào được lưu.</p>
              <p className="text-xs text-slate-400">
                Hãy tiến hành tạo đề thi mới để lưu vào lịch sử.
              </p>
            </div>
          ) : (
            savedExams.map((exam) => (
              <div
                key={exam.id}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all flex items-center justify-between group"
              >
                <div
                  onClick={() => {
                    onSelectExam(exam);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer pr-3"
                >
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700 line-clamp-1">
                    {exam.examTitle}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold text-blue-800">{exam.subjectName}</span>
                    <span>•</span>
                    <span>Lớp {exam.grade}</span>
                    <span>•</span>
                    <span>{exam.durationMinutes}'</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(exam.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onDeleteExam(exam.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-all"
                    title="Xóa đề thi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {savedExams.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Tổng số: {savedExams.length} đề thi
            </span>
            <button
              onClick={onClearAll}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
