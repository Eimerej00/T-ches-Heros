import express from 'express';
import http from 'http';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { FamilyState, FamilyMember, ChoreTask, ChoreSubmission, RewardItem, RewardClaim } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'family-data.json');

const INITIAL_STATE: FamilyState = {
  settings: {
    familyName: 'La Tribu des Héros',
    familyCode: 'TRIBU-42',
    guardianPin: '1234',
    requirePinForValidation: false,
  },
  members: [
    {
      id: 'm-1',
      name: 'Maman',
      role: 'tuteur',
      avatar: '👑',
      color: '#ec4899',
      points: 0,
      totalEarnedPoints: 0,
      level: 1,
      title: 'Gardienne du Foyer',
      createdAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'm-2',
      name: 'Papa',
      role: 'tuteur',
      avatar: '🛡️',
      color: '#3b82f6',
      points: 0,
      totalEarnedPoints: 0,
      level: 1,
      title: 'Protecteur de la Maison',
      createdAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'm-3',
      name: 'Lucas',
      role: 'joueur',
      avatar: '🦊',
      color: '#f97316',
      points: 0,
      totalEarnedPoints: 0,
      level: 1,
      title: 'Novice en Mission 🌱',
      createdAt: '2026-01-02T10:00:00Z',
    },
    {
      id: 'm-4',
      name: 'Chloé',
      role: 'joueur',
      avatar: '🦄',
      color: '#8b5cf6',
      points: 0,
      totalEarnedPoints: 0,
      level: 1,
      title: 'Novice en Mission 🌱',
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
  ],
  rewardClaims: [],
  lastUpdated: Date.now(),
};

// In-memory state with file persistence
let state: FamilyState = { ...INITIAL_STATE };

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.members && parsed.tasks) {
      state = parsed;
    }
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_STATE, null, 2), 'utf-8');
  }
} catch (err) {
  console.warn('Could not read persistent state, using memory fallback:', err);
}

function persistState() {
  state.lastUpdated = Date.now();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Persist failed:', err);
  }
}

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        // Skip over non-IPv4 and internal (e.g. 127.0.0.1)
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      }
    }
  }
  return addresses;
}

