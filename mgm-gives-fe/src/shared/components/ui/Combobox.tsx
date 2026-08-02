import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/Popover';
import { cn } from '@/shared/utils/cn';

export interface ComboboxOption {
  id: number;
  name: string;
  description?: string | null;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onSuggest?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  onBlur?: () => void;
}

export function Combobox({
  options,
  selectedIds,
  onToggle,
  onSuggest,
  placeholder = 'Select options...',
  disabled = false,
  error = false,
  onBlur,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && onBlur) {
      onBlur();
    }
  };

  const selectedOptions = options.filter((o) => selectedIds.includes(o.id));

  const filteredOptions = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  const exactMatchExists = options.some(
    (o) => o.name.toLowerCase() === search.trim().toLowerCase(),
  );

  const showSuggest = onSuggest && search.trim().length >= 2 && !exactMatchExists;

  return (
    <div className="flex flex-col gap-2">
      <Popover
        open={disabled ? false : open}
        onOpenChange={disabled ? undefined : handleOpenChange}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between h-auto min-h-[40px] px-3 py-2 text-left font-normal border hover:bg-background disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200',
              error
                ? 'border-red-500 ring-1 ring-red-500/20 focus-visible:ring-red-500 focus-visible:border-red-500'
                : 'border-input focus-visible:ring-primary/20',
            )}
          >
            <div className="flex flex-wrap gap-1.5 items-center max-w-[90%]">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((opt) => (
                  <Badge
                    key={opt.id}
                    variant="secondary"
                    className={cn(
                      'flex items-center gap-1 py-0.5 pl-2 pr-1 text-xs',
                      disabled ? 'cursor-not-allowed pr-2 opacity-80' : 'cursor-pointer',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (disabled) return;
                      onToggle(opt.id);
                    }}
                  >
                    {opt.name}
                    {!disabled && (
                      <span className="rounded-full hover:bg-muted p-0.5">
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </span>
                    )}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command className="w-full">
            <CommandInput
              placeholder="Search category..."
              value={search}
              onValueChange={setSearch}
              className="flex h-10 w-full border-b border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <CommandList className="max-h-[200px] overflow-y-auto p-1">
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = selectedIds.includes(option.id);
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.name}
                      aria-describedby={
                        option.description ? `category-description-${option.id}` : undefined
                      }
                      onSelect={() => {
                        onToggle(option.id);
                      }}
                      className={cn(
                        'group relative flex w-full cursor-pointer select-none items-start rounded-sm px-2 py-1.5 text-sm outline-none transition-colors duration-200 hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
                      )}
                    >
                      <Check
                        className={cn(
                          'mr-2 mt-0.5 h-4 w-4 shrink-0',
                          isSelected ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{option.name}</span>
                        {option.description && (
                          <span
                            id={`category-description-${option.id}`}
                            className="block max-h-0 overflow-hidden pr-2 text-xs leading-5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:max-h-16 group-hover:pt-0.5 group-hover:opacity-100 group-data-[selected=true]:max-h-16 group-data-[selected=true]:pt-0.5 group-data-[selected=true]:opacity-100"
                          >
                            {option.description}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {filteredOptions.length === 0 && !showSuggest && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No categories found.
                </div>
              )}

              {showSuggest && (
                <button
                  type="button"
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none text-primary hover:bg-accent hover:text-accent-foreground font-medium border-t border-border mt-1 text-left bg-transparent border-0"
                  onClick={() => {
                    if (onSuggest) {
                      onSuggest(search.trim());
                    }
                    setSearch('');
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Suggest "{search.trim()}"</span>
                </button>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
