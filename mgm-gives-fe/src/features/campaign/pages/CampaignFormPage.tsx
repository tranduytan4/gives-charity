import { Loader2 } from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CampaignFormWizard } from '../components/CampaignFormWizard';
import { useCampaignQuery } from '../hooks/useCampaigns';

export default function CampaignFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaignId = id ? Number.parseInt(id, 10) : null;

  const initialCampaignIdRef = React.useRef(campaignId);

  // Fetch campaign if in Edit mode
  const { data: campaign, isLoading: isLoadingCampaign } = useCampaignQuery(campaignId || 0, {
    enabled: !!campaignId,
  });

  const isInitialLoading = campaignId && isLoadingCampaign && initialCampaignIdRef.current !== null;

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-400 text-sm">Loading campaign details...</p>
      </div>
    );
  }

  return <CampaignFormWizard campaign={campaign} campaignId={campaignId} navigate={navigate} />;
}
