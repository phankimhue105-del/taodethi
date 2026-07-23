import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  Table as TableIcon,
  Download,
  Printer,
  Copy,
  Sparkles,
  Edit3,
  Globe,
  ArrowLeft,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ExamPackage, Question } from '../types';

interface ExamViewerProps {
  exam: ExamPackage;
  onBack: () => void;
  onEditQuestion: (question: Question) => void;
}

export const ExamViewer: React.FC<ExamViewerProps> = ({
  exam,
  onBack,
  onEditQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'exam' | 'answers' | 'matrix' | 'sources'>('exam');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  // Toggle explanation expansion
  const toggleExplanation = (id: string) => {
    setExpandedExplanations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Export DOCX
  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      const response = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam }),
      });

      if (!response.ok) {
        throw new Error('Lỗi khi xuất file Word.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `De_Thi_${exam.subject}_Lop${exam.grade}_Ma${exam.examCode}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Không thể tạo file Word: ' + err.message);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    let text = `${exam.departmentName.toUpperCase()}\n${exam.schoolName.toUpperCase()}\n`;
    text += `${exam.examTitle.toUpperCase()}\nMôn: ${exam.subjectName} - Lớp ${exam.grade}\nThời gian: ${exam.durationMinutes} phút | Mã đề: ${exam.examCode}\n\n`;

    exam.questions.forEach((q) => {
      if (q.sectionTitle) text += `\n--- ${q.sectionTitle} ---\n`;
      if (q.readingPassage) text += `[Ngữ liệu]: ${q.readingPassage}\n`;
      text += `Câu ${q.number} (${q.points}đ) [${q.level}]: ${q.content}\n`;
      if (q.options) {
        q.options.forEach((opt) => (text += `  ${opt}\n`));
      }
      if (q.subStatements) {
        q.subStatements.forEach((s) => (text += `  ${s.label}) ${s.text}\n`));
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Group questions by section Title
  const groupedQuestions: Record<string, Question[]> = {};
  exam.questions.forEach((q) => {
    const section = q.sectionTitle || 'CÂU HỎI KIỂM TRA';
    if (!groupedQuestions[section]) groupedQuestions[section] = [];
    groupedQuestions[section].push(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Quay lại tùy chỉnh đề thi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <span>{exam.examTitle}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                Mã đề {exam.examCode}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Môn: {exam.subjectName} • Lớp {exam.grade} • {exam.durationMinutes} phút • Tổng câu: {exam.questions.length}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingDocx ? 'Đang tạo .docx...' : 'Tải Word (.docx)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>In / Lưu PDF</span>
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-px print:hidden">
        <button
          onClick={() => setActiveTab('exam')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'exam'
              ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Đề kiểm tra</span>
        </button>

        <button
          onClick={() => setActiveTab('answers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'answers'
              ? 'border-emerald-600 text-emerald-600 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Đáp án & Hướng dẫn chấm</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Ma trận & Bản đặc tả</span>
        </button>

        {exam.groundingSources && exam.groundingSources.length > 0 && (
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'sources'
                ? 'border-amber-600 text-amber-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Nguồn tài liệu mở ({exam.groundingSources.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: EXAM PAPER VIEW */}
      {(activeTab === 'exam' || window.matchMedia('print').matches) && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 font-serif text-slate-900 leading-relaxed print:border-none print:shadow-none print:p-0">
          {/* Official Exam Header */}
          <div className="grid grid-cols-2 gap-4 border-b-2 border-slate-900 pb-4 mb-6">
            <div className="text-center font-sans font-bold text-xs sm:text-sm">
              <p className="uppercase">{exam.departmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}</p>
              <p className="uppercase text-blue-900 print:text-black">
                {exam.schoolName || 'TRƯỜNG THPT / THCS'}
              </p>
              <div className="w-16 h-0.5 bg-slate-900 mx-auto my-1"></div>
            </div>

            <div className="text-center font-sans font-bold text-xs sm:text-sm">
              <p className="uppercase text-blue-900 print:text-black">{exam.examTitle}</p>
              <p className="uppercase text-xs text-slate-700">
                MÔN: {exam.subjectName} - LỚP {exam.grade}
              </p>
              <p className="text-[11px] font-normal italic text-slate-600 mt-0.5">
                Thời gian làm bài: {exam.durationMinutes} phút (Không kể thời gian phát đề)
              </p>
              <p className="text-xs font-bold mt-1">Mã đề thi: {exam.examCode}</p>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="font-sans text-xs sm:text-sm p-3 border border-slate-300 rounded-lg mb-6 flex flex-col sm:flex-row justify-between gap-2 italic">
            <span>Họ và tên thí sinh: ............................................................................</span>
            <span>Số báo danh: .............................</span>
          </div>

          {/* Render Sections and Questions */}
          <div className="space-y-6">
            {Object.entries(groupedQuestions).map(([sectionTitle, questions]) => (
              <div key={sectionTitle} className="space-y-4">
                <h3 className="font-sans font-bold text-sm sm:text-base text-blue-900 border-b border-slate-200 pb-1.5 uppercase print:text-black">
                  {sectionTitle}
                </h3>

                <div className="space-y-5">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="group relative p-4 rounded-xl transition-all hover:bg-slate-50/80 border border-transparent hover:border-slate-200"
                    >
                      {/* Interactive Edit Button for Question (Hidden in Print) */}
                      <button
                        onClick={() => onEditQuestion(q)}
                        className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-sans font-bold shadow-md hover:bg-blue-500 transition-all cursor-pointer print:hidden"
                        title="Chỉnh sửa câu hỏi này với AI"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Sửa với AI</span>
                      </button>

                      {/* Reading Passage if any */}
                      {q.readingPassage && (
                        <div className="p-4 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl mb-3 text-xs sm:text-sm italic text-slate-800 font-sans">
                          {q.passageHeader && (
                            <p className="font-bold not-italic mb-1 text-blue-900">{q.passageHeader}</p>
                          )}
                          <p className="whitespace-pre-line">{q.readingPassage}</p>
                        </div>
                      )}

                      {/* Question Content */}
                      <div className="text-sm sm:text-base text-slate-900 font-medium">
                        <span className="font-sans font-bold text-blue-900 print:text-black">
                          Câu {q.number} ({q.points} điểm) [{q.level}]:{' '}
                        </span>
                        <span>{q.content}</span>
                      </div>

                      {/* Question Options (Multiple Choice) */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pl-4 text-sm font-sans">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className="p-1 text-slate-800">
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Question Sub-statements (True / False) */}
                      {q.type === 'true_false' && q.subStatements && (
                        <div className="mt-3 pl-4 space-y-1.5 font-sans text-sm">
                          {q.subStatements.map((stmt) => (
                            <div key={stmt.label} className="flex items-start gap-2">
                              <span className="font-bold text-blue-900">{stmt.label})</span>
                              <span>{stmt.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Short Answer Space */}
                      {q.type === 'short_answer' && (
                        <div className="mt-3 pl-4 font-sans text-xs italic text-slate-500">
                          Trả lời: ............................................................................................................................
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Exam Footer */}
          <div className="mt-10 pt-4 border-t border-slate-300 text-center font-sans text-xs text-slate-600 italic">
            <p className="font-bold uppercase text-slate-800 not-italic mb-1">
              ------------------ HẾT ------------------
            </p>
            <p>{exam.generalInstructions || 'Cán bộ coi thi không giải thích gì thêm.'}</p>
          </div>
        </div>
      )}

      {/* TAB 2: ANSWER KEY & DETAILED SOLUTIONS VIEW */}
      {activeTab === 'answers' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                ĐÁP ÁN & HƯỚNG DẪN CHẤM CHI TIẾT
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kèm thang điểm chi tiết từng bước giải theo quy chuẩn GDPT 2018
              </p>
            </div>
          </div>

          {/* Quick Answer Key Matrix */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Bảng Tổng Hợp Đáp Án Nhanh
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-semibold">
              {exam.questions.map((q) => (
                <div
                  key={q.id}
                  className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <span className="text-slate-500">Câu {q.number}:</span>
                  <span className="font-bold text-blue-700 truncate ml-1">{q.correctAnswer}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Solutions list */}
          <div className="space-y-4">
            {exam.questions.map((q) => (
              <div
                key={q.id}
                className="p-4 border border-slate-200 rounded-2xl space-y-2 hover:border-blue-300 transition-all bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-blue-900">
                    Câu {q.number} ({q.points} điểm) [{q.level}] - {q.topic}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
                    Đáp án: {q.correctAnswer}
                  </span>
                </div>

                <p className="text-xs text-slate-700 italic border-l-2 border-slate-300 pl-3 py-1">
                  "{q.content}"
                </p>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => toggleExplanation(q.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <span>Hướng dẫn giải chi tiết & Thang điểm</span>
                    {expandedExplanations[q.id] ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {expandedExplanations[q.id] !== false && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-line border border-slate-200/60">
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MATRIX & SPECIFICATIONS VIEW */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
          <div>
            <h2 className="font-bold text-lg text-slate-900">
              MA TRẬN & BẢN ĐẶC TẢ ĐỀ THI (GDPT 2018)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cấu trúc phân bổ câu hỏi theo mạch kiến thức và cấp độ năng lực
            </p>
          </div>

          {/* Table 1: Ma trận đề thi */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-blue-600" />
              <span>1. MA TRẬN ĐỀ KIỂM TRA</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="p-2.5 border border-slate-200">STT</th>
                    <th className="p-2.5 border border-slate-200">Chủ đề / Mạch kiến thức</th>
                    <th className="p-2.5 border border-slate-200 text-center">Nhận biết ({exam.cognitiveLevels.remembering}%)</th>
                    <th className="p-2.5 border border-slate-200 text-center">Thông hiểu ({exam.cognitiveLevels.understanding}%)</th>
                    <th className="p-2.5 border border-slate-200 text-center">Vận dụng ({exam.cognitiveLevels.applying}%)</th>
                    <th className="p-2.5 border border-slate-200 text-center">Vận dụng cao ({exam.cognitiveLevels.highApplying}%)</th>
                    <th className="p-2.5 border border-slate-200 text-center">Tổng số câu</th>
                    <th className="p-2.5 border border-slate-200 text-center">Tổng điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {exam.matrix.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-medium">{index + 1}</td>
                      <td className="p-2.5 border border-slate-200 font-bold text-slate-800">{row.topic}</td>
                      <td className="p-2.5 border border-slate-200 text-center">{row.rememberingCount} câu</td>
                      <td className="p-2.5 border border-slate-200 text-center">{row.understandingCount} câu</td>
                      <td className="p-2.5 border border-slate-200 text-center">{row.applyingCount} câu</td>
                      <td className="p-2.5 border border-slate-200 text-center">{row.highApplyingCount} câu</td>
                      <td className="p-2.5 border border-slate-200 text-center font-bold">{row.totalQuestions}</td>
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-blue-700">{row.totalPoints}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Bản đặc tả đề thi */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-emerald-600" />
              <span>2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA (YÊU CẦU CẦN ĐẠT GDPT 2018)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="p-2.5 border border-slate-200">STT</th>
                    <th className="p-2.5 border border-slate-200">Chủ đề</th>
                    <th className="p-2.5 border border-slate-200">Yêu cầu cần đạt chuẩn GDPT 2018</th>
                    <th className="p-2.5 border border-slate-200 text-center">Câu hỏi tương ứng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {exam.specifications.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-medium">{index + 1}</td>
                      <td className="p-2.5 border border-slate-200 font-bold text-slate-800">{row.topic}</td>
                      <td className="p-2.5 border border-slate-200 whitespace-pre-line text-slate-700">{row.competencyRequirement}</td>
                      <td className="p-2.5 border border-slate-200 text-center font-semibold text-blue-700">{row.questionNumbers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GROUNDING SOURCES */}
      {activeTab === 'sources' && exam.groundingSources && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Globe className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-lg text-slate-900">
              NGUỒN TRUY XUẤT NGUYÊN BẢN INTERNET
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            AI đã tự động tra cứu, chọn lọc và tích hợp các tài liệu/ngữ liệu mở uy tín sau để xây dựng đề thi:
          </p>

          <div className="space-y-2">
            {exam.groundingSources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group"
              >
                <div className="truncate pr-4">
                  <p className="font-bold text-xs text-slate-800 group-hover:text-blue-700 truncate">
                    {source.title}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{source.url}</p>
                </div>
                <Globe className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
