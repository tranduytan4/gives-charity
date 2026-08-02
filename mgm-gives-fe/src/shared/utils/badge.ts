/**
 * Tailwind class names for campaign status badges.
 */
export const getStatusClassName = (status: string): string => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'PENDING':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'APPROVED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'IN_PROGRESS':
    case 'ACTIVE':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'COMPLETED':
    case 'CLOSED':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

/**
 * Tailwind class names for campaign priority badges.
 */
export const getPriorityClassName = (priority: string): string => {
  switch (priority) {
    case 'HIGH':
    case 'URGENT':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};
