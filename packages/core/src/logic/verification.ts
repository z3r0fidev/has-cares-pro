export enum VerificationStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum VerificationTier {
  PROFESSIONAL = 1,
  IDENTITY = 2,
  PRACTICE = 3,
}

export class VerificationStateMachine {
  static transition(currentStatus: VerificationStatus, action: 'approve' | 'reject' | 'review'): VerificationStatus {
    switch (action) {
      case 'approve':
        return VerificationStatus.APPROVED;
      case 'reject':
        return VerificationStatus.REJECTED;
      case 'review':
        return VerificationStatus.IN_REVIEW;
      default:
        return currentStatus;
    }
  }

  static nextTier(currentTier: VerificationTier): VerificationTier | null {
    if (currentTier === VerificationTier.PRACTICE) return null;
    return currentTier + 1;
  }
}
