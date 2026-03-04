import Link from "next/link";
import { FileUp, Wand2, ArrowLeft } from "lucide-react";

export default function NewDealPage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Deal</h1>
        <p className="text-gray-500 mt-1">
          Choose how you&apos;d like to create this deal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Mode A: Statement Upload */}
        <Link
          href="/deals/new/statement"
          className="group relative flex flex-col items-center p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-emerald-400 hover:shadow-lg transition-all"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
            <FileUp className="w-8 h-8 text-emerald-800" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Statement
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            Upload a merchant statement PDF for AI-powered analysis
          </p>
          <div className="mt-6 px-4 py-2 bg-emerald-50 text-emerald-800 text-sm font-medium rounded-lg group-hover:bg-emerald-800 group-hover:text-white transition-colors">
            Select
          </div>
        </Link>

        {/* Mode B: Guided Wizard */}
        <Link
          href="/deals/new/wizard"
          className="group relative flex flex-col items-center p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-purple-400 hover:shadow-lg transition-all"
        >
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-purple-100 transition-colors">
            <Wand2 className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Guided Wizard
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            Enter merchant details step by step
          </p>
          <div className="mt-6 px-4 py-2 bg-purple-50 text-purple-600 text-sm font-medium rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
            Select
          </div>
        </Link>
      </div>
    </div>
  );
}
