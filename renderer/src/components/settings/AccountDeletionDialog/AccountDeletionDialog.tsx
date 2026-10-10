'use client';

import Dialog from '@/components/layout/Modal/Dialog';
import { useTranslatedData } from '@/hooks/use-translation-data';
import { useDeleteRequest } from '@/hooks/use-user';
import { useRouter } from '@/i18n/navigation';
import useAppStore from '@/store';
import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	Info,
	MessageSquare,
	Trash2,
	XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import styles from './AccountDeletionDialog.module.css';
import { Textarea } from '@/components/base/inputs';

interface AccountDeletionDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

const AccountDeletionDialog: React.FC<AccountDeletionDialogProps> = ({ isOpen, onClose }) => {
	const [step, setStep] = useState<
		'initial' | 'reasons' | 'grace-period' | 'final-confirm' | 'success'
	>('initial');
	const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
	const [otherReason, setOtherReason] = useState('');
	const [gracePeriod, setGracePeriod] = useState<30 | 45 | 90>(30);
	const [isDeleting, setIsDeleting] = useState(false);

	const logout = useAppStore((state) => state.auth.logout);
	const user = useAppStore((state) => state.auth.user);
	const token = useAppStore((state) => state.auth.token);
	const router = useRouter();
	const { accountDeletionText } = useTranslatedData();
	const deleteRequestMutation = useDeleteRequest();

	const deletionReasons = [
		{ id: 'privacy', label: accountDeletionText.reasons.reasons.privacy },
		{ id: 'not-useful', label: accountDeletionText.reasons.reasons.notUseful },
		{ id: 'too-complex', label: accountDeletionText.reasons.reasons.tooComplex },
		{ id: 'technical', label: accountDeletionText.reasons.reasons.technical },
		{ id: 'inaccurate', label: accountDeletionText.reasons.reasons.inaccurate },
		{ id: 'switching', label: accountDeletionText.reasons.reasons.switching },
		{ id: 'temporary', label: accountDeletionText.reasons.reasons.temporary },
		{ id: 'other', label: accountDeletionText.reasons.reasons.other },
	];

	const gracePeriodOptions = [
		{ days: 30, label: accountDeletionText.gracePeriod.options['30Days'].label, description: accountDeletionText.gracePeriod.options['30Days'].description },
		{ days: 45, label: accountDeletionText.gracePeriod.options['45Days'].label, description: accountDeletionText.gracePeriod.options['45Days'].description },
		{ days: 90, label: accountDeletionText.gracePeriod.options['90Days'].label, description: accountDeletionText.gracePeriod.options['90Days'].description },
	];

	const handleReasonToggle = (reasonId: string) => {
		setSelectedReasons((prev) =>
			prev.includes(reasonId) ? prev.filter((id) => id !== reasonId) : [...prev, reasonId]
		);
	};

	const handleProceedFromInitial = () => {
		setStep('reasons');
	};

	const handleProceedFromReasons = () => {
		if (selectedReasons.length === 0) {
			toast.error('Please select at least one reason'); // Could be translated too if needed
			return;
		}
		if (selectedReasons.includes('other') && !otherReason.trim()) {
			toast.error('Please specify your reason'); // Could be translated too if needed
			return;
		}
		setStep('grace-period');
	};

	const handleProceedFromGracePeriod = () => {
		setStep('final-confirm');
	};

	const handleBack = () => {
		if (step === 'reasons') setStep('initial');
		else if (step === 'grace-period') setStep('reasons');
		else if (step === 'final-confirm') setStep('grace-period');
	};

	const handleFinalDelete = async () => {
		if (!user?.id) {
			toast.error('User not found. Please try again.');
			return;
		}

		setIsDeleting(true);

		try {
			const reasonLabels = selectedReasons.map((reasonId) => {
				const reason = deletionReasons.find((r) => r.id === reasonId);
				if (reasonId === 'other' && otherReason.trim()) {
					return `${reason?.label}: ${otherReason.trim()}`;
				}
				return reason?.label || reasonId;
			});

			const deletionData = {
				userId: user.id,
				reasonForDelete: reasonLabels,
				gracePeriodDays: gracePeriod,
				requestedAt: new Date().toISOString(),
			};

			await deleteRequestMutation.mutateAsync(deletionData);

			// Show success step
			setStep('success');

			// Auto-logout after 3 seconds
			setTimeout(async () => {
				await logout();
				router.push('/signin');
			}, 3000);
		
		} catch (error) {
			console.error('Account deletion request error:', error);
			toast.error('Failed to submit deletion request. Please try again or contact support.');
			setIsDeleting(false);
		}
	};

	const handleClose = () => {
		if (step === 'success' || isDeleting) return; // Can't close during success or deletion

		// Reset state
		setStep('initial');
		setSelectedReasons([]);
		setOtherReason('');
		setGracePeriod(30);
		onClose();
	};

	const renderInitialStep = () => (
		<div className={styles.stepContainer}>
			<div className={styles.iconContainer}>
				<AlertTriangle size={64} className={styles.warningIcon} />
			</div>

			<h2 className={styles.title}>{accountDeletionText.initial.title}</h2>
			<p className={styles.subtitle}>
				{accountDeletionText.initial.subtitle}
			</p>

			<div className={styles.infoBox}>
				<div className={styles.infoItem}>
					<CheckCircle size={20} className={styles.infoIcon} />
					<div>
						<h4>{accountDeletionText.initial.gracePeriod.title}</h4>
						<p>
							{accountDeletionText.initial.gracePeriod.description}
						</p>
					</div>
				</div>

				<div className={styles.infoItem}>
					<CheckCircle size={20} className={styles.infoIcon} />
					<div>
						<h4>{accountDeletionText.initial.easyRecovery.title}</h4>
						<p>
							{accountDeletionText.initial.easyRecovery.description}
						</p>
					</div>
				</div>

				<div className={styles.infoItem}>
					<XCircle size={20} className={styles.warningIconSmall} />
					<div>
						<h4>{accountDeletionText.initial.permanentAfterGracePeriod.title}</h4>
						<p>
							{accountDeletionText.initial.permanentAfterGracePeriod.description}
						</p>
					</div>
				</div>
			</div>

			<div className={styles.privacyNote}>
				<Info size={20} />
				<p>
					{accountDeletionText.initial.privacyNote}
				</p>
			</div>

			<div className={styles.buttonGroup}>
				<button onClick={handleClose} className={styles.cancelButton}>
					{accountDeletionText.initial.keepAccountButton}
				</button>
				<button onClick={handleProceedFromInitial} className={styles.proceedButton}>
					{accountDeletionText.initial.continueToDeleteButton}
				</button>
			</div>
		</div>
	);

	const renderReasonsStep = () => (
		<div className={styles.stepContainer}>
			<div className={styles.stepHeader}>
				<h2 className={styles.title}> <MessageSquare size={28} className={styles.stepIcon} /> {accountDeletionText.reasons.title}</h2>
				<p className={styles.subtitle}>
					{accountDeletionText.reasons.subtitle}
				</p>
			</div>

			<div className={styles.reasonsContainer}>
				{deletionReasons.map((reason) => (
					<div key={reason.id} className={styles.reasonItem}>
						<button
							className={`${styles.reasonButton} ${
								selectedReasons.includes(reason.id) ? styles.reasonSelected : ''
							}`}
							onClick={() => handleReasonToggle(reason.id)}
						>
							<div className={styles.checkbox}>
								{selectedReasons.includes(reason.id) && <CheckCircle size={20} />}
							</div>
							<span>{reason.label}</span>
						</button>

						{reason.id === 'other' && selectedReasons.includes('other') && (
							<Textarea
								className={styles.otherReasonInput}
								placeholder={accountDeletionText.reasons.otherReasonPlaceholder}
								value={otherReason}
								onChange={(value) => setOtherReason(value)}
								rows={3}
								maxLength={500}
							/>
						)}
					</div>
				))}
			</div>

			<div className={styles.feedbackNote}>
				<p>
					{accountDeletionText.reasons.feedbackNote}
				</p>
			</div>

			<div className={styles.buttonGroup}>
				<button onClick={handleBack} className={styles.backButton}>
					{accountDeletionText.reasons.backButton}
				</button>
				<button
					onClick={handleProceedFromReasons}
					className={styles.proceedButton}
					disabled={selectedReasons.length === 0}
				>
					{accountDeletionText.reasons.nextButton}
				</button>
			</div>
		</div>
	);

	const renderGracePeriodStep = () => (
		<div className={styles.stepContainer}>
			<div className={styles.stepHeader}>
				
				<h2 className={styles.title}><Calendar size={28} className={styles.stepIcon} />{accountDeletionText.gracePeriod.title}</h2>
				<p className={styles.subtitle}>
					{accountDeletionText.gracePeriod.subtitle}
				</p>
			</div>

			<div className={styles.gracePeriodOptions}>
				{gracePeriodOptions.map((option) => (
					<button
						key={option.days}
						className={`${styles.gracePeriodCard} ${
							gracePeriod === option.days ? styles.gracePeriodSelected : ''
						}`}
						onClick={() => setGracePeriod(option.days as 30 | 45 | 90)}
					>
						<div className={styles.gracePeriodRadio}>
							{gracePeriod === option.days && (
								<div className={styles.gracePeriodRadioInner} />
							)}
						</div>
						<div className={styles.gracePeriodContent}>
							<h3>{option.label}</h3>
							<p>{option.description}</p>
						</div>
					</button>
				))}
			</div>

			<div className={styles.recoveryInfo}>
				<Info size={20} />
				<div>
					<h4>{accountDeletionText.gracePeriod.recoveryInfo.title}</h4>
					<p>
						{accountDeletionText.gracePeriod.recoveryInfo.description.replace('{gracePeriod}', gracePeriod.toString())}
					</p>
				</div>
			</div>

			<div className={styles.buttonGroup}>
				<button onClick={handleBack} className={styles.backButton}>
					{accountDeletionText.gracePeriod.backButton}
				</button>
				<button onClick={handleProceedFromGracePeriod} className={styles.proceedButton}>
					{accountDeletionText.gracePeriod.nextButton}
				</button>
			</div>
		</div>
	);

	const renderFinalConfirmStep = () => {
		const deletionDate = new Date();
		deletionDate.setDate(deletionDate.getDate() + gracePeriod);

		return (
			<div className={styles.stepContainer}>
				<div className={styles.finalWarning}>
					<AlertTriangle size={64} className={styles.criticalIcon} />
				</div>

				<h2 className={styles.title}>{accountDeletionText.finalConfirm.title}</h2>
				<p className={styles.subtitle}>
					{accountDeletionText.finalConfirm.subtitle}
				</p>

				<div className={styles.summaryBox}>
					<h3>{accountDeletionText.finalConfirm.summaryTitle}</h3>

					<div className={styles.summaryItem}>
						<strong>{accountDeletionText.finalConfirm.summaryLabels.account}:</strong>
						<span>{user?.email}</span>
					</div>

					<div className={styles.summaryItem}>
						<strong>{accountDeletionText.finalConfirm.summaryLabels.gracePeriod}:</strong>
						<span>{gracePeriod} days</span>
					</div>

					<div className={styles.summaryItem}>
						<strong>{accountDeletionText.finalConfirm.summaryLabels.permanentDeletionAfter}:</strong>
						<span>
							{deletionDate.toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							})}
						</span>
					</div>

					<div className={styles.summaryItem}>
						<strong>{accountDeletionText.finalConfirm.summaryLabels.yourReasons}:</strong>
						<div className={styles.reasonsList}>
							{selectedReasons.map((reasonId) => {
								const reason = deletionReasons.find((r) => r.id === reasonId);
								return <span key={reasonId}>• {reason?.label}</span>;
							})}
							{selectedReasons.includes('other') && otherReason && (
								<span className={styles.otherReasonText}>"{otherReason}"</span>
							)}
						</div>
					</div>
				</div>

				<div className={styles.finalWarningBox}>
					<h4>{accountDeletionText.finalConfirm.whatHappensNext.title}</h4>
					<ul>
						{accountDeletionText.finalConfirm.whatHappensNext.steps.map((step: string, index: number) => (
							<li key={index}>{step.replace('{gracePeriod}', gracePeriod.toString())}</li>
						))}
					</ul>
				</div>

				<div className={styles.buttonGroup}>
					<button onClick={handleBack} className={styles.backButton}>
						{accountDeletionText.finalConfirm.backButton}
					</button>
					<button
						onClick={handleFinalDelete}
						className={styles.deleteButton}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<>
								<div className={styles.spinner} />
								{accountDeletionText.finalConfirm.deletingText}
							</>
						) : (
							<>
								<Trash2 size={20} />
								{accountDeletionText.finalConfirm.deleteButton}
							</>
						)}
					</button>
				</div>
			</div>
		);
	};

	const renderSuccessStep = () => (
		<div className={styles.stepContainer}>
			<div className={styles.successIcon}>
				<CheckCircle size={64} />
			</div>

			<h2 className={styles.title}>{accountDeletionText.success.title}</h2>
			<p className={styles.subtitle}>
				{accountDeletionText.success.subtitle.replace('{gracePeriod}', gracePeriod.toString())}
			</p>

			<div className={styles.successBox}>
				<h3>{accountDeletionText.success.whatYouNeedToKnow.title}</h3>
				<ul>
					{accountDeletionText.success.whatYouNeedToKnow.steps.map((step: string, index: number) => (
						<li key={index}>{step.replace('{gracePeriod}', gracePeriod.toString())}</li>
					))}
				</ul>
			</div>

			<div className={styles.goodbyeMessage}>
				<p>
					{accountDeletionText.success.goodbyeMessage}
				</p>
				<p className={styles.goodbyeNote}>{accountDeletionText.success.goodbyeNote}</p>
			</div>

			<div className={styles.redirectInfo}>
				<Info size={16} />
				<span>{accountDeletionText.success.redirectInfo}</span>
			</div>
		</div>
	);

	return (
		<Dialog isOpen={isOpen} onClose={handleClose}>
			<div className={styles.modalContainer}>
				{step === 'initial' && renderInitialStep()}
				{step === 'reasons' && renderReasonsStep()}
				{step === 'grace-period' && renderGracePeriodStep()}
				{step === 'final-confirm' && renderFinalConfirmStep()}
				{step === 'success' && renderSuccessStep()}
			</div>
		</Dialog>
	);
};

export default AccountDeletionDialog;
