import { VerificationStateMachine, VerificationStatus, VerificationTier } from '../verification';

describe('VerificationStateMachine', () => {
  it('should transition to APPROVED from SUBMITTED', () => {
    const nextState = VerificationStateMachine.transition(
      VerificationStatus.SUBMITTED,
      'approve'
    );
    expect(nextState).toBe(VerificationStatus.APPROVED);
  });

  it('should transition to REJECTED from SUBMITTED', () => {
    const nextState = VerificationStateMachine.transition(
      VerificationStatus.SUBMITTED,
      'reject'
    );
    expect(nextState).toBe(VerificationStatus.REJECTED);
  });

  it('should calculate next tier correctly', () => {
    expect(VerificationStateMachine.nextTier(VerificationTier.PROFESSIONAL)).toBe(VerificationTier.IDENTITY);
  });
});
