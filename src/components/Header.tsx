import React from 'react';
import { BookOpen, Sparkles, History, PlusCircle, FileCheck, ExternalLink } from 'lucide-react';

interface HeaderProps {
  onNewExam: () => void;
  onOpenHistory: () => void;
  savedExamsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewExam,
  onOpenHistory,
  savedExamsCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-none">
                STUDIO BIÊN SOẠN ĐỀ THI AI
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                GDPT 2018
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Chuẩn Ma trận • Bản đặc tả • Ngữ liệu mở • Đáp án chi tiết
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-all cursor-pointer"
            title="Xem danh sách các đề thi đã lưu"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Lịch sử đề thi</span>
            {savedExamsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-blue-600 text-white">
                {savedExamsCount}
              </span>
            )}
          </button>

          <button
            onClick={onNewExam}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo đề mới</span>
          </button>
        </div>
      </div>
    </header>
  );
};
