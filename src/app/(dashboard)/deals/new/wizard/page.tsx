import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import WizardShell from '@/components/wizard/WizardShell';

export default function WizardPage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/deals/new"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Mode Selection
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Deal — Guided Wizard</h1>
        <p className="text-gray-500 mt-1">
          Enter merchant details step by step to calculate pricing
        </p>
      </div>

      <WizardShell />
    </div>
  );
}
