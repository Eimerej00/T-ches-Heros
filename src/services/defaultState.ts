import type { FamilyState, FamilyMember, ChoreTask, ChoreSubmission, RewardItem, RewardClaim } from '../types.ts';

export function calculateLevel(totalEarned: number): { level: number; title: string } {
  if (totalEarned >= 1000) return { level: 8, title: 'Légende Familiale 👑' };
  if (totalEarned >= 700) return { level: 7, title: 'Grand Maître du Logis 🏆' };
  if (totalEarned >= 500) return { level: 6, title: 'Champion de la Maison 🥇' };
  if (totalEarned >= 350) return { level: 5, title: 'Héros Domestique ⭐' };
  if (totalEarned >= 250) return { level: 4, title: 'Chevalier du Foyer 🛡️' };
  if (totalEarned >= 180) return { level: 3, title: 'Écuyer Motivé ⚔️' };
  if (totalEarned >= 70) return { level: 2, title: 'Apprenti Débrouillard 🪄' };
  return { level: 1, title: 'Novice en Mission 🌱' };
}

export const INITIAL_STATE: FamilyState = {
  settings: {
    familyName: 'La Tribu des Héros',
    familyCode: 'TRIBU-42',
    guardianPin: '1805',
    requirePinForValidation: true,
  },
  members: [
    {
      id: 'm-1',
      name: 'Maman',
      role: 'tuteur',
      avatar: '👑',
      color: '#8b5cf6',
      points: 80,
      totalEarnedPoints: 80,
      level: 2,
      title: 'Apprenti Débrouillard 🪄',
      createdAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'm-2',
      name: 'Papa',
      role: 'tuteur',
      avatar: '🛡️',
      color: '#06b6d4',
      points: 0,
      totalEarnedPoints: 0,
      level: 1,
      title: 'Protecteur de la Maison',
      createdAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'm-3',
      name: 'Philéas',
      role: 'joueur',
      avatar: '🚀',
      color: '#10b981',
      points: 60,
      totalEarnedPoints: 70,
      level: 2,
      title: 'Apprenti Débrouillard 🪄',
      createdAt: '2026-01-02T10:00:00Z',
    },
    {
      id: 'm-4',
      name: 'Giliane',
      role: 'joueur',
      avatar: '🌸',
      color: '#ec4899',
      points: 75,
      totalEarnedPoints: 75,
      level: 2,
      title: 'Apprenti Débrouillard 🪄',
      createdAt: '2026-01-02T10:00:00Z',
    },
  ],
  tasks: [
    {
      id: 't-1',
      title: 'Mettre le couvert pour le dîner',
      description: 'Disposer assiettes, verres, couverts et serviettes avant le repas.',
      points: 15,
      category: 'cuisine',
      targetType: 'general',
      assignedTo: [],
      icon: '🍽️',
      frequency: 'quotidien',
      createdBy: 'm-1',
      createdAt: '2026-01-03T10:00:00Z',
      isActive: true,
    },
    {
      id: 't-2',
      title: 'Débarrasser et vider le lave-vaisselle',
      description: 'Ranger la vaisselle propre dans les placards et tiroirs.',
      points: 25,
      category: 'cuisine',
      targetType: 'general',
      assignedTo: [],
      icon: '🫧',
      frequency: 'quotidien',
      createdBy: 'm-1',
      createdAt: '2026-01-03T10:00:00Z',
      isActive: true,
    },
    {
      id: 't-3',
      title: 'Ranger sa chambre à fond',
      description: 'Faire son lit, ranger les jouets et dégager le sol.',
      points: 30,
      category: 'chambre',
      targetType: 'personnel',
      assignedTo: ['m-3', 'm-4'],
      icon: '🛏️',
      frequency: 'hebdo',
      createdBy: 'm-2',
      createdAt: '2026-01-03T10:00:00Z',
      isActive: true,
    },
    {
      id: 't-4',
      title: 'Nourrir et brosser le chat',
      description: 'Lui donner ses croquettes fraîches et de l’eau propre.',
      points: 20,
      category: 'animaux',
      targetType: 'personnel',
      assignedTo: ['m-4'],
      icon: '🐱',
      frequency: 'quotidien',
      createdBy: 'm-1',
      createdAt: '2026-01-03T10:00:00Z',
      isActive: true,
    },
    {
      id: 't-5',
      title: 'Sortir les poubelles et le recyclage',
      description: 'Sortir les bacs jaune et noir sur le trottoir.',
      points: 25,
      category: 'menage',
      targetType: 'general',
      assignedTo: [],
      icon: '🗑️',
      frequency: 'hebdo',
      createdBy: 'm-2',
      createdAt: '2026-01-03T10:00:00Z',
      isActive: true,
    },
    {
      id: 't-6',
      title: 'Faire ses devoirs sans râler',
      description: 'Finir les leçons et préparer le cartable pour le lendemain.',
      points: 35,
      category: 'ecole',
      targetType: 'personnel',
      assignedTo: ['m-3', 'm-4'],
      icon: '📚',
      frequency: 'quotidien',
      createdBy: 'm-1',
      createdAt: '2026-01-03T10:00:00Z',
      isActive: true,
    },
    {
      id: 't-7',
      title: 'Passer l’aspirateur dans le salon',
      description: 'Un passage propre sous la table et autour du canapé.',
      points: 40,
      category: 'menage',
      targetType: 'general',
      assignedTo: [],
      icon: '🧹',
      frequency: 'hebdo',
      createdBy: 'm-2',
      createdAt: '2026-01-03T10:00:00Z',
      isActive: true,
    },
  ],
  submissions: [],
  rewards: [
    {
      id: 'rew-1',
      title: '30 minutes d’écran ou jeu vidéo bonus',
      description: 'Valable le week-end ou mercredi après-midi.',
      cost: 50,
      icon: '🎮',
      category: 'divertissement',
      timesClaimed: 0,
    },
    {
      id: 'rew-2',
      title: 'Choisir le menu du samedi soir',
      description: 'Pizzas maison, crêpes party ou burgers !',
      cost: 70,
      icon: '🍕',
      category: 'nourriture',
      timesClaimed: 0,
    },
    {
      id: 'rew-3',
      title: 'Veillée film en famille avec pop-corn',
      description: 'Choix du film au coin du canapé.',
      cost: 100,
      icon: '🎬',
      category: 'famille',
      timesClaimed: 0,
    },
    {
      id: 'rew-4',
      title: 'Coucher décalé de 45 minutes',
      description: 'Pour lire ou discuter tranquillement avant de dormir.',
      cost: 40,
      icon: '🌙',
      category: 'privilege',
      timesClaimed: 0,
    },
    {
      id: 'rew-5',
      title: 'Sortie au parc ou activité de son choix',
      description: 'Une après-midi vélo, rollers ou skatepark.',
      cost: 120,
      icon: '🛹',
      category: 'sortie',
      timesClaimed: 0,
    },
    {
      id: 'rew-coop',
      title: 'Champion de la Coopération (Activité duo)',
      description: 'Activité spéciale ou jeu partagé en équipe avec son complice de mission !',
      cost: 80,
      icon: '🤝',
      category: 'famille',
      timesClaimed: 0,
    },
  ],
  rewardClaims: [],
  lastUpdated: Date.now(),
};

