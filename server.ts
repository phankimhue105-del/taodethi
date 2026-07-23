import express from 'express';
import path from 'path';
import multer from 'multer';
import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from 'docx';
import type { GenerateExamRequest, ExamPackage, Question } from './src/types.js';

const app = express();
const PORT = 3000;

// Configure body parser and upload middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Initialize Gemini SDK lazily
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong hệ thống. Vui lòng kiểm tra Bảng điều khiển Trí tuệ AI.');
  }
  return new GoogleGenAI({
    apiKey,
  });
}

// Clean JSON response from LLM if wrapped in markdown blocks
function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find first { or [ and last } or ]
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

// Extract raw text from uploaded file references (e.g. DOCX)
async function extractTextFromFile(file: any): Promise<string> {
  if (file.textContent) {
    return file.textContent;
  }
  if (file.base64Data) {
    const cleanBase64 = file.base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    if (file.name.endsWith('.docx') || file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } catch (err) {
        console.error('Error parsing docx with mammoth:', err);
        return '';
      }
    }
  }
  return '';
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Route: Generate Complete Exam
app.post('/api/generate-exam', async (req, res) => {
  console.log('[DEBUG] request reaches the route: /api/generate-exam');
  console.log('[DEBUG] request body validation: data exists =', !!req.body, 'keys =', Object.keys(req.body || {}));
  try {
    const ai = getGeminiClient();
    const data: GenerateExamRequest = req.body;

    if (!data) {
      return res.status(400).json({ success: false, error: 'Dữ liệu yêu cầu rỗng.' });
    }

    const {
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
      sampleExamFile,
      customInstructions,
    } = data;

    if (!subject || !grade) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin Môn học hoặc Khối lớp.' });
    }

    const subjectDisplayMap: Record<string, string> = {
      toan: 'TOÁN HỌC',
      van: 'NGỮ VĂN',
      tienganh: 'TIẾNG ANH',
      khtn: 'KHOA HỌC TỰ NHIÊN',
      vatly: 'VẬT LÝ',
      hoahoc: 'HÓA HỌC',
      sinhhoc: 'SINH HỌC',
    };
    const subjectName = subjectDisplayMap[subject] || String(subject).toUpperCase();

    // Safe cognitive levels & structure setup with defaults to prevent nested reading errors
    const cogLevels = cognitiveLevels || { remembering: 40, understanding: 30, applying: 20, highApplying: 10 };
    const struct = structure || { multipleChoiceCount: 12, trueFalseCount: 4, shortAnswerCount: 6, essayCount: 2 };

    const rememberPct = cogLevels.remembering ?? 0;
    const understandPct = cogLevels.understanding ?? 0;
    const applyPct = cogLevels.applying ?? 0;
    const highApplyPct = cogLevels.highApplying ?? 0;

    const mcCount = struct.multipleChoiceCount ?? 0;
    const tfCount = struct.trueFalseCount ?? 0;
    const saCount = struct.shortAnswerCount ?? 0;
    const esCount = struct.essayCount ?? 0;

    // System instruction and prompt construction
    const systemPrompt = `Bạn là Chuyên gia Đo lường & Đánh giá Giáo dục hàng đầu Việt Nam, am hiểu sâu sắc Chương trình Giáo dục phổ thông 2018 (GDPT 2018) của Bộ Giáo dục và Đào tạo.
Nhiệm vụ của bạn là biên soạn một Bộ Đề kiểm tra hoàn chỉnh bao gồm:
1. Ma trận đề thi chuẩn tỉ lệ (%)
2. Bản đặc tả đề thi theo chuẩn Yêu cầu cần đạt GDPT 2018
3. Đề kiểm tra chính thức (Chất lượng cao, ngôn ngữ chuẩn sư phạm, không sai sót kiến thức)
4. Đáp án & Hướng dẫn chấm chi tiết kèm thang điểm từng bước.

QUY TẮC BẮT BUỘC KHI CÓ ĐỀ THI MẪU (TEMPLATE EXAM):
Nếu người dùng cung cấp đề thi mẫu (được gắn nhãn [ĐỀ THI MẪU HỌC TẬP PHONG CÁCH]), bạn chỉ được phép học hỏi về:
- Cấu trúc đề thi (exam structure)
- Thứ tự các phần (section order)
- Phong cách đánh số câu (numbering style)
- Cách diễn đạt lời chỉ dẫn (instruction wording)
- Định dạng (formatting)
- Khoảng cách và trình bày (spacing & presentation style)
- Độ khó (difficulty style)
- Cách thức trình bày câu hỏi và đáp án (question & answer presentation style)
Tuyệt đối KHÔNG ĐƯỢC sao chép bất kỳ câu hỏi, đáp án, đoạn văn đọc hiểu (passages), hình ảnh, ví dụ, từ ngữ nguyên bản hay lời giải thích nào từ đề thi mẫu đó. Tất cả nội dung đề thi được tạo ra phải là nguyên bản (original) mới 100%.

QUY TẮC ĐÁP ÁN & HƯỚNG DẪN GIẢI CHI TIẾT (EXPLANATION):
Với mỗi câu hỏi trong mảng 'questions', bạn phải tạo đáp án đúng (correctAnswer) và hướng dẫn giải (explanation). Trường 'explanation' phải bao gồm đầy đủ các thông tin sau theo định dạng mẫu dưới đây:
Correct answer: [Đáp án đúng]
Why it is correct: [Giải thích chi tiết tại sao đúng và quy tắc kiến thức áp dụng]
Grammar/Vocabulary rule (if applicable): [Quy tắc ngữ pháp hoặc từ vựng liên quan nếu có]
Why the other options are incorrect (nếu là trắc nghiệm nhiều lựa chọn):
- Option A is incorrect because: [Giải thích lý do sai của A]
- Option B is incorrect because: [Giải thích lý do sai của B]
- Option C is incorrect because: [Giải thích lý do sai của C]
- Option D is incorrect because: [Giải thích lý do sai của D]
(Lưu ý: Thay thế các nhãn A, B, C, D cho phù hợp với các lựa chọn sai thực tế. Với câu hỏi Đúng/Sai, giải thích chi tiết cho từng ý a, b, c, d. Với câu hỏi tự luận hoặc trả lời ngắn, giải thích các bước tính toán/phân tích chi tiết.)

QUY TẮC CẤU TRÚC ĐỀ THI THEO CẤU TRÚC GDPT 2018 MỚI NHẤT:
- Môn: ${subjectName} - Lớp ${grade} - Thời gian: ${durationMinutes || 90} phút.
- Tỉ lệ phân hóa năng lực bắt buộc:
  + Nhận biết: ${rememberPct}%
  + Thông hiểu: ${understandPct}%
  + Vận dụng: ${applyPct}%
  + Vận dụng cao: ${highApplyPct}%

- Số lượng câu hỏi yêu cầu cho từng phần:
  1. Phần I (Trắc nghiệm nhiều lựa chọn - A, B, C, D): ${mcCount} câu.
  2. Phần II (Trắc nghiệm Đúng / Sai - Mỗi câu gồm 4 ý a, b, c, d): ${tfCount} câu.
  3. Phần III (Trắc nghiệm Trả lời ngắn - Nhập số / từ ngắn): ${saCount} câu.
  4. Phần IV (Tự luận / Đọc hiểu viết luận): ${esCount} câu.

ĐẶC THÙ CHO TỪNG MÔN HỌC:
- NGỮ VĂN: Sử dụng NGỮ LIỆU MỞ NGOÀI SÁCH GIÁO KHÓA (không lấy lại bài trong SGK để chống học tủ). Đoạn trích cần ghi rõ tên tác giả, tác phẩm, xuất bản. Phần đọc hiểu gồm các câu hỏi từ Nhận biết đến Vận dụng. Phần Viết gồm nghị luận xã hội hoặc nghị luận văn học.
- TIẾNG ANH: Ngữ liệu đọc hiểu mới, ngữ pháp câu hỏi tình huống thực tế, bài tập điền từ cloze test, chọn từ đúng, phát âm/trọng âm hoặc câu trả lời ngắn theo cấu trúc mới.
- TOÁN HỌC & KHTN: Tăng cường các bài toán gắn với thực tiễn, đời sống, ứng dụng khoa học kĩ thuật, biểu đồ, sơ đồ thí nghiệm.

Hãy trả về kết quả định dạng JSON thuần túy (JSON string) đúng cấu trúc sau (không kèm văn bản tự do ngoài JSON):
{
  "schoolName": "${schoolName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}",
  "departmentName": "${departmentName || 'TRƯỜNG THPT / THCS'}",
  "examTitle": "${examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ'}",
  "subjectName": "${subjectName}",
  "grade": "${grade}",
  "durationMinutes": ${durationMinutes || 90},
  "examCode": "${examCode || '101'}",
  "generalInstructions": "Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.",
  "matrix": [
    {
      "topic": "Tên Chủ đề / Mạch kiến thức 1",
      "rememberingCount": 2,
      "understandingCount": 2,
      "applyingCount": 1,
      "highApplyingCount": 0,
      "totalQuestions": 5,
      "totalPoints": 2.5
    }
  ],
  "specifications": [
    {
      "topic": "Tên Chủ đề 1",
      "competencyRequirement": "Nhận biết được... Thông hiểu được... Vận dụng giải quyết...",
      "questionNumbers": "Câu 1, Câu 2, Câu 3..."
    }
  ],
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "type": "multiple_choice",
      "level": "Nhận biết",
      "topic": "Tên chủ đề",
      "sectionTitle": "PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (Thí sinh chọn 1 phương án đúng)",
      "content": "Nội dung câu hỏi...",
      "passageHeader": "Đọc đoạn trích sau và trả lời các câu hỏi:",
      "readingPassage": "Nội dung ngữ liệu đọc hiểu (nếu có)...",
      "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
      "correctAnswer": "A",
      "explanation": "Lời giải chi tiết giải thích tại sao chọn A...",
      "points": 0.25
    },
    {
      "id": "q2",
      "number": 2,
      "type": "true_false",
      "level": "Thông hiểu",
      "topic": "Tên chủ đề",
      "sectionTitle": "PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (Thí sinh trả lời Đúng hoặc Sai cho mỗi ý a, b, c, d)",
      "content": "Cho mệnh đề / thông tin sau...",
      "subStatements": [
        {"label": "a", "text": "Ý thứ nhất...", "isCorrect": true},
        {"label": "b", "text": "Ý thứ hai...", "isCorrect": false},
        {"label": "c", "text": "Ý thứ ba...", "isCorrect": true},
        {"label": "d", "text": "Ý thứ tư...", "isCorrect": false}
      ],
      "correctAnswer": "a) Đúng, b) Sai, c) Đúng, d) Sai",
      "explanation": "Giải thích chi tiết từng ý a, b, c, d...",
      "points": 1.0
    },
    {
      "id": "q3",
      "number": 3,
      "type": "short_answer",
      "level": "Vận dụng",
      "topic": "Tên chủ đề",
      "sectionTitle": "PHẦN III. CÂU HỎI TRẢ LỜI NGẮN (Thí sinh điền kết quả dạng số hoặc từ ngắn)",
      "content": "Nội dung bài toán / câu hỏi ngắn...",
      "correctAnswer": "12.5",
      "explanation": "Các bước tính ra kết quả 12.5...",
      "points": 0.5
    },
    {
      "id": "q4",
      "number": 4,
      "type": "essay",
      "level": "Vận dụng cao",
      "topic": "Tên chủ đề",
      "sectionTitle": "PHẦN IV. TỰ LUẬN (Thí sinh trình bày chi tiết lời giải)",
      "content": "Nội dung câu hỏi tự luận / bài văn...",
      "correctAnswer": "Đáp án & Dàn ý / Thang điểm chi tiết",
      "explanation": "Hướng dẫn chấm chi tiết từng phần điểm (Ví dụ: Ý 1: 0.5đ, Ý 2: 1.0đ...)",
      "points": 2.0
    }
  ]
}`;

    const parts: any[] = [];

    // Add user instruction prompt
    let userPromptText = `YÊU CẦU LẬP ĐỀ THI:
- Môn học: ${subjectName} - Khối lớp: ${grade}
- Nội dung / Các chương bài học trọng tâm: "${topics || 'Chương trình theo đúng tiến độ GDPT 2018 môn ' + subjectName + ' lớp ' + grade}"
- Ghi chú / Hướng dẫn đặc biệt từ giáo viên: "${customInstructions || 'Biên soạn đề thi chuẩn hóa, phong phú, thực tiễn.'}"
`;

    if (uploadedFiles && uploadedFiles.length > 0) {
      userPromptText += `\nCÁC TÀI LIỆU VÀ MẪU ĐẦU VÀO ĐƯỢC TẢI LÊN:\n`;
      uploadedFiles.forEach((file, index) => {
        userPromptText += `- File ${index + 1}: ${file.name} (Loại: ${file.category})\n`;
        if (file.textContent) {
          // Graceful limit check to prevent prompt overflow
          const safeText = file.textContent.substring(0, 4000);
          userPromptText += `  Nội dung trích xuất: "${safeText}"\n`;
        }
      });
    }

    if (sampleExamFile) {
      userPromptText += `\n[ĐỀ THI MẪU HỌC TẬP PHONG CÁCH]:\n`;
      userPromptText += `- Tên file đề mẫu: ${sampleExamFile.name}\n`;
      if (sampleExamFile.textContent) {
        const safeText = sampleExamFile.textContent.substring(0, 6000);
        userPromptText += `  Nội dung văn bản đề mẫu:\n"""\n${safeText}\n"""\n`;
      } else if (sampleExamFile.name.endsWith('.docx') || sampleExamFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const text = await extractTextFromFile(sampleExamFile);
          if (text) {
            const safeText = text.substring(0, 6000);
            userPromptText += `  Nội dung văn bản đề mẫu (trích xuất từ docx):\n"""\n${safeText}\n"""\n`;
          }
        } catch (docxErr) {
          console.error('[Docx Extraction Error] Failed to read sample exam docx:', docxErr);
        }
      }
    }

    if (useWebSearch) {
      userPromptText += `\n[TÍNH NĂNG TÌM KIẾM BÊN NGOÀI BẬT]: Hãy sử dụng tính năng tra cứu internet để cập nhật ngữ liệu mở mới nhất (tác phẩm văn học hiện đại, bài báo khoa học thực tế, dữ liệu kinh tế - xã hội mới, hoặc bài toán ứng dụng thực tế phong phú).`;
    }

    parts.push({ text: userPromptText });

    // Include base64 images/PDFs if uploaded
    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        if (file.base64Data && file.mimeType) {
          try {
            if (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') {
              const cleanBase64 = file.base64Data.replace(/^data:[^;]+;base64,/, '');
              if (cleanBase64.length > 0) {
                parts.push({
                  inlineData: {
                    mimeType: file.mimeType,
                    data: cleanBase64,
                  },
                });
              }
            }
          } catch (fileErr) {
            console.error('[File Processing Error] Failed to append base64 file:', file.name, fileErr);
          }
        }
      }
    }

    // Include base64 images/PDFs of sample exam if uploaded
    if (sampleExamFile && sampleExamFile.base64Data && sampleExamFile.mimeType) {
      try {
        if (sampleExamFile.mimeType.startsWith('image/') || sampleExamFile.mimeType === 'application/pdf') {
          const cleanBase64 = sampleExamFile.base64Data.replace(/^data:[^;]+;base64,/, '');
          if (cleanBase64.length > 0) {
            parts.push({
              inlineData: {
                mimeType: sampleExamFile.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      } catch (sampleFileErr) {
        console.error('[Sample File Processing Error] Failed to append sample base64 file:', sampleFileErr);
      }
    }

    const config: any = {
      systemInstruction: systemPrompt,
      temperature: 0.2, 
    };

    if (useWebSearch) {
      config.tools = [{ googleSearch: {} }];
    } else {
      config.responseMimeType = 'application/json';
    }

    // Logging detailed request information
    console.log('[DEBUG] systemPrompt size =', systemPrompt ? systemPrompt.length : 0);
    console.log('[DEBUG] userPromptText size =', userPromptText ? userPromptText.length : 0);
    console.log('[DEBUG] prompt size (systemPrompt + userPromptText) =', (systemPrompt ? systemPrompt.length : 0) + (userPromptText ? userPromptText.length : 0));
    console.log('[DEBUG] number of parts =', parts.length);
    parts.forEach((p, idx) => {
      console.log(`[DEBUG] part ${idx}: type =`, Object.keys(p), 'textLength =', p.text ? p.text.length : 0, 'inlineDataKeys =', p.inlineData ? Object.keys(p.inlineData) : 'none');
    });

    const formattedContents = [
      {
        role: 'user',
        parts: parts
      }
    ];

    console.log('[DEBUG] contents format validation: isArray =', Array.isArray(formattedContents), 'firstElementKeys =', formattedContents[0] ? Object.keys(formattedContents[0]) : 'none');
    console.log('[DEBUG] contents.parts exists =', !!formattedContents[0]?.parts, 'contents.parts isArray =', Array.isArray(formattedContents[0]?.parts));
    console.log(`[Gemini] Invoking Gemini API for ${subjectName} Grade ${grade}, WebSearch: ${useWebSearch}`);

    let response;
    const primaryModel = 'gemini-2.5-flash';
    const fallbackModel = 'gemini-2.5-flash-lite';

    console.log('[DEBUG] primary model name =', primaryModel);
    try {
      response = await ai.models.generateContent({
        model: primaryModel,
        contents: formattedContents,
        config,
      });
    } catch (apiError: any) {
      console.error('[DEBUG] Primary model invocation failed. Error stack:', apiError.stack || apiError);
      console.log('[DEBUG] fallback model name =', fallbackModel);
      try {
        response = await ai.models.generateContent({
          model: fallbackModel,
          contents: formattedContents,
          config,
        });
      } catch (fallbackError: any) {
        console.error('[DEBUG] Fallback model invocation failed. Fatal error stack:', fallbackError.stack || fallbackError);
        return res.status(500).json({
          success: false,
          error: `Lỗi kết nối với Gemini API: Model chính (${primaryModel}) gặp lỗi: ${apiError.message}. Model dự phòng (${fallbackModel}) cũng gặp lỗi: ${fallbackError.message}`,
          details: `Primary Error: ${apiError.stack || apiError}\n\nFallback Error: ${fallbackError.stack || fallbackError}`,
        });
      }
    }

    // Log response object details
    console.log('[DEBUG] response object keys =', Object.keys(response || {}));
    console.log('[DEBUG] typeof response.text =', typeof response.text);
    console.log('[DEBUG] is response.text a method =', typeof response.text === 'function');
    if (response) {
      console.log('[DEBUG] response candidate structure =', JSON.stringify(response.candidates?.[0]?.content || {}, null, 2).substring(0, 500));
    }

    const responseText = response.text || '';
    if (!responseText) {
      throw new Error('AI returned an empty response text.');
    }

    let examData: ExamPackage;
    try {
      examData = cleanJsonResponse(responseText);
    } catch (parseError: any) {
      console.error('[JSON Parse Error] Failed to clean and parse response:', parseError);
      console.error('[JSON Parse Error] Raw text was:', responseText);
      return res.status(500).json({
        success: false,
        error: `Phản hồi từ AI không đúng định dạng JSON cấu trúc yêu cầu.`,
        details: `Raw output: ${responseText.substring(0, 600)}...`,
      });
    }

    // Extract grounding sources if available
    try {
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && Array.isArray(groundingChunks)) {
        const sources: { title: string; url: string }[] = [];
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            sources.push({
              title: chunk.web.title,
              url: chunk.web.uri,
            });
          }
        });
        examData.groundingSources = sources;
      }
    } catch (groundingError) {
      console.warn('[Grounding Warning] Failed to parse grounding sources:', groundingError);
    }

    examData.id = `exam_${Date.now()}`;
    examData.createdAt = new Date().toISOString();
    examData.useWebSearch = useWebSearch;

    console.log('[API] Exam generated successfully');
    res.json({ success: true, exam: examData });
  } catch (error: any) {
    console.error('[API Fatal Error] generate-exam failed:', error.message, error.stack || error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi hệ thống khi tạo đề thi với Gemini AI.',
      details: error.stack || String(error),
    });
  }
});

