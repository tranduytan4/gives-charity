import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  disableAnimation?: boolean;
  closeOnOutsideClick?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className,
  disableAnimation = false,
  closeOnOutsideClick = true,
}: DialogProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog
        as="div"
        className="relative z-50"
        onClose={closeOnOutsideClick ? onClose : () => {}}
      >
        <Transition.Child
          as={Fragment}
          enter={disableAnimation ? 'duration-0' : 'ease-out duration-300'}
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave={disableAnimation ? 'duration-0' : 'ease-in duration-200'}
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter={disableAnimation ? 'duration-0' : 'ease-out duration-300'}
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave={disableAnimation ? 'duration-0' : 'ease-in duration-200'}
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel
                className={cn(
                  'w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all',
                  className,
                )}
              >
                {title && (
                  <div className="flex items-center justify-between mb-4">
                    <HeadlessDialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      {title}
                    </HeadlessDialog.Title>
                    <button
                      type="button"
                      className="text-gray-400 rounded-full hover:bg-red-400 hover:cursor-pointer hover:text-white"
                      onClick={onClose}
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
                {children}
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}
