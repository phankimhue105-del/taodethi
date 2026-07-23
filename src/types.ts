export type Subject = 'toan' | 'van' | 'tienganh' | 'khtn' | 'vatly' | 'hoahoc' | 'sinhhoc';

export type Grade = '6' | '7' | '8' | '9' | '10' | '11' | '12';

export type CognitiveLevelKey = 'remembering' | 'understanding' | 'applying' | 'highApplying';

export interface CognitiveLevels {
  remembering: number; // Nhận biết (%)
  understanding: number; // Thông hiểu (%)
  applying: number; // Vận dụng (%)
  highApplying: number; // Vận dụng cao (%)
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export interface StructureConfig {
  multipleChoiceCount: number; // Phần I: Trắc nghiệm 4 phương án
  trueFalseCount: number; // Phần II: Trắc nghiệm Đúng/Sai (Mỗi câu 4 ý)
  shortAnswerCount: number; // Phần III: Trả lời ngắn
  essayCount: number; // Phần IV: Tự luận
}

export interface UploadedFileRef {
  id: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  base64Data?: string;
  textContent?: string;
  category: 'ma_tran' | 'huong_dan_giang_day' | 'tai_lieu_tham_khao' | 'de_mau';
}

export interface TrueFalseStatement {
  label: 'a' | 'b' | 'c' | 'd';
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
  topic: string;
  content: string;
  passageHeader?: string; // Tên tác phẩm / Nguồn đoạn trích
  readingPassage?: string; // Ngữ liệu đọc hiểu (dùng chung hoặc riêng)
  options?: string[]; // Dành cho Trắc nghiệm [A, B, C, D]
  subStatements?: TrueFalseStatement[]; // Dành cho Đúng/Sai
  correctAnswer: string; // Đáp án ngắn gọn
  explanation: string; // Hướng dẫn giải chi tiết / Thang điểm
  points: number;
  sectionTitle?: string;
}

export interface MatrixRow {
  topic: string; // Mạch kiến thức / Chủ đề
  rememberingCount: number;
  understandingCount: number;
  applyingCount: number;
  highApplyingCount: number;
  totalQuestions: number;
  totalPoints: number;
}

export interface SpecificationRow {
  topic: string;
  competencyRequirement: string; // Yêu cầu cần đạt theo GDPT 2018
  rememberingFormat?: string;
  understandingFormat?: string;
  applyingFormat?: string;
  highApplyingFormat?: string;
  questionNumbers: string; // Ví dụ: "Câu 1, 2, 3"
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ExamPackage {
  id: string;
  createdAt: string;
  schoolName: string;
  departmentName: string;
  examTitle: string; // e.g. "ĐỀ KIỂM TRA GIỮA KỲ I - NĂM HỌC 2025 - 2026"
  subject: string;
  subjectName: string;
  grade: string;
  durationMinutes: number;
  examCode: string;
  generalInstructions?: string;
  cognitiveLevels: CognitiveLevels;
  matrix: MatrixRow[];
  specifications: SpecificationRow[];
  questions: Question[];
  groundingSources?: GroundingSource[];
  customPrompt?: string;
  useWebSearch?: boolean;
}

export interface GenerateExamRequest {
  subject: Subject;
  grade: Grade;
  durationMinutes: number;
  schoolName: string;
  departmentName: string;
  examTitle: string;
  examCode: string;
  topics: string;
  cognitiveLevels: CognitiveLevels;
  structure: StructureConfig;
  useWebSearch: boolean;
  uploadedFiles: UploadedFileRef[];
  customInstructions?: string;
}
