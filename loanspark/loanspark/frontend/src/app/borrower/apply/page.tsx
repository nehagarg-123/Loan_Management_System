'use client';
import { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Topbar from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { calcLoan, formatCurrency } from '@/lib/auth';

const personalSchema = z.object({
  fullName:       z.string().min(2, 'Required'),
  pan:            z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Format: ABCDE1234F'),
  dateOfBirth:    z.string().min(1, 'Required'),
  monthlySalary:  z.coerce.number().min(1, 'Required'),
  employmentMode: z.enum(['salaried', 'self-employed', 'unemployed']),
});
type PersonalData = z.infer<typeof personalSchema>;

const STEPS = ['Authentication', 'Personal Details', 'Salary Slip', 'Loan Config', 'Confirm'];

export default function ApplyPage() {
  const { user, loading } = useAuth(['borrower']);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [loanAmount, setLoanAmount] = useState(300000);
  const [tenure, setTenure] = useState(180);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdLoanId, setCreatedLoanId] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // ✅ FIX 1: useRef instead of document.getElementById
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { simpleInterest, totalRepayment } = calcLoan(loanAmount, tenure);

  const { register, handleSubmit, formState: { errors } } = useForm<PersonalData>({
    resolver: zodResolver(personalSchema),
  });

  const onPersonalSubmit = async (data: PersonalData) => {
    const dob = new Date(data.dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));

    if (age < 23 || age > 50) { toast.error(`Age must be 23–50 (yours: ${age})`); return; }
    if (data.monthlySalary < 25000) { toast.error('Salary must be ≥ ₹25,000/month'); return; }
    if (data.employmentMode === 'unemployed') { toast.error('Unemployed applicants are not eligible'); return; }

    setPersonalData(data);
    setStep(3);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  }, []);

  const validateAndSetFile = (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) { toast.error('Only PDF, JPG, PNG allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setSlipFile(file);
  };

  // ✅ FIX 2: No pre-upload API call — file is uploaded together with loan submission
  const uploadFile = async () => {
    if (!slipFile) { toast.error('Please select a file'); return; }
    toast.success('File ready!');
    setStep(4);
  };

  const submitApplication = async () => {
    if (!personalData) return;
    setSubmitting(true);
    try {
      // 1️⃣ Create Loan
      const res = await api.post('/loans', {
        ...personalData,
        pan: personalData.pan.toUpperCase(),
        loanAmount,
        tenure,
      });

      const loanId = res.data.data.loan._id;
      setCreatedLoanId(loanId);

      // 2️⃣ Upload Salary Slip
      // ✅ FIX 3: No manual Content-Type header — axios sets the multipart boundary automatically
      if (slipFile) {
        const formData = new FormData();
        formData.append('salarySlip', slipFile);
        await api.post(`/loans/${loanId}/salary-slip`, formData);
      }

      toast.success('Application submitted successfully!');
      setStep(5);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <AppShell user={user}>
      <Topbar title="Apply for Loan" subtitle="Complete all steps to submit your application" user={user} />
      <div className="p-6 max-w-2xl mx-auto w-full">

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-all ${
                i + 1 < step ? 'bg-blue-600 border-blue-600 text-white' :
                i + 1 === step ? 'border-blue-600 text-blue-600 bg-white' :
                'border-gray-200 text-gray-400 bg-white'
              }`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <div className={`ml-2 text-xs font-medium hidden sm:block ${i + 1 <= step ? 'text-gray-700' : 'text-gray-400'}`}>{s}</div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i + 1 < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Auth */}
        {step === 1 && (
          <div className="card card-body">
            <h2 className="section-title mb-1">Step 1 — Authentication</h2>
            <p className="text-sm text-gray-500 mb-6">You are already signed in and verified.</p>
            <div className="alert-success rounded-lg p-4 flex items-center gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-semibold text-green-800">{user.name}</p>
                <p className="text-sm text-green-700">{user.email}</p>
              </div>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary btn-lg mt-6 w-full">Continue →</button>
          </div>
        )}

        {/* Step 2: Personal Details */}
        {step === 2 && (
          <div className="card card-body">
            <h2 className="section-title mb-1">Step 2 — Personal Details</h2>
            <p className="text-sm text-gray-500 mb-6">Fill your details. BRE checks run on submission.</p>
            <div className="alert-info rounded-lg p-3 mb-5 text-sm">
              ℹ️ Eligibility: Age 23–50, Salary ≥ ₹25,000/month, Valid PAN, Not unemployed
            </div>
            <form onSubmit={handleSubmit(onPersonalSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input {...register('fullName')} className="input" placeholder="As per PAN" />
                  {errors.fullName && <p className="error-text">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="label">PAN Number</label>
                  <input {...register('pan')} className="input uppercase" placeholder="ABCDE1234F" maxLength={10} />
                  {errors.pan && <p className="error-text">{errors.pan.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Birth</label>
                  <input {...register('dateOfBirth')} type="date" className="input" />
                  {errors.dateOfBirth && <p className="error-text">{errors.dateOfBirth.message}</p>}
                </div>
                <div>
                  <label className="label">Monthly Salary (₹)</label>
                  <input {...register('monthlySalary')} type="number" className="input" placeholder="25000" />
                  {errors.monthlySalary && <p className="error-text">{errors.monthlySalary.message}</p>}
                </div>
              </div>
              <div>
                <label className="label">Employment Mode</label>
                <select {...register('employmentMode')} className="input">
                  <option value="salaried">Salaried</option>
                  <option value="self-employed">Self-Employed</option>
                  <option value="unemployed">Unemployed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button type="submit" className="btn-primary flex-1">Run BRE & Continue →</button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Upload Slip */}
        {step === 3 && (
          <div className="card card-body">
            <h2 className="section-title mb-1">Step 3 — Upload Salary Slip</h2>
            <p className="text-sm text-gray-500 mb-6">PDF, JPG, or PNG · Max 5MB</p>

            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-4xl mb-3">📄</div>
              {slipFile ? (
                <div>
                  <p className="font-semibold text-gray-800">{slipFile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(slipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Ready to upload</span>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium">Drop your file here or <span className="text-blue-600">browse</span></p>
                  <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG up to 5MB</p>
                </div>
              )}
            </div>

            {/* ✅ FIX 1: ref + accept + reset value so same file can be re-selected */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) validateAndSetFile(file);
                e.target.value = '';
              }}
            />

            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
              <button
                onClick={uploadFile}
                disabled={!slipFile || uploading}
                className="btn-primary flex-1"
              >
                {uploading ? 'Uploading...' : 'Upload & Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Loan Config */}
        {step === 4 && (
          <div className="card card-body">
            <h2 className="section-title mb-1">Step 4 — Loan Configuration</h2>
            <p className="text-sm text-gray-500 mb-6">Adjust amount and tenure using the sliders</p>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="label mb-0">Loan Amount</label>
                  <span className="text-blue-600 font-bold">{formatCurrency(loanAmount)}</span>
                </div>
                <input type="range" min={50000} max={5000000} step={10000} value={loanAmount} onChange={e => setLoanAmount(+e.target.value)} className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>₹50K</span><span>₹50L</span></div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="label mb-0">Tenure</label>
                  <span className="text-blue-600 font-bold">{tenure} days</span>
                </div>
                <input type="range" min={30} max={365} step={1} value={tenure} onChange={e => setTenure(+e.target.value)} className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>30 days</span><span>365 days</span></div>
              </div>
            </div>
            <div className="mt-6 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl p-5 text-white">
              <p className="text-blue-300 text-sm">Simple Interest (12% p.a.)</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(simpleInterest)}</p>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
                <div><p className="text-blue-300 text-xs">Principal</p><p className="font-bold">{formatCurrency(loanAmount)}</p></div>
                <div><p className="text-blue-300 text-xs">Total Repayment</p><p className="font-bold">{formatCurrency(totalRepayment)}</p></div>
                <div><p className="text-blue-300 text-xs">Tenure</p><p className="font-bold">{tenure} days</p></div>
                <div><p className="text-blue-300 text-xs">Daily</p><p className="font-bold">{formatCurrency(Math.round(totalRepayment / tenure))}</p></div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(5)} className="btn-primary flex-1">Review & Submit →</button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && !createdLoanId && (
          <div className="card card-body">
            <h2 className="section-title mb-4">Step 5 — Review & Confirm</h2>
            <div className="space-y-3 text-sm">
              {[
                ['Full Name', personalData?.fullName],
                ['PAN', personalData?.pan],
                ['DOB', personalData?.dateOfBirth],
                ['Salary', personalData ? formatCurrency(personalData.monthlySalary) + '/month' : ''],
                ['Employment', personalData?.employmentMode],
                ['Loan Amount', formatCurrency(loanAmount)],
                ['Tenure', tenure + ' days'],
                ['Interest', formatCurrency(simpleInterest)],
                ['Total Repayment', formatCurrency(totalRepayment)],
                ['Salary Slip', slipFile?.name ?? 'Not selected'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(4)} className="btn-secondary flex-1">← Back</button>
              <button onClick={submitApplication} disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Submitting...' : '🚀 Submit Application'}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 5 && createdLoanId && (
          <div className="card card-body text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-500 mb-4">Your loan application is under review. We'll notify you of any updates.</p>
            <p className="text-xs bg-gray-100 rounded-lg px-4 py-2 font-mono inline-block mb-6">{createdLoanId}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/borrower/loans')} className="btn-primary">View My Loans →</button>
              <button onClick={() => { setStep(1); setCreatedLoanId(''); }} className="btn-secondary">New Application</button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}