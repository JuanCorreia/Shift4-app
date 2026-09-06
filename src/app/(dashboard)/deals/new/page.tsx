import Link from "next/link";
import { FileUp, Wand2, ArrowLeft, Clock } from "lucide-react";

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
          Both routes end in the same deal. Pick the one that matches what you
          have in front of you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start">
        {/* Mode A: statement upload — the recommended route when a PDF exists,
            so it carries the dominant styling and the "Recommended" marker. */}
        <Link
          href="/deals/new/statement"
          className="group relative flex flex-col items-center p-8 bg-white border-2 border-emerald-500 rounded-2xl shadow-md hover:border-emerald-600 hover:shadow-lg transition-all"
        >
          <span className="absolute top-4 right-4 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100 rounded-full">
            Recommended
          </span>
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
            <FileUp className="w-8 h-8 text-emerald-800" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Statement
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            You have the merchant&apos;s statement PDF. The figures are read for
            you and you only review them.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Needs: a statement PDF
          </p>
          <div className="mt-5 px-4 py-2 bg-emerald-800 text-white text-sm font-medium rounded-lg group-hover:bg-emerald-700 transition-colors">
            Upload a statement
          </div>
        </Link>

        {/* Mode B: guided wizard — the fallback, deliberately quieter. */}
        <Link
          href="/deals/new/wizard"
          className="group relative flex flex-col items-center p-8 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-gray-100 transition-colors">
            <Wand2 className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Guided Wizard
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            No statement to hand. Six short steps: merchant, volume, card mix,
            fees, DCC, review.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Needs: volume and current fees
          </p>
          <div className="mt-5 px-4 py-2 text-gray-700 border border-gray-300 text-sm font-medium rounded-lg group-hover:bg-gray-50 transition-colors">
            Enter details manually
          </div>
        </Link>
      </div>
    </div>
  );
}
