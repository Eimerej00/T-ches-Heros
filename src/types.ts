export type Role = 'tuteur' | 'joueur';

export interface FamilyMember {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  color: string;
  points: number;
  totalEarnedPoints: number;
  level: number;
  title: string;
  createdAt: string;
}

export type TaskCategory = 'cuisine' | 'chambre' | 'animaux' | 'menage' | 'ecole' | 'quotidien' | 'jardin';

export type TaskFrequency = 'quotidien' | 'hebdo' | 'libre';

export interface ChoreTask {
  id: string;
  title: string;
  description?: string;
  points: number;
  category: TaskCategory;
  targetType: 'general' | 'personnel';
  assignedTo: string[]; // Member IDs if personal, empty if general
  icon: string;
  frequency: TaskFrequency;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export type SubmissionStatus = 'en_attente' | 'validee' | 'rejetee';

export interface ChoreSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  taskCategory: TaskCategory;
  taskIcon: string;
  points: number;
  submittedBy: string; // Member ID who performed the task
  submittedByName: string;
  completedDate: string; // YYYY-MM-DD
  completedDateLabel: string; // e.g. "Aujourd'hui", "Hier", "Lundi 5 oct."
  submittedAt: string; // ISO timestamp
  note?: string;
  status: SubmissionStatus;
  validatedBy?: string; // Guardian Member ID
  validatedByName?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: string;
  timesClaimed: number;
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  rewardTitle: string;
  rewardIcon: string;
  cost: number;
  claimedBy: string;
  claimedByName: string;
  claimedAt: string;
  status: 'en_attente' | 'accorde' | 'utilise';
}

export interface FamilySettings {
  familyName: string;
  familyCode: string;
  guardianPin: string;
  requirePinForValidation: boolean;
}

export interface FamilyState {
  settings: FamilySettings;
  members: FamilyMember[];
  tasks: ChoreTask[];
  submissions: ChoreSubmission[];
  rewards: RewardItem[];
  rewardClaims: RewardClaim[];
  lastUpdated: number;
}
