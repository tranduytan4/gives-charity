import { FileText } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">Platform analytics and reporting tools.</p>
      </div>

      <div className="rounded-xl border border-border bg-white p-8 shadow-card text-center">
        <p className="text-gray-400 text-sm">Reports coming soon.</p>
      </div>
    </div>
  );
}
