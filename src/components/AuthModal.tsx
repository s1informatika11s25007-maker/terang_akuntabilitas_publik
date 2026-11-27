import React from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = () => {
  // Modal popups disabled as requested by user - authentication handled natively on page
  return null;
};
