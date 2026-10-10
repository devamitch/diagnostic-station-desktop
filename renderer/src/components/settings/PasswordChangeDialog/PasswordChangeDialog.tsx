'use client';

import React, { useState } from 'react';
import Dialog from '@/components/layout/Modal/Dialog';
import { changePassword } from '@/lib/server/auth';
import useAppStore from '@/store';
import useTranslationData from '@/hooks/use-translation-data';
import styles from './PasswordChangeDialog.module.css';
import { PasswordInput } from '@/components/base/inputs';

interface PasswordChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, token } = useAppStore((state) => state.auth);
  const { settingsPageText } = useTranslationData();

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email || !token) {
      console.log('Authentication error. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(
        {
          email: user.email,
          oldpassword: formData.oldPassword,
          newpassword: formData.newPassword,
        },
        token
      );

      console.log('Password changed successfully');
      handleClose();
    } catch (error: any) {
      console.log('Password change error:', error);
      
      if (error.response?.data?.message) {
        console.log(error.response.data.message);
      } else if (error.message) {
        console.log(error.message);
      } else {
        console.log('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <div className={styles.container}>
        <h2 className={styles.title}>
          {settingsPageText.accountSettings.changePassword}
        </h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <PasswordInput
            id="oldPassword"
            name="oldPassword"
            label={settingsPageText.accountSettings.passwordDialog.currentPassword}
            value={formData.oldPassword}
            onChange={(value) => handleInputChange('oldPassword', value)}
            error={errors.oldPassword}
            disabled={isLoading}
            required
            showStrength={false}
            autoComplete="current-password"
          />

          <PasswordInput
            id="newPassword"
            name="newPassword"
            label={settingsPageText.accountSettings.passwordDialog.newPassword}
            value={formData.newPassword}
            onChange={(value) => handleInputChange('newPassword', value)}
            error={errors.newPassword}
            disabled={isLoading}
            required
            showStrength={true}
            autoComplete="new-password"
          />

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label={settingsPageText.accountSettings.passwordDialog.confirmPassword}
            value={formData.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            error={errors.confirmPassword}
            disabled={isLoading}
            required
            showStrength={false}
            autoComplete="new-password"
          />

          <div className={styles.buttonGroup}>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? settingsPageText.accountSettings.passwordDialog.changingText : settingsPageText.accountSettings.passwordDialog.changePasswordButton}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              {settingsPageText.accountSettings.passwordDialog.cancelButton}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};

export default PasswordChangeDialog;