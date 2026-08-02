import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/shared/components/ui/Button';
import { Calendar } from '@/shared/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/Popover';
import { cn } from '@/shared/utils/cn';

export interface DateRangePickerProps {
  value?: { from?: Date; to?: Date };
  onChange?: (range: { from?: Date; to?: Date } | undefined) => void;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  onBlur?: () => void;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  disabled = false,
  error = false,
  onBlur,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && onBlur) {
      onBlur();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (onChange) {
      onChange(range ? { from: range.from, to: range.to } : undefined);
    }
  };

  const rangeVal: DateRange | undefined = value ? { from: value.from, to: value.to } : undefined;

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover
        open={disabled ? false : open}
        onOpenChange={disabled ? undefined : handleOpenChange}
      >
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-10 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 border',
              error
                ? 'border-red-500 ring-1 ring-red-500/20 focus-visible:ring-red-500 focus-visible:border-red-500'
                : 'border-input focus-visible:ring-primary/20',
              !value?.from && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            {value?.from ? (
              value.to ? (
                <>
                  {formatDate(value.from)} - {formatDate(value.to)}
                </>
              ) : (
                formatDate(value.from)
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={rangeVal}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
