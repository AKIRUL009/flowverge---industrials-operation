import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  Check,
  Sparkles,
  Mic,
  MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { getAIInstance } from '../utils/ai';

interface ChecklistItem {
  id: number;
  template_id: number;
  question_text: string;
  answer_type: 'Yes/No' | 'Text' | 'Number' | 'Photo';
  is_mandatory: number;
  requires_photo: number;
  order_no: number;
}

interface Answer {
  item_id: number;
  answer_value: string;
  remarks: string;
  quantity?: number;
}

import GeotagCamera from './GeotagCamera';

const parseAISafe = (text: string, fallback: any) => {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
};

export default function ChecklistFill() {
  const { siteId, stageId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [status, setStatus] = useState<'Draft' | 'Submitted' | 'Locked'>('Draft');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState<number | null>(null);

  const [autoFilling, setAutoFilling] = useState(false);
  const [showAutoFillCamera, setShowAutoFillCamera] = useState(false);
  const [aiFilled, setAiFilled] = useState<Set<number>>(new Set());
  const [listeningItemId, setListeningItemId] = useState<number | null>(null);
  const [processingVoiceId, setProcessingVoiceId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [siteId, stageId]);

  const handlePhotoCapture = (itemId: number, base64: string) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { item_id: itemId, remarks: '' }),
        answer_value: base64
      }
    }));
    setShowCamera(null);
  };

  const handleAutoFill = async (base64: string) => {
    setShowAutoFillCamera(false);
    setAutoFilling(true);

    try {
      const { ai, model } = await getAIInstance(token!);

      const questionsText = items.map((item, i) =>
        `${i + 1}. [${item.answer_type}] ${item.question_text}`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64.replace(/^data:image\/\w+;base64,/, '')
                }
              },
              {
                text: `You are analyzing a solar installation site photo to pre-fill a field checklist.

Checklist questions:
${questionsText}

For each question, analyze the photo and respond ONLY with a JSON array:
[
  { "item_id": NUMBER, "answer": "Yes or No or text value or null", "confidence": "high or medium or low", "remarks": "short note" }
]

Rules:
- item_id must match the question number exactly (1, 2, 3...)
- For Yes/No: answer must be exactly "Yes", "No", or null
- For Number: answer must be a number string or null
- For Text: answer must be a short description or null
- For Photo: always answer null
- Only answer with high or medium confidence. Use null if unsure.
- Return ONLY the JSON array, nothing else.`
              }
            ]
          }
        ]
      });

      const result = parseAISafe(response.text || '[]', []);
      
      if (Array.isArray(result) && result.length > 0) {
        let filledCount = 0;
        const newAiFilled = new Set(aiFilled);

        result.forEach((r: any, index: number) => {
          const item = items[index];
          if (!item) return;
          if (r.answer !== null && (r.confidence === 'high' || r.confidence === 'medium')) {
            setAnswers(prev => ({
              ...prev,
              [item.id]: {
                item_id: item.id,
                answer_value: r.answer,
                remarks: prev[item.id]?.remarks || r.remarks || ''
              }
            }));
            newAiFilled.add(item.id);
            filledCount++;
          }
        });

        setAiFilled(newAiFilled);
        if (filledCount > 0) {
          alert(`✨ AI filled ${filledCount} of ${items.length} questions. Review before submitting.`);
        } else {
          alert('AI could not determine answers from this photo. Please fill manually.');
        }
      }
    } catch (err: any) {
      console.error('Auto-fill error:', err);
      if (err?.status === 429 || err?.message?.includes('429')) {
        alert('AI service is currently busy (rate limit reached). Please try again in a minute or fill manually.');
      } else {
        alert('AI could not process the photo. Please fill manually.');
      }
    } finally {
      setAutoFilling(false);
    }
  };

  const handleVoiceInput = (item: ChecklistItem) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return; // Browser doesn't support it — fail silently

    if (listeningItemId === item.id) {
      setListeningItemId(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    setListeningItemId(item.id);

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListeningItemId(null);
      setProcessingVoiceId(item.id);

      try {
        const { ai, model } = await getAIInstance(token!);
        const response = await ai.models.generateContent({
          model: model,
          contents: `A field worker answered a checklist question by speaking. Convert their answer to the correct format.

Question: "${item.question_text}"
Answer type: "${item.answer_type}"
Worker said: "${transcript}"

Respond ONLY with JSON:
{
  "answer_value": "Yes",
  "remarks": "optional extra context they mentioned"
}

Rules:
- For Yes/No: detect positive words (yes, done, confirmed, good, ok, complete, clear) → "Yes", negative (no, not, missing, failed, incomplete, problem) → "No"
- For Text: use the transcript as the answer_value
- For Number: extract only the number from the speech as a string
- Return ONLY the JSON object, nothing else.`
        });

        const parsed = parseAISafe(response.text || '{}', null);
        if (parsed && parsed.answer_value) {
          setAnswers(prev => ({
            ...prev,
            [item.id]: {
              item_id: item.id,
              answer_value: parsed.answer_value,
              remarks: parsed.remarks || prev[item.id]?.remarks || ''
            }
          }));
        }
      } catch (err: any) {
        console.error('Voice processing error:', err);
        if (err?.status === 429 || err?.message?.includes('429')) {
          alert('AI service is currently busy (rate limit reached). Please try again in a minute or type manually.');
        } else {
          alert('AI could not process the voice input. Please type manually.');
        }
      } finally {
        setProcessingVoiceId(null);
      }
    };

    recognition.onerror = () => {
      setListeningItemId(null);
      setProcessingVoiceId(null);
    };

    recognition.onend = () => {
      setListeningItemId(null);
    };

    recognition.start();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templateRes, responseRes] = await Promise.all([
        api.get(`/api/checklists/template/${stageId}`, token!),
        api.get(`/api/checklists/response/${siteId}/${stageId}`, token!)
      ]);

      if (templateRes) {
        setItems(templateRes.items || []);
      }
      
      if (responseRes) {
        setStatus(responseRes.status);
        const answerMap: Record<number, Answer> = {};
        (responseRes.answers || []).forEach((a: any) => {
          answerMap[a.item_id] = {
            item_id: a.item_id,
            answer_value: a.answer_value,
            remarks: a.remarks || '',
            quantity: a.quantity
          };
        });
        setAnswers(answerMap);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (itemId: number, value: string) => {
    if (status === 'Locked') return;
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { item_id: itemId, remarks: '' }),
        answer_value: value
      }
    }));
  };

  const handleRemarksChange = (itemId: number, remarks: string) => {
    if (status === 'Locked') return;
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { item_id: itemId, answer_value: '' }),
        remarks
      }
    }));
  };

  const handleSubmit = async (isFinal: boolean) => {
    try {
      setSubmitting(true);
      setError(null);

      const template = items[0]?.template_id;
      if (!template) throw new Error('No template found');

      if (isFinal) {
        const missing = items.filter(item => {
          if (!item.is_mandatory) return false;
          const ans = answers[item.id];
          if (!ans || !ans.answer_value) return true;
          return false;
        });

        if (missing.length > 0) {
          throw new Error(`Please complete all mandatory fields.`);
        }
      }

      const payload = {
        template_id: template,
        site_id: Number(siteId),
        status: isFinal ? 'Submitted' : 'Draft',
        answers: Object.values(answers)
      };

      await api.post('/api/checklists/response', payload, token!);
      
      if (isFinal) {
        setSuccess(true);
        setTimeout(() => navigate(`/sites/${siteId}`), 2000);
      } else {
        alert('Draft saved successfully');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-zinc-900">Checklist</h1>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              status === 'Submitted' ? 'bg-emerald-100 text-emerald-700' :
              status === 'Locked' ? 'bg-zinc-100 text-zinc-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {status === 'Draft' && (
              <button 
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
                title="Save Draft"
              >
                <Save className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex flex-col items-center text-center gap-4 shadow-sm">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-900">Checklist Submitted!</p>
              <p className="text-sm text-emerald-700 mt-1">
                The Stage Condition Engine has detected completion. 
                A stage advancement request has been automatically forwarded to the Project Manager.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-emerald-100">
              <Sparkles className="w-3 h-3" />
              AI Engine Active
            </div>
          </div>
        )}

        {status === 'Draft' && items.length > 0 && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900">AI Auto-Fill</p>
                <p className="text-xs text-emerald-700">Take one site photo to auto-fill checklist answers</p>
                {aiFilled.size > 0 && (
                  <button
                    onClick={() => {
                      setAiFilled(new Set());
                      const cleared: Record<number, Answer> = {};
                      Object.keys(answers).forEach(k => {
                        const id = Number(k);
                        if (!aiFilled.has(id)) cleared[id] = answers[id];
                      });
                      setAnswers(cleared);
                    }}
                    className="text-[10px] text-zinc-400 underline mt-1 block"
                  >
                    Clear AI fills
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowAutoFillCamera(true)}
              disabled={autoFilling}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {autoFilling ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
              ) : (
                <><Camera className="w-3 h-3" /> Auto-Fill</>
              )}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start gap-3">
                <p className="font-medium text-zinc-900 flex-1">
                  {item.question_text}
                  {item.is_mandatory === 1 && <span className="text-red-500 ml-1">*</span>}
                  {aiFilled.has(item.id) && (
                    <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      ✨ AI suggested
                    </span>
                  )}
                </p>
                {status !== 'Locked' && (typeof (window as any).SpeechRecognition !== 'undefined' || typeof (window as any).webkitSpeechRecognition !== 'undefined') && (
                  <button
                    onClick={() => handleVoiceInput(item)}
                    disabled={processingVoiceId === item.id}
                    className={`p-2 rounded-xl transition-all shrink-0 ${
                      listeningItemId === item.id
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : processingVoiceId === item.id
                        ? 'bg-zinc-100 text-zinc-400'
                        : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600'
                    }`}
                    title={listeningItemId === item.id ? 'Listening... tap to stop' : 'Voice input'}
                  >
                    {processingVoiceId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : listeningItemId === item.id ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {item.answer_type === 'Yes/No' && (
                  <div className="flex gap-2">
                    {['Yes', 'No'].map(opt => (
                      <button
                        key={opt}
                        disabled={status === 'Locked'}
                        onClick={() => handleAnswerChange(item.id, opt)}
                        className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                          answers[item.id]?.answer_value === opt
                            ? opt === 'Yes' 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200'
                              : 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                            : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {item.answer_type === 'Text' && (
                  <textarea
                    disabled={status === 'Locked'}
                    value={answers[item.id]?.answer_value || ''}
                    onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all min-h-[100px]"
                  />
                )}

                {item.answer_type === 'Number' && (
                  <input
                    disabled={status === 'Locked'}
                    type="number"
                    value={answers[item.id]?.answer_value || ''}
                    onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                    placeholder="Enter value"
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                )}

                {item.answer_type === 'Photo' && (
                  <div className="space-y-3">
                    {answers[item.id]?.answer_value ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200">
                        <img 
                          src={answers[item.id].answer_value} 
                          alt="Proof" 
                          className="w-full h-full object-cover"
                        />
                        {status !== 'Locked' && (
                          <button 
                            onClick={() => setAnswers(prev => ({ ...prev, [item.id]: { ...prev[item.id], answer_value: '' } }))}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      status !== 'Locked' && (
                        <button 
                          onClick={() => setShowCamera(item.id)}
                          className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 transition-all"
                        >
                          <Camera className="w-8 h-8" />
                          <span className="text-xs font-bold uppercase tracking-wider">Take Photo</span>
                        </button>
                      )
                    )}
                  </div>
                )}

                {showCamera === item.id && (
                  <GeotagCamera 
                    onCapture={(base64) => handlePhotoCapture(item.id, base64)}
                    onClose={() => setShowCamera(null)}
                  />
                )}

                {status !== 'Locked' && (
                  <textarea
                    value={answers[item.id]?.remarks || ''}
                    onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                    placeholder="Remarks (optional)"
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {status === 'Draft' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-zinc-200">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-xl shadow-zinc-200"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Final Checklist
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showAutoFillCamera && (
        <GeotagCamera
          onCapture={handleAutoFill}
          onClose={() => setShowAutoFillCamera(false)}
        />
      )}
    </div>
  );
}
