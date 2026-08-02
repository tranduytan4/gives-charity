import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/components/ui/Input';

interface CampaignSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CampaignSearch({ value, onChange }: CampaignSearchProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;

  return (
    <Input
      type="text"
      placeholder={
        currentLang === 'vi'
          ? 'Bạn đang tìm kiếm chiến dịch nào...'
          : 'Which campaign are you looking for...'
      }
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-background"
      startAdornment={<Search className="h-4 w-4 text-muted-foreground" />}
    />
  );
}
