import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';
import * as z from 'zod';
import { createDonation } from '@/features/donations/api';
import { donationQueryKeys } from '@/features/donations/constants/queryKeys.ts';
import type { DonationPayload } from '@/features/donations/types/types.ts';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { generateUUID } from '@/shared/utils/uuid';

const donationSchema = z.object({
  donationType: z.enum(['MONEY', 'GOODS']),
  amount: z.coerce.number().min(1, 'Amount must be at least 1').optional(),
  goodsDescription: z.string().optional(),
  transactionId: z.string().min(1, 'Transaction reference/ID is required'),
  anonymous: z.boolean(),
});

type DonationFormValues = z.infer<typeof donationSchema>;

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaignName: string;
  onSuccess?: (amount?: number) => void;
  prefillMoneyOnly?: boolean;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

export function DonationModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  onSuccess,
  prefillMoneyOnly = false,
}: DonationModalProps) {
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateUUID());

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DonationFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver type mismatch with react-hook-form
    resolver: zodResolver(donationSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      donationType: 'MONEY',
      amount: undefined,
      goodsDescription: '',
      transactionId: '',
      anonymous: false,
    },
  });
  const queryClient = useQueryClient();
  const donationType = watch('donationType');
  const amount = watch('amount');

  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateUUID());
    }
  }, [isOpen]);

  const onSubmit = async (data: DonationFormValues) => {
    if (data.donationType === 'MONEY' && !data.amount) {
      toast.error('Amount is required for money donations');
      return;
    }
    if (
      data.donationType === 'GOODS' &&
      (!data.goodsDescription || data.goodsDescription.trim() === '')
    ) {
      toast.error('Goods description is required');
      return;
    }

    try {
      const payload: DonationPayload = {
        campaignId,
        donationType: data.donationType,
        amount: data.donationType === 'MONEY' ? data.amount : undefined,
        goodsDescription: data.donationType === 'GOODS' ? data.goodsDescription : undefined,
        anonymous: data.anonymous,
        transactionId: data.transactionId,
      };

      const res = await createDonation(payload, idempotencyKey);

      if (res.success) {
        toast.success(res.message || 'Donation submitted successfully!');

        queryClient.invalidateQueries({ queryKey: donationQueryKeys.myDonations });
        queryClient.invalidateQueries({ queryKey: ['followed-campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });

        reset();
        setIdempotencyKey(generateUUID());

        if (onSuccess) {
          onSuccess(data.amount);
        }

        onClose();
        return;
      }

      toast.error(res.message || 'Failed to submit donation.');
    } catch (err) {
      console.error(err);

      const errMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      toast.error(errMsg);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Donate to: ${campaignName}`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
        {/* Donation Type Tab Selector */}
        {!prefillMoneyOnly && (
          <div className="space-y-2">
            <Label>Donation Type</Label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setValue('donationType', 'MONEY');
                  setValue('goodsDescription', '');
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                  donationType === 'MONEY'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Money
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('donationType', 'GOODS');
                  setValue('amount', undefined);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                  donationType === 'GOODS'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Goods / Items
              </button>
            </div>
          </div>
        )}

        {/* Conditional inputs based on Donation Type */}
        {donationType === 'MONEY' ? (
          <div className="space-y-2 animate-fadeIn">
            <Label htmlFor="amount">
              Amount (VND) <span className="text-red-500">*</span>
            </Label>
            <NumericFormat
              id="amount"
              customInput={Input}
              getInputRef={register('amount').ref}
              thousandSeparator=","
              decimalSeparator="."
              placeholder="e.g. 50,000, 100,000, 200,000"
              value={amount !== undefined ? amount : ''}
              onValueChange={(values) => {
                setValue('amount', values.floatValue, {
                  shouldValidate: true,
                });
              }}
              className={errors.amount ? 'border-red-500' : ''}
            />

            {/* Quick Pick buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setValue('amount', amt)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all border border-gray-200/50 cursor-pointer"
                >
                  {new Intl.NumberFormat('en-US').format(amt)} VND
                </button>
              ))}
            </div>

            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
          </div>
        ) : (
          <div className="space-y-2 animate-fadeIn">
            <Label htmlFor="goodsDescription">
              Description of Goods <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="goodsDescription"
              {...register('goodsDescription')}
              rows={3}
              placeholder="e.g. 10 warm blankets, 5 boxes of canned milk"
              className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            {errors.goodsDescription && (
              <p className="text-xs text-red-500">{errors.goodsDescription.message}</p>
            )}
          </div>
        )}

        {/* Transaction Reference ID */}
        <div className="space-y-2">
          <Label htmlFor="transactionId">
            Transaction ID / Reference Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="transactionId"
            placeholder="e.g. BANK-98317 or DELIVERY-001"
            {...register('transactionId')}
            className={errors.transactionId ? 'border-red-500' : ''}
          />
          <p className="text-[11px] text-gray-500 leading-normal">
            For Money, enter your bank transfer ref. For Goods, enter your shipping slip or carrier
            tracking number.
          </p>
          {errors.transactionId && (
            <p className="text-xs text-red-500">{errors.transactionId.message}</p>
          )}
        </div>

        {/* Anonymous Option */}
        <div className="py-2">
          <Checkbox
            id="anonymous"
            label={
              <div className="grid gap-0.5 leading-none">
                <span className="font-medium text-gray-700">Donate Anonymously</span>
                <span className="text-[11px] text-gray-500 font-normal leading-normal">
                  Your name will not be shown publicly on the campaign supporters board.
                </span>
              </div>
            }
            {...register('anonymous')}
          />
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Donation'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