function calculateLevel(totalEarned: number): { level: number; title: string } {
  if (totalEarned >= 1000) return { level: 6, title: 'Légende du Domaine 🌟' };
  if (totalEarned >= 600) return { level: 5, title: 'Grand Maître du Propre 👑' };
  if (totalEarned >= 350) return { level: 4, title: 'Chevalier du Rangement 🛡️' };
  if (totalEarned >= 180) return { level: 3, title: 'Écuyer Motivé ⚔️' };
  if (totalEarned >= 70) return { level: 2, title: 'Apprenti Débrouillard 🪄' };
  return { level: 1, title: 'Novice en Mission 🌱' };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // GET State
  app.get('/api/state', (req, res) => {
    res.json(state);
  });

  // GET Network Info for Wifi connect & QR Code
  app.get('/api/network-info', (req, res) => {
    const localIps = getLocalIpAddresses();
    const hostHeader = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol || 'http';
    
    // Public app URL if running in hosted environment
    const appUrl = process.env.APP_URL || `${protocol}://${hostHeader}`;
    
    // Construct local wifi URLs
    const wifiUrls = localIps.map((ip) => `http://${ip}:${PORT}`);

    res.json({
      primaryUrl: appUrl,
      wifiUrls,
      localIps,
      port: PORT,
      familyCode: state.settings.familyCode,
      familyName: state.settings.familyName,
    });
  });

  // POST Dispatch Action
  app.post('/api/action', (req, res) => {
    const { type, payload } = req.body;

    switch (type) {
      case 'SUBMIT_CHORE': {
        const { taskId, memberId, completedDate, completedDateLabel, note } = payload;
        const task = state.tasks.find((t) => t.id === taskId);
        const member = state.members.find((m) => m.id === memberId);
        if (!task || !member) {
          return res.status(400).json({ error: 'Tâche ou membre introuvable' });
        }

        const submission: ChoreSubmission = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          taskId: task.id,
          taskTitle: task.title,
          taskCategory: task.category,
          taskIcon: task.icon,
          points: task.points,
          submittedBy: member.id,
          submittedByName: member.name,
          completedDate: completedDate || new Date().toISOString().split('T')[0],
          completedDateLabel: completedDateLabel || 'Aujourd’hui',
          submittedAt: new Date().toISOString(),
          note: note ? String(note).trim() : undefined,
          status: 'en_attente',
        };

        state.submissions.unshift(submission);
        persistState();
        return res.json({ success: true, submission, state });
      }

      case 'VALIDATE_SUBMISSION': {
        const { submissionId, guardianId } = payload;
        const sub = state.submissions.find((s) => s.id === submissionId);
        const guardian = state.members.find((m) => m.id === guardianId);

        if (!sub) {
          return res.status(404).json({ error: 'Déclaration introuvable' });
        }
        if (!guardian || guardian.role !== 'tuteur') {
          return res.status(403).json({ error: 'Seul un tuteur peut valider une tâche' });
        }
        if (sub.status === 'validee') {
          return res.status(400).json({ error: 'Cette tâche a déjà été validée' });
        }

        sub.status = 'validee';
        sub.validatedBy = guardian.id;
        sub.validatedByName = guardian.name;
        sub.validatedAt = new Date().toISOString();

        // Credit points to the member who performed the task
        const performer = state.members.find((m) => m.id === sub.submittedBy);
        if (performer) {
          performer.points += sub.points;
          performer.totalEarnedPoints += sub.points;
          const { level, title } = calculateLevel(performer.totalEarnedPoints);
          performer.level = level;
          performer.title = title;
        }

        persistState();
        return res.json({ success: true, submission: sub, performer, state });
      }

      case 'REJECT_SUBMISSION': {
        const { submissionId, guardianId, reason } = payload;
        const sub = state.submissions.find((s) => s.id === submissionId);
        const guardian = state.members.find((m) => m.id === guardianId);

        if (!sub) {
          return res.status(404).json({ error: 'Déclaration introuvable' });
        }
        if (!guardian || guardian.role !== 'tuteur') {
          return res.status(403).json({ error: 'Seul un tuteur peut rejeter une tâche' });
        }

        sub.status = 'rejetee';
        sub.validatedBy = guardian.id;
        sub.validatedByName = guardian.name;
        sub.validatedAt = new Date().toISOString();
        sub.rejectionReason = reason || 'À refaire avec plus d’attention';

        persistState();
        return res.json({ success: true, submission: sub, state });
      }

      case 'CREATE_TASK': {
        const { title, description, points, category, targetType, assignedTo, icon, frequency, createdBy } = payload;
        if (!title || !points) {
          return res.status(400).json({ error: 'Titre et points requis' });
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
        persistState();
        return res.json({ success: true, task: newTask, state });
      }

      case 'UPDATE_TASK': {
        const { id, title, description, points, category, targetType, assignedTo, icon, frequency, isActive } = payload;
        const task = state.tasks.find((t) => t.id === id);
        if (!task) {
          return res.status(404).json({ error: 'Tâche introuvable' });
        }

        if (title !== undefined) task.title = title.trim();
        if (description !== undefined) task.description = description.trim();
        if (points !== undefined) task.points = Number(points);
        if (category !== undefined) task.category = category;
        if (targetType !== undefined) task.targetType = targetType;
        if (assignedTo !== undefined) task.assignedTo = assignedTo;
        if (icon !== undefined) task.icon = icon;
        if (frequency !== undefined) task.frequency = frequency;
        if (isActive !== undefined) task.isActive = Boolean(isActive);

        persistState();
        return res.json({ success: true, task, state });
      }

      case 'DELETE_TASK': {
        const { taskId } = payload;
        state.tasks = state.tasks.filter((t) => t.id !== taskId);
        persistState();
        return res.json({ success: true, state });
      }

      case 'ADD_MEMBER': {
        const { name, role, avatar, color } = payload;
        if (!name) {
          return res.status(400).json({ error: 'Nom requis' });
        }

        // Limit guardians to 1 or 2 as specified in prompt
        if (role === 'tuteur') {
          const currentTuteurs = state.members.filter((m) => m.role === 'tuteur');
          if (currentTuteurs.length >= 2) {
            return res.status(400).json({
              error: 'La famille comporte déjà 2 tuteurs au maximum (parents). Vous pouvez modifier un tuteur existant ou ajouter un joueur.',
            });
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
        persistState();
        return res.json({ success: true, member: newMember, state });
      }

      case 'UPDATE_MEMBER': {
        const { id, name, role, avatar, color, points } = payload;
        const member = state.members.find((m) => m.id === id);
        if (!member) {
          return res.status(404).json({ error: 'Membre introuvable' });
        }

        if (name !== undefined) member.name = name.trim();
        if (role !== undefined) {
          // Check guardian limit if changing to tuteur
          if (role === 'tuteur' && member.role !== 'tuteur') {
            const currentTuteurs = state.members.filter((m) => m.role === 'tuteur');
            if (currentTuteurs.length >= 2) {
              return res.status(400).json({ error: 'Maximum 2 tuteurs autorisés.' });
            }
          }
          member.role = role;
        }
        if (avatar !== undefined) member.avatar = avatar;
        if (color !== undefined) member.color = color;
        if (points !== undefined) {
          member.points = Number(points);
        }

        persistState();
        return res.json({ success: true, member, state });
      }

      case 'DELETE_MEMBER': {
        const { memberId } = payload;
        // Don't delete if it's the last guardian
        const member = state.members.find((m) => m.id === memberId);
        if (member && member.role === 'tuteur') {
          const guardiansCount = state.members.filter((m) => m.role === 'tuteur').length;
          if (guardiansCount <= 1) {
            return res.status(400).json({ error: 'Il faut conserver au moins 1 tuteur dans la famille.' });
          }
        }

        state.members = state.members.filter((m) => m.id !== memberId);
        // Also remove member from personal assignments
        state.tasks.forEach((t) => {
          t.assignedTo = t.assignedTo.filter((id) => id !== memberId);
        });
        persistState();
        return res.json({ success: true, state });
      }

      case 'CLAIM_REWARD': {
        const { rewardId, memberId } = payload;
        const reward = state.rewards.find((r) => r.id === rewardId);
        const member = state.members.find((m) => m.id === memberId);

        if (!reward || !member) {
          return res.status(400).json({ error: 'Récompense ou membre invalide' });
        }

        if (member.points < reward.cost) {
          return res.status(400).json({
            error: `Points insuffisants. Il vous manque ${reward.cost - member.points} points.`,
          });
        }

        // Deduct points immediately
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
        persistState();
        return res.json({ success: true, claim, member, state });
      }

      case 'CREATE_REWARD': {
        const { title, description, cost, icon, category } = payload;
        if (!title || cost === undefined || cost === null) {
          return res.status(400).json({ error: 'Titre et coût en points requis' });
        }

        const validCost = Math.max(0, Math.min(1000, Number(cost) || 0));

        const newReward: RewardItem = {
          id: `rew-${Date.now()}`,
          title: title.trim(),
          description: description?.trim() || '',
          cost: validCost,
          icon: icon || '🎁',
          category: category || 'bonus',
          timesClaimed: 0,
        };

        state.rewards.push(newReward);
        persistState();
        return res.json({ success: true, reward: newReward, state });
      }

      case 'UPDATE_REWARD': {
        const { id, title, description, cost, icon, category, timesClaimed } = payload;
        const reward = state.rewards.find((r) => r.id === id);
        if (!reward) {
          return res.status(404).json({ error: 'Récompense introuvable' });
        }

        if (title !== undefined) reward.title = title.trim();
        if (description !== undefined) reward.description = description.trim();
        if (cost !== undefined) reward.cost = Math.max(0, Math.min(1000, Number(cost) || 0));
        if (icon !== undefined) reward.icon = icon;
        if (category !== undefined) reward.category = category;
        if (timesClaimed !== undefined) reward.timesClaimed = Number(timesClaimed) || 0;

        persistState();
        return res.json({ success: true, reward, state });
      }

      case 'DELETE_REWARD': {
        const { rewardId } = payload;
        state.rewards = state.rewards.filter((r) => r.id !== rewardId);
        persistState();
        return res.json({ success: true, state });
      }

      case 'RESET_HISTORY_AND_REWARDS': {
        state.submissions = [];
        state.rewards.forEach((r) => {
          r.timesClaimed = 0;
        });
        state.rewardClaims = [];
        persistState();
        return res.json({ success: true, state });
      }

      case 'CLEAR_HISTORY': {
        state.submissions = state.submissions.filter((s) => s.status === 'en_attente');
        persistState();
        return res.json({ success: true, state });
      }

      case 'UPDATE_SETTINGS': {
        const { familyName, familyCode, guardianPin, requirePinForValidation } = payload;
        if (familyName) state.settings.familyName = familyName.trim();
        if (familyCode) state.settings.familyCode = familyCode.trim().toUpperCase();
        if (guardianPin !== undefined) state.settings.guardianPin = String(guardianPin).trim();
        if (requirePinForValidation !== undefined) {
          state.settings.requirePinForValidation = Boolean(requirePinForValidation);
        }

        persistState();
        return res.json({ success: true, settings: state.settings, state });
      }

      case 'RESET_POINTS': {
        state.members.forEach((m) => {
          m.points = 0;
          m.totalEarnedPoints = 0;
          const { level, title } = calculateLevel(0);
          m.level = level;
          m.title = title;
        });
        persistState();
        return res.json({ success: true, state });
      }

      case 'RESET_DEMO': {
        state = JSON.parse(JSON.stringify(INITIAL_STATE));
        persistState();
        return res.json({ success: true, state });
      }

      default:
        return res.status(400).json({ error: `Type d'action inconnu: ${type}` });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Dev server with Vite middleware vs Production static
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    const localIps = getLocalIpAddresses();
    console.log(`✨ Serveur Tâches & Héros démarré sur le port ${PORT}`);
    console.log(`📱 Accès local: http://localhost:${PORT}`);
    localIps.forEach((ip) => {
      console.log(`📡 Accès Wifi / Téléphones: http://${ip}:${PORT}`);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