// API Route: Tweak / Edit a single question in exam
app.post('/api/edit-question', async (req, res) => {
  console.log('[DEBUG] request reaches the route: /api/edit-question');
  console.log('[DEBUG] request body validation: currentQuestion exists =', !!req.body.currentQuestion, 'instruction exists =', !!req.body.instruction);
  try {
    const ai = getGeminiClient();
    const { currentQuestion, instruction, subjectName, grade } = req.body;

    if (!currentQuestion) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin câu hỏi hiện tại.' });
    }
    if (!instruction || !instruction.trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu yêu cầu chỉnh sửa từ giáo viên.' });
    }

    const prompt = `Bạn là Chuyên gia Đo lường & Đánh giá Giáo dục GDPT 2018.
Hãy chỉnh sửa / làm mới CÂU HỎI sau theo đúng yêu cầu của giáo viên:

CÂU HỎI HIỆN TẠI:
${JSON.stringify(currentQuestion, null, 2)}

YÊU CẦU CHỈNH SỬA CỦA GIÁO VIÊN:
"${instruction}"

Môn: ${subjectName || ''} - Khối lớp: ${grade || ''}.

Hãy trả về duy nhất 1 JSON object biểu diễn câu hỏi đã cập nhật hoàn chỉnh theo định dạng:
{
  "id": "${currentQuestion.id || 'q'}",
  "number": ${currentQuestion.number || 1},
  "type": "${currentQuestion.type || 'multiple_choice'}",
  "level": "${currentQuestion.level || 'Nhận biết'}",
  "topic": "${currentQuestion.topic || ''}",
  "sectionTitle": "${currentQuestion.sectionTitle || ''}",
  "passageHeader": "${currentQuestion.passageHeader || ''}",
  "readingPassage": "${currentQuestion.readingPassage || ''}",
  "content": "Nội dung câu hỏi mới...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "subStatements": [
    {"label": "a", "text": "...", "isCorrect": true},
    {"label": "b", "text": "...", "isCorrect": false},
    {"label": "c", "text": "...", "isCorrect": true},
    {"label": "d", "text": "...", "isCorrect": false}
  ],
  "correctAnswer": "Phương án đúng / Kết quả",
  "explanation": "Lời giải chi tiết / Hướng dẫn chấm...",
  "points": ${currentQuestion.points || 0.25}
}`;

    console.log('[DEBUG] prompt size =', prompt ? prompt.length : 0);

    const formattedContents = [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ];

    console.log('[DEBUG] contents format validation: isArray =', Array.isArray(formattedContents), 'firstElementKeys =', formattedContents[0] ? Object.keys(formattedContents[0]) : 'none');
    console.log('[DEBUG] contents.parts exists =', !!formattedContents[0]?.parts, 'contents.parts isArray =', Array.isArray(formattedContents[0]?.parts));

    let response;
    const primaryModel = 'gemini-2.5-flash';
    const fallbackModel = 'gemini-2.5-flash-lite';

    console.log('[DEBUG] primary model name =', primaryModel);
    try {
      response = await ai.models.generateContent({
        model: primaryModel,
        contents: formattedContents,
        config: {
          responseMimeType: 'application/json',
        },
      });
    } catch (apiError: any) {
      console.error('[DEBUG] Primary model invocation failed. Error stack:', apiError.stack || apiError);
      console.log('[DEBUG] fallback model name =', fallbackModel);
      try {
        response = await ai.models.generateContent({
          model: fallbackModel,
          contents: formattedContents,
          config: {
            responseMimeType: 'application/json',
          },
        });
      } catch (fallbackError: any) {
        console.error('[DEBUG] Fallback model invocation failed. Fatal error stack:', fallbackError.stack || fallbackError);
        return res.status(500).json({
          success: false,
          error: `Gemini API invocation failed: Primary model (${primaryModel}) failed with: ${apiError.message}. Fallback model (${fallbackModel}) failed with: ${fallbackError.message}`,
          details: `Primary Error: ${apiError.stack || apiError}\n\nFallback Error: ${fallbackError.stack || fallbackError}`,
        });
      }
    }

    // Log response object details
    console.log('[DEBUG] response object keys =', Object.keys(response || {}));
    console.log('[DEBUG] typeof response.text =', typeof response.text);
    console.log('[DEBUG] is response.text a method =', typeof response.text === 'function');
    if (response) {
      console.log('[DEBUG] response candidate structure =', JSON.stringify(response.candidates?.[0]?.content || {}, null, 2).substring(0, 500));
    }

    const responseText = response.text || '';
    if (!responseText) {
      throw new Error('AI returned an empty response text.');
    }

    let updatedQuestion: Question;
    try {
      updatedQuestion = cleanJsonResponse(responseText);
    } catch (parseError: any) {
      console.error('[JSON Parse Error] Failed to clean and parse updated question:', parseError);
      console.error('[JSON Parse Error] Raw text was:', responseText);
      return res.status(500).json({
        success: false,
        error: `Phản hồi từ AI không đúng định dạng JSON câu hỏi.`,
        details: `Raw output: ${responseText.substring(0, 600)}...`,
      });
    }

    console.log('[API] Question updated successfully');
    res.json({ success: true, question: updatedQuestion });
  } catch (error: any) {
    console.error('[API Fatal Error] edit-question failed:', error.message, error.stack || error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi hệ thống khi chỉnh sửa câu hỏi với Gemini AI.',
      details: error.stack || String(error),
    });
  }
});

