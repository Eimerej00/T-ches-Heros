/**
 * Date formatting utilities for Tâches & Héros
 * Dynamically computes relative date labels ("Aujourd'hui", "Hier", or exact date)
 * based on current date so labels never get stale.
 */

export function formatRelativeCompletedDate(
  completedDate?: string,
  completedDateLabel?: string,
  submittedAt?: string
): string {
  // Determine date string to use (YYYY-MM-DD or ISO timestamp)
  let dateStr = completedDate;
  if (!dateStr && submittedAt) {
    dateStr = submittedAt.split('T')[0];
  }

  // If we have YYYY-MM-DD
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetMidnight = new Date(y, m - 1, d);

    // Difference in whole calendar days (positive if in past)
    const diffTime = today.getTime() - targetMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const dateFormatted = targetDate.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    if (diffDays === 0) {
      return `Aujourd’hui (${dateFormatted})`;
    } else if (diffDays === 1) {
      return `Hier (${dateFormatted})`;
    } else if (diffDays === -1) {
      return `Demain (${dateFormatted})`;
    } else {
      const yearSuffix = targetDate.getFullYear() !== now.getFullYear() ? ` ${targetDate.getFullYear()}` : '';
      return `${dateFormatted}${yearSuffix}`;
    }
  }

  // If dateStr is an ISO string or timestamp
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetMidnight = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      const diffDays = Math.round((today.getTime() - targetMidnight.getTime()) / (1000 * 60 * 60 * 24));

      const dateFormatted = parsed.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

      if (diffDays === 0) return `Aujourd’hui (${dateFormatted})`;
      if (diffDays === 1) return `Hier (${dateFormatted})`;
      return dateFormatted;
    }
  }

  // If only completedDateLabel is present, clean any stale "Aujourd'hui" or "Hier" prefix
  if (completedDateLabel) {
    const match = completedDateLabel.match(/\((.+)\)/);
    if (match) {
      return match[1];
    }
    return completedDateLabel;
  }

  return 'Date inconnue';
}
