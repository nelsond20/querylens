import { Injectable, signal } from '@angular/core';

const CONSENT_STORAGE_KEY = 'querylens:privacy-consent';

@Injectable({ providedIn: 'root' })
export class PrivacyConsentService {
  readonly consentAccepted = signal(false);

  constructor() {
    const accepted = localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted';
    this.consentAccepted.set(accepted);
  }

  acceptConsent(): void {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    this.consentAccepted.set(true);
  }
}
