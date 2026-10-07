import type { FamilyMember, FamilyState, ChoreSubmission } from '../types.ts';

export type BadgeTier = 'bronze' | 'argent' | 'or' | 'diamant';

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  category: string;
}

export interface MemberBadgeProgress {
  badge: BadgeItem;
  unlocked: boolean;
  progress: number;
  max: number;
  percentage: number;
}

export const ALL_BADGES: BadgeItem[] = [
  {
    id: 'premiere_corvee',
    title: 'Première Victoire',
    description: 'Accomplir et faire valider sa 1ère mission',
    icon: '🌱',
    tier: 'bronze',
    category: 'Général',
  },
  {
    id: 'apprenti_5',
    title: 'Apprenti Courageux',
    description: 'Valider 5 missions au total',
    icon: '🧹',
    tier: 'bronze',
    category: 'Général',
  },
  {
    id: 'dix_corvees',
    title: '10 Missions Terminées',
    description: 'Atteindre le cap de 10 missions accomplies et validées',
    icon: '⭐',
    tier: 'argent',
    category: 'Général',
  },
  {
    id: 'maitre_du_rangement',
    title: 'Maître du Rangement',
    description: 'Réaliser 5 missions de chambre ou de ménage',
    icon: '🛏️',
    tier: 'or',
    category: 'Rangement',
  },
  {
    id: 'as_cuisine',
    title: 'As de la Cuisine',
    description: 'Réaliser 5 missions en cuisine (table, vaisselle...)',
    icon: '🍽️',
    tier: 'argent',
    category: 'Cuisine',
  },
  {
    id: 'ami_animaux',
    title: 'Ami des Animaux',
    description: 'Prendre soin des animaux 3 fois',
    icon: '🐱',
    tier: 'argent',
    category: 'Animaux',
  },
  {
    id: 'as_devoirs',
    title: 'Champion des Devoirs',
    description: 'Faire ses devoirs sans râler 3 fois',
    icon: '📚',
    tier: 'argent',
    category: 'École',
  },
  {
    id: 'touche_a_tout',
    title: 'Touche-à-Tout',
    description: 'Réaliser des missions dans au moins 3 catégories différentes',
    icon: '🌈',
    tier: 'or',
    category: 'Polyvalence',
  },
  {
    id: 'club_100',
    title: 'Centurion (100 Pts)',
    description: 'Cumuler 100 points au total',
    icon: '💯',
    tier: 'argent',
    category: 'Score',
  },
  {
    id: 'heros_300',
    title: 'Héros Épique (300 Pts)',
    description: 'Cumuler 300 points au total',
    icon: '🔥',
    tier: 'or',
    category: 'Score',
  },
  {
    id: 'legende_500',
    title: 'Légende Vivante (500 Pts)',
    description: 'Cumuler 500 points au total',
    icon: '👑',
    tier: 'diamant',
    category: 'Score',
  },
  {
    id: 'troc_gagnant',
    title: 'Premier Troc',
    description: 'Débloquer son tout premier cadeau dans la boutique',
    icon: '🎁',
    tier: 'bronze',
    category: 'Récompense',
  },
];

export function getMemberBadgeProgress(member: FamilyMember, state: FamilyState): MemberBadgeProgress[] {
  const memberSubmissions = state.submissions.filter(
    (s) => s.submittedBy === member.id && s.status === 'validee'
  );

  const totalValidated = memberSubmissions.length;

  const storageChores = memberSubmissions.filter(
    (s) => s.taskCategory === 'chambre' || s.taskCategory === 'menage'
  ).length;

  const kitchenChores = memberSubmissions.filter(
    (s) => s.taskCategory === 'cuisine'
  ).length;

  const petChores = memberSubmissions.filter(
    (s) => s.taskCategory === 'animaux'
  ).length;

  const schoolChores = memberSubmissions.filter(
    (s) => s.taskCategory === 'ecole'
  ).length;

  const distinctCategories = new Set(memberSubmissions.map((s) => s.taskCategory)).size;

  const memberClaims = (state.rewardClaims || []).filter(
    (c) => c.claimedBy === member.id
  ).length;

  const totalEarned = member.totalEarnedPoints || 0;

  return ALL_BADGES.map((badge) => {
    let progress = 0;
    let max = 1;

    switch (badge.id) {
      case 'premiere_corvee':
        progress = totalValidated;
        max = 1;
        break;
      case 'apprenti_5':
        progress = totalValidated;
        max = 5;
        break;
      case 'dix_corvees':
        progress = totalValidated;
        max = 10;
        break;
      case 'maitre_du_rangement':
        progress = storageChores;
        max = 5;
        break;
      case 'as_cuisine':
        progress = kitchenChores;
        max = 5;
        break;
      case 'ami_animaux':
        progress = petChores;
        max = 3;
        break;
      case 'as_devoirs':
        progress = schoolChores;
        max = 3;
        break;
      case 'touche_a_tout':
        progress = distinctCategories;
        max = 3;
        break;
      case 'club_100':
        progress = totalEarned;
        max = 100;
        break;
      case 'heros_300':
        progress = totalEarned;
        max = 300;
        break;
      case 'legende_500':
        progress = totalEarned;
        max = 500;
        break;
      case 'troc_gagnant':
        progress = memberClaims;
        max = 1;
        break;
    }

    const clamped = Math.min(progress, max);
    const unlocked = progress >= max;
    const percentage = Math.round((clamped / max) * 100);

    return {
      badge,
      unlocked,
      progress,
      max,
      percentage,
    };
  });
}
