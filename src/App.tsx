import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExamConfigForm } from './components/ExamConfigForm';
import { ExamViewer } from './components/ExamViewer';
import { QuestionEditModal } from './components/QuestionEditModal';
import { ExamHistoryDrawer } from './components/ExamHistoryDrawer';
import type { GenerateExamRequest, ExamPackage, Question } from './types';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentExam, setCurrentExam] = useState<ExamPackage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // History & Storage
  const [savedExams, setSavedExams] = useState<ExamPackage[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Edit Question Modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gdpt2018_saved_exams');
      if (stored) {
        setSavedExams(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  // Save history to localStorage
  const saveExamToHistory = (exam: ExamPackage) => {
    setSavedExams((prev) => {
      const filtered = prev.filter((item) => item.id !== exam.id);
      const updated = [exam, ...filtered];
      localStorage.setItem('gdpt2018_saved_exams', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteExam = (id: string) => {
    setSavedExams((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('gdpt2018_saved_exams', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đề thi đã tạo?')) {
      setSavedExams([]);
      localStorage.removeItem('gdpt2018_saved_exams');
    }
  };

  // Generate Exam API call
  const handleGenerateExam = async (config: GenerateExamRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
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

      if (!data.success || !data.exam) {
        throw new Error(data.error || 'Tạo đề thi thất bại.');
      }

      const generatedExam: ExamPackage = data.exam;
      setCurrentExam(generatedExam);
      saveExamToHistory(generatedExam);
    } catch (err: any) {
      console.error('Generate exam error:', err);
      setError(err.message || 'Lỗi hệ thống khi kết nối với máy chủ AI.');
    } finally {
      setIsLoading(false);
    }
  };

  // Replace single question after edit
  const handleSaveUpdatedQuestion = (updatedQuestion: Question) => {
    if (!currentExam) return;

    const updatedQuestions = currentExam.questions.map((q) =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    );

    const updatedExam: ExamPackage = {
      ...currentExam,
      questions: updatedQuestions,
    };

    setCurrentExam(updatedExam);
    saveExamToHistory(updatedExam);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <Header
        onNewExam={() => setCurrentExam(null)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        savedExamsCount={savedExams.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Lỗi khi biên soạn đề thi:</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {currentExam ? (
          <ExamViewer
            exam={currentExam}
            onBack={() => setCurrentExam(null)}
            onEditQuestion={(q) => setEditingQuestion(q)}
          />
        ) : (
          <ExamConfigForm onSubmit={handleGenerateExam} isLoading={isLoading} />
        )}
      </main>

      {/* Edit Question Modal */}
      <QuestionEditModal
        question={editingQuestion}
        subjectName={currentExam?.subjectName || ''}
        grade={currentExam?.grade || ''}
        onClose={() => setEditingQuestion(null)}
        onSaveUpdatedQuestion={handleSaveUpdatedQuestion}
      />

      {/* History Drawer */}
      <ExamHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedExams={savedExams}
        onSelectExam={(exam) => setCurrentExam(exam)}
        onDeleteExam={handleDeleteExam}
        onClearAll={handleClearAllHistory}
      />
    </div>
  );
}
