import { ChevronRight, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';
import NotFoundPage from '@/shared/layouts/NotFoundPage';
import {
  CampaignFinalReportBody,
  CampaignFinalReportHeader,
  CampaignFinalReportStats,
  FinalPostEditorDialog,
} from '../components';
import { useCampaignDetails } from '../hooks';
import { useCampaignResult } from '../hooks/useFinalPost';

export default function CampaignFinalReportPage() {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading: isLoadingCampaign } = useCampaignDetails(id || '');
  const campaign = response?.result;

  const { data: campaignResult, isLoading: isLoadingResult } = useCampaignResult(
    campaign?.id ?? 0,
    { enabled: !!campaign?.id },
  );

  // Matches CampaignDetailPage's derivation: campaign-team CAMPAIGN_ADMIN members, not just
  // the org-level campaignAdmin flag, must keep the same moderation/edit capabilities here.
  const isCampaignMemberAdmin = campaign?.roleInCampaign === 'CAMPAIGN_ADMIN';
  const isCampaignAdmin = isCampaignMemberAdmin || !!campaign?.campaignAdmin;

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  if (isLoadingCampaign || isLoadingResult) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <NotFoundPage
        title="Campaign Not Found"
        description="The campaign you are looking for does not exist or has been removed."
        backTo={ROUTES.CAMPAIGNS}
        backToText="Back to Campaigns"
      />
    );
  }

  if (!campaignResult) {
    if (!isCampaignAdmin) {
      return (
        <NotFoundPage
          title="Final Report Not Available"
          description="The final report for this campaign has not been published yet."
          backTo={`/campaigns/${campaign.id}`}
          backToText="Back to Campaign"
        />
      );
    }

    return (
      <div className="max-w-3xl mx-auto py-2">
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link to={ROUTES.CAMPAIGNS} className="hover:text-gray-900 transition-colors">
            Campaigns
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <Link
            to={`/campaigns/${campaign.id}`}
            className="hover:text-gray-900 transition-colors truncate max-w-[200px]"
          >
            {campaign.title}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-900 font-medium">Final Report</span>
        </nav>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8 text-center space-y-4">
          <p className="text-3xl">📋</p>
          <h2 className="text-lg font-semibold text-gray-900">Final report not published yet</h2>
          <p className="text-sm text-gray-500">
            Create the final report for this completed campaign.
          </p>
          <Button onClick={() => setIsEditorOpen(true)}>Create Final Report</Button>
        </div>
        <FinalPostEditorDialog
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          campaign={campaign}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between mb-6">
        <nav className="flex items-center text-sm text-gray-500">
          <Link to={ROUTES.CAMPAIGNS} className="hover:text-gray-900 transition-colors">
            Campaigns
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <Link
            to={`/campaigns/${campaign.id}`}
            className="hover:text-gray-900 transition-colors truncate max-w-[200px]"
          >
            {campaign.title}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-900 font-medium">Final Report</span>
        </nav>

        {isCampaignAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Report
          </Button>
        )}
      </div>

      <CampaignFinalReportHeader campaign={campaign} campaignResult={campaignResult} />

      <CampaignFinalReportStats campaignResult={campaignResult} />

      <CampaignFinalReportBody
        campaign={campaign}
        campaignResult={campaignResult}
        isCampaignAdmin={isCampaignAdmin}
      />

      <FinalPostEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        campaign={campaign}
      />
    </div>
  );
}