export function applyLocalAction(
  currentState: FamilyState,
  type: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): { success: boolean; state: FamilyState; error?: string } {
  const state: FamilyState = JSON.parse(JSON.stringify(currentState));

  switch (type) {
    case 'SUBMIT_CHORE': {
      const { taskId, memberId, participantIds, completedDate, completedDateLabel, note, submissionId } = payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) {
        return { success: false, state, error: 'Tâche introuvable' };
      }

      // Determine participants list (support multi-participant Coop)
      const pIds: string[] = Array.isArray(participantIds) && participantIds.length > 0
        ? participantIds
        : (memberId ? [memberId] : []);

      if (pIds.length === 0) {
        return { success: false, state, error: 'Veuillez sélectionner au moins un participant' };
      }

      const participantMembers = pIds
        .map((id) => state.members.find((m) => m.id === id))
        .filter(Boolean) as FamilyMember[];

      if (participantMembers.length === 0) {
        return { success: false, state, error: 'Participant(s) introuvable(s)' };
      }

      const isCoop = participantMembers.length > 1;
      const pointsPerParticipant = isCoop
        ? Math.ceil(task.points / participantMembers.length)
        : task.points;

      const participantNames = participantMembers.map((m) => m.name);
      const primaryMember = participantMembers[0];

      const submission: ChoreSubmission = {
        id: submissionId || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        taskId: task.id,
        taskTitle: task.title,
        taskIcon: task.icon,
        taskCategory: task.category,
        points: task.points,
        isCoop,
        participantIds: participantMembers.map((m) => m.id),
        participantNames,
        pointsPerParticipant,
        submittedBy: primaryMember.id,
        submittedByName: isCoop ? participantNames.join(' & ') : primaryMember.name,
        completedDate: completedDate || new Date().toISOString().split('T')[0],
        completedDateLabel: completedDateLabel || 'Aujourd’hui',
        submittedAt: new Date().toISOString(),
        note: note ? note.trim() : '',
        status: 'en_attente',
      };

      state.submissions.unshift(submission);
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'VALIDATE_SUBMISSION': {
      const { submissionId, guardianId } = payload;
      const sub = state.submissions.find((s) => s.id === submissionId);
      const guardian = state.members.find((m) => m.id === guardianId);

      if (!sub) return { success: false, state, error: 'Déclaration introuvable' };
      if (!guardian || guardian.role !== 'tuteur') {
        return { success: false, state, error: 'Seul un tuteur peut valider une tâche' };
      }
      if (sub.status === 'validee') {
        return { success: false, state, error: 'Cette tâche a déjà été validée' };
      }

      sub.status = 'validee';
      sub.validatedBy = guardian.id;
      sub.validatedByName = guardian.name;
      sub.validatedAt = new Date().toISOString();

      // Participants to credit (single or coop)
      const participantIds: string[] = (sub.participantIds && sub.participantIds.length > 0)
        ? sub.participantIds
        : [sub.submittedBy];

      const pointsEach = sub.pointsPerParticipant || Math.ceil(sub.points / participantIds.length);

      participantIds.forEach((pId) => {
        const performer = state.members.find((m) => m.id === pId);
        if (performer) {
          performer.points += pointsEach;
          performer.totalEarnedPoints += pointsEach;
          const { level, title } = calculateLevel(performer.totalEarnedPoints);
          performer.level = level;
          performer.title = title;
        }
      });

      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'REJECT_SUBMISSION': {
      const { submissionId, guardianId, reason } = payload;
      const sub = state.submissions.find((s) => s.id === submissionId);
      const guardian = state.members.find((m) => m.id === guardianId);

      if (!sub) return { success: false, state, error: 'Déclaration introuvable' };
      if (!guardian || guardian.role !== 'tuteur') {
        return { success: false, state, error: 'Seul un tuteur peut rejeter une tâche' };
      }

      sub.status = 'rejetee';
      sub.validatedBy = guardian.id;
      sub.validatedByName = guardian.name;
      sub.validatedAt = new Date().toISOString();
      sub.rejectionReason = reason || 'À refaire avec plus d’attention';

      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'CREATE_TASK': {
      const { title, description, points, category, targetType, assignedTo, icon, frequency, createdBy } = payload;
      if (!title || !points) {
        return { success: false, state, error: 'Titre et points requis' };
      }

      const newTask: ChoreTask = {
        id: `t-${Date.now()}`,
        title: title.trim(),
        description: description?.trim() || '',
        points: Number(points) || 10,
        category: category || 'quotidien',
        targetType: targetType === 'personnel' ? 'personnel' : 'general',
        assignedTo: Array.isArray(assignedTo) ? assignedTo : [],
        icon: icon || '⭐',
        frequency: frequency || 'libre',
        createdBy: createdBy || 'tuteur',
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      state.tasks.push(newTask);
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'UPDATE_TASK': {
      const { id, title, description, points, category, targetType, assignedTo, icon, frequency, isActive } = payload;
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return { success: false, state, error: 'Tâche introuvable' };

      if (title !== undefined) task.title = title.trim();
      if (description !== undefined) task.description = description.trim();
      if (points !== undefined) task.points = Number(points);
      if (category !== undefined) task.category = category;
      if (targetType !== undefined) task.targetType = targetType;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
      if (icon !== undefined) task.icon = icon;
      if (frequency !== undefined) task.frequency = frequency;
      if (isActive !== undefined) task.isActive = Boolean(isActive);

      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'DELETE_TASK': {
      const { taskId } = payload;
      state.tasks = state.tasks.filter((t) => t.id !== taskId);
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'ADD_MEMBER': {
      const { name, role, avatar, color } = payload;
      if (!name) return { success: false, state, error: 'Nom requis' };

      if (role === 'tuteur') {
        const currentTuteurs = state.members.filter((m) => m.role === 'tuteur');
        if (currentTuteurs.length >= 2) {
          return { success: false, state, error: 'Maximum 2 tuteurs autorisés.' };
        }
      }

      const newMember: FamilyMember = {
        id: `m-${Date.now()}`,
        name: name.trim(),
        role: role === 'tuteur' ? 'tuteur' : 'joueur',
        avatar: avatar || (role === 'tuteur' ? '👑' : '⭐'),
        color: color || '#6366f1',
        points: 0,
        totalEarnedPoints: 0,
        level: 1,
        title: role === 'tuteur' ? 'Tuteur Bienveillant' : 'Novice en Mission 🌱',
        createdAt: new Date().toISOString(),
      };

      state.members.push(newMember);
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'UPDATE_MEMBER': {
      const { id, name, role, avatar, color, points } = payload;
      const member = state.members.find((m) => m.id === id);
      if (!member) return { success: false, state, error: 'Membre introuvable' };

      if (name !== undefined) member.name = name.trim();
      if (role !== undefined) member.role = role;
      if (avatar !== undefined) member.avatar = avatar;
      if (color !== undefined) member.color = color;
      if (points !== undefined) member.points = Number(points);

      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'DELETE_MEMBER': {
      const { memberId } = payload;
      state.members = state.members.filter((m) => m.id !== memberId);
      state.tasks.forEach((t) => {
        t.assignedTo = t.assignedTo.filter((id) => id !== memberId);
      });
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'CLAIM_REWARD': {
      const { rewardId, memberId } = payload;
      const reward = state.rewards.find((r) => r.id === rewardId);
      const member = state.members.find((m) => m.id === memberId);

      if (!reward || !member) return { success: false, state, error: 'Récompense ou membre invalide' };
      if (member.points < reward.cost) {
        return { success: false, state, error: `Points insuffisants (${member.points}/${reward.cost})` };
      }

      member.points -= reward.cost;
      reward.timesClaimed += 1;

      const claim: RewardClaim = {
        id: `claim-${Date.now()}`,
        rewardId: reward.id,
        rewardTitle: reward.title,
        rewardIcon: reward.icon,
        cost: reward.cost,
        claimedBy: member.id,
        claimedByName: member.name,
        claimedAt: new Date().toISOString(),
        status: 'accorde',
      };

      state.rewardClaims.unshift(claim);
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'CREATE_REWARD': {
      const { title, description, cost, icon, category } = payload;
      if (!title) return { success: false, state, error: 'Titre requis' };

      const newReward: RewardItem = {
        id: `rew-${Date.now()}`,
        title: title.trim(),
        description: description?.trim() || '',
        cost: Math.max(0, Math.min(1000, Number(cost) || 0)),
        icon: icon || '🎁',
        category: category || 'bonus',
        timesClaimed: 0,
      };

      state.rewards.push(newReward);
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'UPDATE_REWARD': {
      const { id, title, description, cost, icon, category, timesClaimed } = payload;
      const reward = state.rewards.find((r) => r.id === id);
      if (!reward) return { success: false, state, error: 'Récompense introuvable' };

      if (title !== undefined) reward.title = title.trim();
      if (description !== undefined) reward.description = description.trim();
      if (cost !== undefined) reward.cost = Math.max(0, Math.min(1000, Number(cost) || 0));
      if (icon !== undefined) reward.icon = icon;
      if (category !== undefined) reward.category = category;
      if (timesClaimed !== undefined) reward.timesClaimed = Number(timesClaimed) || 0;

      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'DELETE_REWARD': {
      const { rewardId } = payload;
      state.rewards = state.rewards.filter((r) => r.id !== rewardId);
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'RESET_HISTORY_AND_REWARDS': {
      state.submissions = [];
      state.rewards.forEach((r) => {
        r.timesClaimed = 0;
      });
      state.rewardClaims = [];
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'CLEAR_HISTORY': {
      state.submissions = state.submissions.filter((s) => s.status === 'en_attente');
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'UPDATE_SETTINGS': {
      const { familyName, familyCode, guardianPin, requirePinForValidation } = payload;
      if (familyName) state.settings.familyName = familyName.trim();
      if (familyCode) state.settings.familyCode = familyCode.trim().toUpperCase();
      if (guardianPin !== undefined) state.settings.guardianPin = String(guardianPin).trim();
      if (requirePinForValidation !== undefined) {
        state.settings.requirePinForValidation = Boolean(requirePinForValidation);
      }
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'RESET_POINTS': {
      state.members.forEach((m) => {
        m.points = 0;
        m.totalEarnedPoints = 0;
        const { level, title } = calculateLevel(0);
        m.level = level;
        m.title = title;
      });
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    case 'RESET_DEMO': {
      return { success: true, state: JSON.parse(JSON.stringify(INITIAL_STATE)) };
    }

    case 'APPLY_BONUS_MALUS': {
      const { memberId, points, isBonus, reason, guardianId, guardianName } = payload;
      const member = state.members.find((m) => m.id === memberId);
      if (!member) return { success: false, state, error: 'Joueur introuvable' };

      const amount = Math.abs(Number(points) || 0);
      if (amount <= 0) {
        return { success: false, state, error: 'Le nombre de points doit être supérieur à 0' };
      }

      const guardian = state.members.find((m) => m.id === guardianId);
      const effectiveGuardianName = guardian?.name || guardianName || 'Tuteur';

      if (isBonus) {
        member.points += amount;
        member.totalEarnedPoints += amount;
        const { level, title } = calculateLevel(member.totalEarnedPoints);
        member.level = level;
        member.title = title;
      } else {
        member.points = Math.max(0, member.points - amount);
      }

      const historyEntry: ChoreSubmission = {
        id: `sub-bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        taskId: isBonus ? 'bonus' : 'malus',
        taskTitle: isBonus ? `Bonus : ${reason || 'Points bonus'}` : `Malus : ${reason || 'Retrait de points'}`,
        taskIcon: isBonus ? '⭐' : '⚠️',
        taskCategory: isBonus ? 'bonus' : 'malus',
        points: isBonus ? amount : -amount,
        submittedBy: member.id,
        submittedByName: member.name,
        completedDate: new Date().toISOString().split('T')[0],
        completedDateLabel: 'Aujourd’hui',
        submittedAt: new Date().toISOString(),
        status: 'validee',
        validatedBy: guardianId,
        validatedByName: effectiveGuardianName,
        validatedAt: new Date().toISOString(),
        note: reason ? reason.trim() : (isBonus ? 'Bonus accordé par le tuteur' : 'Malus appliqué par le tuteur'),
      };

      state.submissions.unshift(historyEntry);
      state.lastUpdated = Date.now();
      return { success: true, state };
    }

    default:
      return { success: false, state, error: 'Action inconnue' };
  }
}
