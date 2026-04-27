'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const leaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid({ message: 'Select a leave type' }),
  startDate: z.date({ message: 'Select a start date' }),
  endDate: z.date({ message: 'Select an end date' }),
  totalDays: z.number().min(1, { message: 'At least 1 day required' }),
  reason: z.string().min(10, { message: 'Reason must be at least 10 characters' }),
});

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

interface LeaveRequestFormProps {
  companyId: string;
  userId: string;
  balances: any[];
}

export function LeaveRequestForm({ companyId, userId, balances }: LeaveRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

  const t = useTranslations("labor.leaveRequest");
  const tCommon = useTranslations("common");

  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      totalDays: 1,
    },
  });

  const calculateDays = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  if (startDate && endDate) {
    const days = calculateDays(startDate, endDate);
    form.setValue('totalDays', days);
  }

  const onSubmit = async (data: LeaveRequestFormValues) => {
    try {
      setLoading(true);

      const response = await fetch('/api/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          companyId,
          userId,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
      toast.error(error.error || t('submitError'));
      return;
    }

    toast.success(t('submitSuccess'));
    form.reset();
  } catch (error) {
    console.error('Error creating leave request:', error);
    toast.error(t('submitError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="leaveTypeId"
          render={({ field }) => (
            <FormItem>
          <FormLabel>{t('leaveType.label')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('leaveType.placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {balances.map((balance) => (
                        <SelectItem key={balance.leaveTypeId} value={balance.leaveTypeId}>
                          {balance.leaveTypeName} ({balance.balance} {t('daysAvailable')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('leaveType.description')}
                  </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('startDate.label')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>{t('startDate.placeholder')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('endDate.label')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>{t('endDate.placeholder')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < (startDate || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

      {form.watch('totalDays') && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">{t('totalDays')}: {form.watch('totalDays')}</p>
        </div>
      )}

      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('reason.label')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('reason.placeholder')}
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              {t('reason.description')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t('submitButton')}
      </Button>
      </form>
    </Form>
  );
}
