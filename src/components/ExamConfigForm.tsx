import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  Languages,
  Atom,
  UploadCloud,
  FileText,
  Sliders,
  Sparkles,
  CheckCircle2,
  Globe,
  AlertCircle,
  HelpCircle,
  X,
  FileCode,
  Zap,
} from 'lucide-react';
import type {
  Subject,
  Grade,
  CognitiveLevels,
  StructureConfig,
  UploadedFileRef,
  GenerateExamRequest,
} from '../types';
import { PRESET_EXAMS, ExamPreset } from '../data/presets';

interface ExamConfigFormProps {
  onSubmit: (config: GenerateExamRequest) => void;
  isLoading: boolean;
}

export const ExamConfigForm: React.FC<ExamConfigFormProps> = ({ onSubmit, isLoading }) => {
  const [subject, setSubject] = useState<Subject>('toan');
  const [grade, setGrade] = useState<Grade>('10');
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [schoolName, setSchoolName] = useState<string>('Trường THPT Chuyên Nguyễn Trãi');
  const [departmentName, setDepartmentName] = useState<string>('Sở Giáo dục và Đạo tạo');
  const [examTitle, setExamTitle] = useState<string>('ĐỀ KIỂM TRA GIỮA KỲ I - NĂM HỌC 2025 - 2026');
  const [examCode, setExamCode] = useState<string>('101');
  const [topics, setTopics] = useState<string>(
    'Hàm số bậc hai và đồ thị; Véctơ và các phép toán véctơ; Các bài toán ứng dụng thực tế.'
  );

  // Cognitive Matrix %
  const [cognitiveLevels, setCognitiveLevels] = useState<CognitiveLevels>({
    remembering: 40,
    understanding: 30,
    applying: 20,
    highApplying: 10,
  });

  // Question Structure GDPT 2018
  const [structure, setStructure] = useState<StructureConfig>({
    multipleChoiceCount: 12,
    trueFalseCount: 4,
    shortAnswerCount: 6,
    essayCount: 2,
  });

  const [useWebSearch, setUseWebSearch] = useState<boolean>(true);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileRef[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Check sum of cognitive levels
  const totalPercentage =
    cognitiveLevels.remembering +
    cognitiveLevels.understanding +
    cognitiveLevels.applying +
    cognitiveLevels.highApplying;

  // Load preset
  const handleSelectPreset = (preset: ExamPreset) => {
    setSubject(preset.subject);
    setGrade(preset.grade);
    setDurationMinutes(preset.durationMinutes);
    setSchoolName(preset.schoolName);
    setDepartmentName(preset.departmentName);
    setExamTitle(preset.examTitle);
    setExamCode(preset.examCode);
    setTopics(preset.topics);
    setCognitiveLevels({ ...preset.cognitiveLevels });
    setStructure({ ...preset.structure });
    setCustomInstructions(preset.customInstructions);
    setUseWebSearch(preset.useWebSearch);
  };

  // Handle file uploads
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `file_${Date.now()}_${i}`;

      const reader = new FileReader();

      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setUploadedFiles((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              size: file.size,
              type: file.type,
              mimeType: file.type || 'text/plain',
              textContent: text,
              category: 'tai_lieu_tham_khao',
            },
          ]);
        };
        reader.readAsText(file);
      } else {
        // Read as DataURL for base64
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setUploadedFiles((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              size: file.size,
              type: file.type,
              mimeType: file.type || 'application/octet-stream',
              base64Data: result,
              category: 'tai_lieu_tham_khao',
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileCategory = (id: string, category: UploadedFileRef['category']) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, category } : f))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPercentage !== 100) {
      alert('Tổng tỉ lệ phần trăm 4 cấp độ năng lực phải bằng đúng 100%!');
      return;
    }

    onSubmit({
      subject,
      grade,
      durationMinutes,
      schoolName,
      departmentName,
      examTitle,
      examCode,
      topics,
      cognitiveLevels,
      structure,
      useWebSearch,
      uploadedFiles,
      customInstructions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Presets Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Nạp mẫu đề thi chuẩn GDPT 2018 sẵn có:
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Chọn 1 mẫu để điền nhanh thông số
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_EXAMS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 truncate">
                {preset.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                <span>{preset.durationMinutes} phút</span>
                <span>•</span>
                <span>Lớp {preset.grade}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-8">
        {/* Section 1: Subject & Grade Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-base">
              1. Chọn Môn học & Khối lớp
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'toan', label: 'Toán học', icon: Calculator, color: 'text-blue-600 bg-blue-50 border-blue-200' },
              { id: 'van', label: 'Ngữ văn', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
              { id: 'tienganh', label: 'Tiếng Anh', icon: Languages, color: 'text-purple-600 bg-purple-50 border-purple-200' },
              { id: 'khtn', label: 'Khoa học tự nhiên', icon: Atom, color: 'text-amber-600 bg-amber-50 border-amber-200' },
            ].map((sub) => {
              const Icon = sub.icon;
              const isSelected = subject === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubject(sub.id as Subject)}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-blue-900 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${sub.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm">{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-specialization for KHTN */}
          {subject === 'khtn' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Phân môn trọng tâm:</span>
              {(['khtn', 'vatly', 'hoahoc', 'sinhhoc'] as const).map((spec) => (
                <label key={spec} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="khtn_spec"
                    checked={subject === spec}
                    onChange={() => setSubject(spec)}
                    className="text-blue-600"
                  />
                  <span>
                    {spec === 'khtn'
                      ? 'Tích hợp Lý - Hóa - Sinh'
                      : spec === 'vatly'
                      ? 'Vật lý'
                      : spec === 'hoahoc'
                      ? 'Hóa học'
                      : 'Sinh học'}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Grade selection */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-600 mr-2">Khối lớp:</span>
            {(['6', '7', '8', '9', '10', '11', '12'] as Grade[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  grade === g
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Header Metadata & Time */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-base">
              2. Thông tin Tiêu đề & Thời gian làm bài
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sở / Phòng GD&ĐT
              </label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Ví dụ: Sở Giáo dục và Đào tạo"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Trường
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Ví dụ: Trường THPT Chuyên Nguyễn Trãi"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiêu đề Đề kiểm tra
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="Ví dụ: ĐỀ KIỂM TRA GIỮA KỲ I - NĂM HỌC 2025-2026"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thời gian làm bài (Phút)
              </label>
              <div className="flex gap-2">
                {[15, 45, 60, 90, 120].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDurationMinutes(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                      durationMinutes === t
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t}'
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã đề thi
              </label>
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                placeholder="101"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Cognitive Matrix Sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800 text-base">
                3. Ma trận Tỉ lệ Cấp độ Năng lực (%)
              </h2>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                totalPercentage === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {totalPercentage === 100 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>Tổng: {totalPercentage}% / 100%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Nhận biết */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Nhận biết</span>
                <span className="text-blue-600">{cognitiveLevels.remembering}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={cognitiveLevels.remembering}
                onChange={(e) =>
                  setCognitiveLevels((prev) => ({
                    ...prev,
                    remembering: Number(e.target.value),
                  }))
                }
                className="w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Nhận diện, tái hiện khái niệm, định lý, sự kiện
              </p>
            </div>

            {/* Thông hiểu */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Thông hiểu</span>
                <span className="text-emerald-600">{cognitiveLevels.understanding}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={cognitiveLevels.understanding}
                onChange={(e) =>
                  setCognitiveLevels((prev) => ({
                    ...prev,
                    understanding: Number(e.target.value),
                  }))
                }
                className="w-full accent-emerald-600"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Giải thích, cắt nghĩa, liên hệ bản chất khái niệm
              </p>
            </div>

            {/* Vận dụng */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Vận dụng</span>
                <span className="text-amber-600">{cognitiveLevels.applying}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={cognitiveLevels.applying}
                onChange={(e) =>
                  setCognitiveLevels((prev) => ({
                    ...prev,
                    applying: Number(e.target.value),
                  }))
                }
                className="w-full accent-amber-600"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Áp dụng quy tắc, công thức vào bài toán cụ thể
              </p>
            </div>

            {/* Vận dụng cao */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Vận dụng cao</span>
                <span className="text-purple-600">{cognitiveLevels.highApplying}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={cognitiveLevels.highApplying}
                onChange={(e) =>
                  setCognitiveLevels((prev) => ({
                    ...prev,
                    highApplying: Number(e.target.value),
                  }))
                }
                className="w-full accent-purple-600"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Phân tích, đánh giá, bài toán ứng dụng thực tế
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Structure GDPT 2018 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800 text-base">
                4. Cấu trúc Số lượng Câu hỏi (Khung GDPT 2018)
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
              <label className="block text-xs font-bold text-blue-900 mb-1">
                Phần I: Trắc nghiệm 4 lựa chọn
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Mỗi câu chọn 1 đáp án A, B, C, D
              </p>
              <input
                type="number"
                min="0"
                max="40"
                value={structure.multipleChoiceCount}
                onChange={(e) =>
                  setStructure((prev) => ({
                    ...prev,
                    multipleChoiceCount: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-full px-3 py-1.5 text-sm font-bold border border-blue-300 rounded-lg bg-white"
              />
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                Phần II: Đúng / Sai (4 ý a, b, c, d)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Mỗi câu gồm 4 ý hỏi độc lập
              </p>
              <input
                type="number"
                min="0"
                max="20"
                value={structure.trueFalseCount}
                onChange={(e) =>
                  setStructure((prev) => ({
                    ...prev,
                    trueFalseCount: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-full px-3 py-1.5 text-sm font-bold border border-emerald-300 rounded-lg bg-white"
              />
            </div>

            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
              <label className="block text-xs font-bold text-amber-900 mb-1">
                Phần III: Trả lời ngắn
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Điền đáp số / từ khóa ngắn gọn
              </p>
              <input
                type="number"
                min="0"
                max="20"
                value={structure.shortAnswerCount}
                onChange={(e) =>
                  setStructure((prev) => ({
                    ...prev,
                    shortAnswerCount: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-full px-3 py-1.5 text-sm font-bold border border-amber-300 rounded-lg bg-white"
              />
            </div>

            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl">
              <label className="block text-xs font-bold text-purple-900 mb-1">
                Phần IV: Tự luận / Viết bài
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Trình bày lời giải chi tiết
              </p>
              <input
                type="number"
                min="0"
                max="10"
                value={structure.essayCount}
                onChange={(e) =>
                  setStructure((prev) => ({
                    ...prev,
                    essayCount: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-full px-3 py-1.5 text-sm font-bold border border-purple-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Topics & Custom Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-base">
              5. Nội dung Trọng tâm & Yêu cầu riêng
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chương / Mạch kiến thức cần kiểm tra
            </label>
            <textarea
              rows={3}
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Nhập tên các bài học, chương học trọng tâm..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú / Yêu cầu sư phạm bổ sung (tùy chọn)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ví dụ: Lấy ví dụ gắn với bối cảnh giao thông đô thị; Tránh các câu hỏi quá lý thuyết suông..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Section 6: File Upload Zone */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800 text-base">
                6. Tải lên Tài liệu / Ma trận mẫu / Đề thi tham khảo
              </h2>
            </div>
            <span className="text-xs text-slate-500">Hỗ trợ PDF, DOCX, TXT, PNG, JPG</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              Kéo thả tài liệu vào đây hoặc{' '}
              <label className="text-blue-600 hover:underline cursor-pointer">
                chọn file từ máy tính
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              AI sẽ phân tích cấu trúc ma trận, giáo án giảng dạy hoặc đề mẫu từ file bạn tải lên.
            </p>
          </div>

          {/* List of uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Tài liệu đã tải lên ({uploadedFiles.length}):
              </p>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-md">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                      <span className="text-slate-400 text-[10px]">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={file.category}
                        onChange={(e) =>
                          updateFileCategory(file.id, e.target.value as UploadedFileRef['category'])
                        }
                        className="px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-medium"
                      >
                        <option value="ma_tran">Ma trận mẫu</option>
                        <option value="huong_dan_giang_day">Tài liệu giảng dạy</option>
                        <option value="tai_lieu_tham_khao">Nguồn tham khảo</option>
                        <option value="de_mau">Đề thi mẫu</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 7: External Search Grounding Toggle */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label htmlFor="web_search_toggle" className="font-bold text-slate-900 text-sm cursor-pointer">
                Tham khảo tài liệu / Ngữ liệu mở bên ngoài (Internet Search Grounding)
              </label>
              <input
                id="web_search_toggle"
                type="checkbox"
                checked={useWebSearch}
                onChange={(e) => setUseWebSearch(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Cho phép AI tự động truy xuất cơ sở dữ liệu trên Internet để cập nhật các dạng bài tập mới nhất, trích dẫn văn bản đọc hiểu tác quyền mở, và số liệu khoa học thực tế cho đề thi.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || totalPercentage !== 100}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base text-white shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer ${
              isLoading || totalPercentage !== 100
                ? 'bg-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin text-white" />
                <span>AI Đang phân tích ma trận & biên soạn đề thi...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>BẮT ĐẦU BIÊN SOẠN ĐỀ THI TỰ ĐỘNG (GDPT 2018)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