// API Route: Export Exam to Word (.docx)
app.post('/api/export-docx', async (req, res) => {
  console.log('[API] Received export-docx request');
  try {
    const exam: ExamPackage = req.body.exam;
    if (!exam || !exam.questions) {
      return res.status(400).json({ success: false, error: 'Dữ liệu đề thi không hợp lệ hoặc bị trống.' });
    }

    let doc;
    try {
      doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Header Table (School name vs Exam Title)
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 45, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: (exam.departmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO').toUpperCase(),
                                bold: true,
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: (exam.schoolName || 'TRƯỜNG THPT / THCS').toUpperCase(),
                                bold: true,
                                size: 22,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: '--------------------',
                                size: 18,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 55, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: (exam.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ').toUpperCase(),
                                bold: true,
                                size: 22,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: `MÔN: ${(exam.subjectName || '').toUpperCase()} - LỚP ${exam.grade || ''}`,
                                bold: true,
                                size: 20,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: `Thời gian làm bài: ${exam.durationMinutes || 90} phút (Không kể thời gian phát đề)`,
                                italics: true,
                                size: 18,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: `Mã đề thi: ${exam.examCode || '101'}`,
                                bold: true,
                                size: 18,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ text: '' }), // Spacer
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: `Họ và tên thí sinh: ............................................................................ Số báo danh: .............................`,
                    italics: true,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({ text: '' }),

              // Questions grouping by sectionTitle
              ...generateDocxQuestions(exam.questions),

              // End of exam note
              new Paragraph({ text: '' }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '------------------ HẾT ------------------',
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: exam.generalInstructions || 'Cán bộ coi thi không giải thích gì thêm.',
                    italics: true,
                    size: 18,
                  }),
                ],
              }),

              // Section 2: Answer Key & Grading Scheme Page Break
              new Paragraph({ text: '', pageBreakBefore: true }),
              new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT - MÔN ${(exam.subjectName || '').toUpperCase()} LỚP ${exam.grade || ''}`,
                    bold: true,
                    size: 24,
                    color: '1E3A8A',
                  }),
                ],
              }),
              new Paragraph({ text: '' }),

              // Answer Key Section
              ...generateDocxAnswerKeyOnly(exam.questions),

              new Paragraph({ text: '', pageBreakBefore: true }),
              // Detailed Explanations Section
              ...generateDocxDetailedExplanations(exam.questions),
            ],
          },
        ],
      });
    } catch (docBuildErr: any) {
      console.error('[DOCX Build Error] Failed to compile docx structure:', docBuildErr);
      return res.status(500).json({
        success: false,
        error: 'Lỗi biên soạn cấu trúc file Word.',
        details: docBuildErr.stack || String(docBuildErr)
      });
    }

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=De_Thi_${exam.subject || 'export'}_Lop${exam.grade || ''}.docx`);
    res.send(buffer);
  } catch (error: any) {
    console.error('[API Fatal Error] export-docx failed:', error.message, error.stack || error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi hệ thống khi xuất file Word.',
      details: error.stack || String(error),
    });
  }
});

