// Status utility functions for consistent display across the app

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'verified':
    case 'confirmed':
    case 'approved':
      return '#22c55e'; // Green - matches web success color
    case 'pending':
    case 'under_review':
      return '#f59e0b'; // Amber - matches web warning color
    case 'rejected':
    case 'disputed':
      return '#ef4444'; // Red - matches web destructive color
    case 'cleared':
      return '#3b82f6'; // Blue - matches web info color
    default: return '#6b7280'; // Gray - matches web muted color
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'verified':
    case 'confirmed':
    case 'approved':
      return 'Verified';
    case 'pending':
      return 'Pending';
    case 'rejected':
      return 'Rejected';
    case 'under_review':
      return 'Review';
    case 'disputed':
      return 'Disputed';
    case 'cleared':
      return 'Cleared';
    default: 
      // Return a shortened version of unknown statuses
      return status.length > 8 ? status.substring(0, 8) + '...' : status;
  }
};

export const getRiskColor = (riskScore: number): string => {
  if (riskScore >= 80) return '#f44336';
  if (riskScore >= 60) return '#ff9800';
  if (riskScore >= 40) return '#ffeb3b';
  return '#4caf50';
};
