'use client';

import { useState } from 'react';
import { FlexibleDialog } from '@/components/common/ui/FlexibleDialog';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { usePlanLimitStore } from '@/stores/plan-limit.store';
import {
  UpgradeInquiryDialog,
  UpgradeRequestDialog,
  ConsultationRequestDialog,
  UpgradeCompleteDialog,
  ConsultationCompleteDialog,
} from '@/components/sidebar/UpgradeInquiryDialog';
import { AlertCircle, X } from 'lucide-react';
import { UsageLimitType } from './usage-limit-banner';
import { i18n } from '@flowai/i18n';

interface AdminUsageLimitDialogProps {
  type: UsageLimitType;
}

/**
 * 어드민용 AI 사용량 한도 초과 다이얼로그
 * 회사 전체 AI 사용량이 소진되었음을 알리고 요금제 업그레이드를 안내합니다.
 */
export function AdminUsageLimitDialog({ type }: AdminUsageLimitDialogProps) {
  const { t } = useAppTranslation('common');

  const showDefaultDialog = usePlanLimitStore((s) => s.showDefaultLimitDialog);
  const showPremiumDialog = usePlanLimitStore((s) => s.showPremiumLimitDialog);
  const dismissDefaultDialog = usePlanLimitStore((s) => s.dismissDefaultDialog);
  const dismissPremiumDialog = usePlanLimitStore((s) => s.dismissPremiumDialog);
  const hideDefaultDialog = usePlanLimitStore((s) => s.hideDefaultDialog);
  const hidePremiumDialog = usePlanLimitStore((s) => s.hidePremiumDialog);

  const showDialog = type === 'default' ? showDefaultDialog : showPremiumDialog;
  const dismissDialog = type === 'default' ? dismissDefaultDialog : dismissPremiumDialog;
  const hideDialog = type === 'default' ? hideDefaultDialog : hidePremiumDialog;
  const content =
    type === 'default'
      ? {
          title: t(i18n.common.plan_limit_dialog.title_ai),
          mainMessage: t(i18n.common.plan_limit_dialog.main_ai),
          infoMessage: t(i18n.common.plan_limit_dialog.info_ai),
          description: t(i18n.common.plan_limit_dialog.description_ai),
          upgradePrefix: t(i18n.common.plan_limit_dialog.upgrade_prefix_ai),
          upgradeHighlight: t(i18n.common.plan_limit_dialog.upgrade_highlight_ai),
          upgradeSuffix: t(i18n.common.plan_limit_dialog.upgrade_suffix_ai),
        }
      : {
          title: t(i18n.common.plan_limit_dialog.title_premium),
          mainMessage: t(i18n.common.plan_limit_dialog.main_premium),
          infoMessage: t(i18n.common.plan_limit_dialog.info_premium),
          description: t(i18n.common.plan_limit_dialog.description_premium),
          upgradePrefix: t(i18n.common.plan_limit_dialog.upgrade_prefix_premium),
          upgradeHighlight: t(i18n.common.plan_limit_dialog.upgrade_highlight_premium),
          upgradeSuffix: t(i18n.common.plan_limit_dialog.upgrade_suffix_premium),
        };

  // 요금제 업그레이드 관련 다이얼로그 상태 관리
  const [isUpgradeInquiryOpen, setUpgradeInquiryOpen] = useState(false);
  const [isUpgradeRequestOpen, setUpgradeRequestOpen] = useState(false);
  const [isConsultationRequestOpen, setConsultationRequestOpen] = useState(false);
  const [isUpgradeCompleteOpen, setUpgradeCompleteOpen] = useState(false);
  const [isConsultationCompleteOpen, setConsultationCompleteOpen] = useState(false);

  const handleUpgradeClick = () => {
    hideDialog(); // 기존 다이얼로그 임시 숨김 (다음에 다시 보임)
    setUpgradeInquiryOpen(true);
  };

  return (
    <>
      <FlexibleDialog
        open={showDialog}
        onOpenChange={(open) => !open && hideDialog()}
        mode='flexible'
        width='standard'
        closeButton={false}
        className='inline-flex w-96 flex-col items-center justify-start gap-6 p-6'
      >
        {/* 헤더 */}
        <div className='flex flex-col items-start justify-start gap-4 self-stretch'>
          <div className='inline-flex items-center justify-start gap-4 self-stretch'>
            <div className='inline-flex flex-1 flex-col items-start justify-start'>
              <h2 className='text-foreground text-lg font-semibold leading-7'>{content.title}</h2>
            </div>
            <button
              onClick={hideDialog}
              className='hover:bg-accent flex items-center justify-center gap-2 rounded-md p-3'
            >
              <X className='text-foreground h-4 w-4' />
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className='flex flex-col items-start justify-start gap-8'>
          <div className='flex flex-col items-center justify-center gap-4 self-stretch p-4'>
            {/* 메인 메시지 */}
            <div className='text-foreground h-16 self-stretch text-center text-2xl font-semibold leading-8'>
              {content.mainMessage}
            </div>

            {/* 안내 메시지 */}
            <div className='bg-muted inline-flex items-center justify-center gap-2.5 rounded-lg px-4 py-1.5'>
              <AlertCircle className='text-muted-foreground h-6 w-6' />
              <div className='text-muted-foreground text-center text-sm font-normal leading-5'>
                {content.infoMessage}
              </div>
            </div>

            {/* 설명 텍스트 */}
            <div className='text-muted-foreground text-center text-sm font-normal leading-5'>{content.description}</div>
          </div>

          {/* 업그레이드 안내 */}
          <div className='flex flex-col items-start justify-start gap-3 self-stretch px-4'>
            <div className='inline-flex items-center justify-center gap-2.5 self-stretch py-2'>
              <div className='text-center text-sm leading-5'>
                <span className='text-foreground font-semibold'>{content.upgradePrefix}</span>
                <span className='text-primary font-semibold'>{content.upgradeHighlight}</span>
                <span className='text-foreground font-semibold'>{content.upgradeSuffix}</span>
              </div>
            </div>

            {/* 업그레이드 버튼 */}
            <Button onClick={handleUpgradeClick} className='h-12 w-full'>
              {t(i18n.common.plan_limit_dialog.upgrade_button)}
            </Button>
          </div>
        </div>

        {/* 다시 보지 않기 버튼 */}
        <div className='inline-flex h-10 items-center justify-center gap-2 self-stretch'>
          <Button variant='ghost' onClick={dismissDialog} className='text-muted-foreground'>
            {t(i18n.common.plan_limit_dialog.dismiss_today_button)}
          </Button>
        </div>
      </FlexibleDialog>

      {/* 요금제 업그레이드 문의 다이얼로그들 */}
      <UpgradeInquiryDialog
        open={isUpgradeInquiryOpen}
        onOpenChange={setUpgradeInquiryOpen}
        onSelectUpgrade={() => {
          setUpgradeInquiryOpen(false);
          setUpgradeRequestOpen(true);
        }}
        onSelectConsultation={() => {
          setUpgradeInquiryOpen(false);
          setConsultationRequestOpen(true);
        }}
      />
      <UpgradeRequestDialog
        open={isUpgradeRequestOpen}
        onOpenChange={setUpgradeRequestOpen}
        onSubmit={() => {
          setUpgradeRequestOpen(false);
          setUpgradeCompleteOpen(true);
        }}
      />
      <ConsultationRequestDialog
        open={isConsultationRequestOpen}
        onOpenChange={setConsultationRequestOpen}
        onSubmit={() => {
          setConsultationRequestOpen(false);
          setConsultationCompleteOpen(true);
          dismissDialog(); // 상담 신청 완료 시 오늘 하루 다시 안 뜨게 처리
        }}
      />
      <UpgradeCompleteDialog open={isUpgradeCompleteOpen} onOpenChange={setUpgradeCompleteOpen} />
      <ConsultationCompleteDialog open={isConsultationCompleteOpen} onOpenChange={setConsultationCompleteOpen} />
    </>
  );
}
