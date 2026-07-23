import type { Subject, Grade, CognitiveLevels, StructureConfig } from '../types';

export interface ExamPreset {
  id: string;
  name: string;
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
  customInstructions: string;
  useWebSearch: boolean;
}

export const PRESET_EXAMS: ExamPreset[] = [
  {
    id: 'toan-10-gk1',
    name: 'Đề Toán 10 - Giữa kỳ I (Khảo sát Hàm số & Véctơ)',
    subject: 'toan',
    grade: '10',
    durationMinutes: 90,
    schoolName: 'Trường THPT Chuyên Nguyễn Trãi',
    departmentName: 'Sở Giáo dục và Đào tạo',
    examTitle: 'ĐỀ KIỂM TRA GIỮA KỲ I - NĂM HỌC 2025 - 2026',
    examCode: '101',
    topics: 'Mệnh đề và Tập hợp; Hàm số bậc hai và đồ thị; Véctơ và các phép toán véctơ; Giá trị lượng giác của một góc từ 0 đến 180 độ.',
    cognitiveLevels: {
      remembering: 40,
      understanding: 30,
      applying: 20,
      highApplying: 10,
    },
    structure: {
      multipleChoiceCount: 12,
      trueFalseCount: 4,
      shortAnswerCount: 6,
      essayCount: 2,
    },
    customInstructions: 'Cho các câu hỏi thực tế về mô hình hóa hàm số bậc hai (chuyển động của quả bóng, cổng hình parabol) và ứng dụng véctơ trong lực tổng hợp.',
    useWebSearch: true,
  },
  {
    id: 'van-9-doc-hieu',
    name: 'Đề Ngữ văn 9 - Đọc hiểu & Viết văn bản nghị luận',
    subject: 'van',
    grade: '9',
    durationMinutes: 90,
    schoolName: 'Trường THCS Lê Quý Đôn',
    departmentName: 'Phòng Giáo dục và Đào tạo',
    examTitle: 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN NGỮ VĂN',
    examCode: '202',
    topics: 'Phần I: Đọc hiểu ngữ liệu ngoài SGK (Thơ hoặc Truyện ngắn hiện đại về tinh thần tự lập, lòng biết ơn). Phần II: Viết đoạn văn nghị luận xã hội (200 chữ) và Viết bài văn phân tích một tác phẩm văn học.',
    cognitiveLevels: {
      remembering: 30,
      understanding: 30,
      applying: 30,
      highApplying: 10,
    },
    structure: {
      multipleChoiceCount: 4,
      trueFalseCount: 0,
      shortAnswerCount: 2,
      essayCount: 2,
    },
    customInstructions: 'Trích dẫn ngữ liệu mở là một bài thơ hoặc tản văn Việt Nam hiện đại xuất bản uy tín (ghi rõ tên tác giả, tác phẩm).',
    useWebSearch: true,
  },
  {
    id: 'tieng-anh-12-hk1',
    name: 'Đề Tiếng Anh 12 - Kiểm tra Học kỳ I (Cấu trúc mới GDPT 2018)',
    subject: 'tienganh',
    grade: '12',
    durationMinutes: 60,
    schoolName: 'Trường THPT Nguyễn Thị Minh Khai',
    departmentName: 'Sở Giáo dục và Đào tạo',
    examTitle: 'ĐỀ KIỂM TRA HỌC KỲ I MÔN TIẾNG ANH',
    examCode: '303',
    topics: 'Unit 1: Life stories; Unit 2: Green living; Unit 3: Urbanisation; Artificial Intelligence and Future Careers; Grammar: Compound sentences, Past continuous vs Past simple, Relative clauses, Conditionals.',
    cognitiveLevels: {
      remembering: 30,
      understanding: 40,
      applying: 20,
      highApplying: 10,
    },
    structure: {
      multipleChoiceCount: 16,
      trueFalseCount: 4,
      shortAnswerCount: 5,
      essayCount: 1,
    },
    customInstructions: 'Cấu trúc gồm phát âm, từ vựng tình huống, bài đọc điền từ (cloze reading), bài đọc hiểu Đúng/Sai, xếp lại câu và viết lại câu.',
    useWebSearch: true,
  },
  {
    id: 'khtn-8-tich-hop',
    name: 'Đề KHTN 8 - Tích hợp Vật lý, Hóa học & Sinh học',
    subject: 'khtn',
    grade: '8',
    durationMinutes: 60,
    schoolName: 'Trường THCS Chu Văn An',
    departmentName: 'Phòng Giáo dục và Đào tạo',
    examTitle: 'ĐỀ KIỂM TRA GIỮA KỲ MÔN KHOA HỌC TỰ NHIÊN',
    examCode: '404',
    topics: 'Hóa học: Phản ứng hóa học, Định luật bảo toàn khối lượng, Dung dịch; Vật lý: Áp suất, Áp suất chất lỏng, Lực đẩy Archimedes; Sinh học: Hệ vận động ở người, Dinh dưỡng và tiêu hóa.',
    cognitiveLevels: {
      remembering: 40,
      understanding: 30,
      applying: 20,
      highApplying: 10,
    },
    structure: {
      multipleChoiceCount: 12,
      trueFalseCount: 3,
      shortAnswerCount: 4,
      essayCount: 2,
    },
    customInstructions: 'Cho các thí nghiệm vui về áp suất chất lỏng và câu hỏi thực tế về tính chỉ số BMI, chế độ ăn uống hợp lý.',
    useWebSearch: true,
  },
];
