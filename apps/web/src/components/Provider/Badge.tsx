interface VerificationBadgeProps {
  tier: number;
}

export default function VerificationBadge({ tier }: VerificationBadgeProps) {
  let label = '';
  let color = '';

  switch (tier) {
    case 1:
      label = 'Tier 1: Professional';
      color = 'bg-blue-100 text-blue-800';
      break;
    case 2:
      label = 'Tier 2: Identity Verified';
      color = 'bg-green-100 text-green-800';
      break;
    case 3:
      label = 'Tier 3: Practice Verified';
      color = 'bg-purple-100 text-purple-800';
      break;
    default:
      return null;
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}