// Helper: Format Questions for DOCX
function generateDocxQuestions(questions: Question[]): Paragraph[] {
  const elements: Paragraph[] = [];
  let currentSection = '';

  questions.forEach((q) => {
    if (q.sectionTitle && q.sectionTitle !== currentSection) {
      currentSection = q.sectionTitle;
      elements.push(new Paragraph({ text: '' }));
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: currentSection.toUpperCase(),
              bold: true,
              size: 22,
              color: '1E3A8A',
            }),
          ],
        })
      );
    }

    if (q.readingPassage) {
      if (q.passageHeader) {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: q.passageHeader, bold: true, italics: true, size: 20 })],
          })
        );
      }
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: `"${q.readingPassage}"`, italics: true, size: 20 })],
        })
      );
      elements.push(new Paragraph({ text: '' }));
    }

    // Question content
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Câu ${q.number} (${q.points} điểm) [${q.level}]: `, bold: true, size: 20 }),
          new TextRun({ text: q.content, size: 20 }),
        ],
      })
    );

    // Multiple Choice Options
    if (q.type === 'multiple_choice' && q.options) {
      q.options.forEach((opt) => {
        elements.push(
          new Paragraph({
            indent: { left: 360 },
            children: [new TextRun({ text: opt, size: 20 })],
          })
        );
      });
    }

    // True/False Sub-statements
    if (q.type === 'true_false' && q.subStatements) {
      q.subStatements.forEach((stmt) => {
        elements.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: `${stmt.label}) `, bold: true, size: 20 }),
              new TextRun({ text: stmt.text, size: 20 }),
            ],
          })
        );
      });
    }

    elements.push(new Paragraph({ text: '' })); // Spacing between questions
  });

  return elements;
}

// Helper: Format Answer Key Only (Part I, B, D, A...)
function generateDocxAnswerKeyOnly(questions: Question[]): Paragraph[] {
  const elements: Paragraph[] = [];

  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "I. BẢNG ĐÁP ÁN (ANSWER KEY)",
          bold: true,
          size: 22,
          color: '1E3A8A',
        }),
      ],
    })
  );
  elements.push(new Paragraph({ text: '' }));

  // Group questions by section title to list them logically
  const grouped: Record<string, Question[]> = {};
  questions.forEach((q) => {
    const section = q.sectionTitle || 'PHẦN ĐÁP ÁN';
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(q);
  });

  Object.entries(grouped).forEach(([sectionTitle, qs]) => {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sectionTitle.toUpperCase(),
            bold: true,
            size: 20,
          }),
        ],
      })
    );

    // List answers line by line or grouped
    qs.forEach((q) => {
      elements.push(
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({ text: `Câu ${q.number}: `, bold: true, size: 20 }),
            new TextRun({ text: q.correctAnswer, bold: true, size: 20, color: '10B981' }),
          ],
        })
      );
    });
    elements.push(new Paragraph({ text: '' }));
  });

  return elements;
}

// Helper: Format Detailed Answer Explanations for DOCX
function generateDocxDetailedExplanations(questions: Question[]): Paragraph[] {
  const elements: Paragraph[] = [];

  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "II. HƯỚNG DẪN GIẢI CHI TIẾT (DETAILED EXPLANATIONS)",
          bold: true,
          size: 22,
          color: '1E3A8A',
        }),
      ],
    })
  );
  elements.push(new Paragraph({ text: '' }));

  questions.forEach((q) => {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Câu ${q.number}: `, bold: true, size: 20, color: '1E3A8A' }),
          new TextRun({ text: q.content, size: 20, italics: true }),
        ],
      })
    );

    elements.push(
      new Paragraph({
        indent: { left: 360 },
        children: [
          new TextRun({ text: `Đáp án đúng: `, bold: true, size: 20 }),
          new TextRun({ text: q.correctAnswer, bold: true, size: 20, color: '10B981' }),
        ],
      })
    );

    elements.push(
      new Paragraph({
        indent: { left: 360 },
        children: [
          new TextRun({ text: `Lời giải chi tiết:\n`, bold: true, size: 18 }),
          new TextRun({ text: q.explanation, size: 18 }),
        ],
      })
    );
    elements.push(new Paragraph({ text: '' }));
  });

  return elements;
}

// Start Server / Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server AI GDPT 2018 running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
