import * as PopoverPrimitive from '@radix-ui/react-popover';
import { AlertCircle, Info } from 'lucide-react';
import * as React from 'react';
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/components/ui/Popover';

interface DonationRejectReasonProps {
  rejectReason?: string | null;
  confirmedAt?: string | null;
}

export default function DonationRejectReason({ rejectReason }: DonationRejectReasonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const reasonText =
    rejectReason && rejectReason.trim() !== '' ? rejectReason : 'No rejection reason provided.';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1">
        <span>Rejected</span>

        <PopoverAnchor asChild>
          <button
            type="button"
            className="focus:outline-hidden rounded-full p-0.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors cursor-default inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-rose-500"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label="View rejection details"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </PopoverAnchor>
      </span>

      <PopoverContent
        align="center"
        side="top"
        sideOffset={8}
        className="z-50 w-64 p-3 rounded-xl border border-slate-100 bg-white/95 backdrop-blur-xs text-slate-800 shadow-elevated pointer-events-none select-none focus:outline-hidden"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-none">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            <span>Rejection Reason</span>
          </div>
          <p className="text-xs font-medium text-slate-600 mt-0.5 break-words whitespace-pre-wrap leading-relaxed">
            {reasonText}
          </p>
        </div>
        <PopoverPrimitive.Arrow
          className="fill-white stroke-slate-100 stroke-1"
          width={10}
          height={5}
        />
      </PopoverContent>
    </Popover>
  );
}
