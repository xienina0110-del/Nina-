
export enum AppModule {
  VIDEOS = 'VIDEOS',
  CHAT = 'CHAT',
  REMINDERS = 'REMINDERS',
}

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  category: 'Education' | 'Post-Op' | 'Fun';
  videoUrl?: string; // For display (Blob URL or external URL)
  videoFile?: Blob;  // For persistence in IndexedDB
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ProcedureType {
  TOOTH_EXTRACTION = '儿童拔牙',
  FILLING = '补牙治疗',
  SEALANT = '窝沟封闭',
  BRACES_ADJUSTMENT = '牙套调整',
  CLEANING = '常规洁牙',
  // New added procedures
  PULPOTOMY = '乳恒牙活髓切断术',
  ROOT_CANAL_PRIMARY = '乳牙根管治疗术',
  TRANSPARENT_CROWN = '乳牙透明冠修复术',
  STAINLESS_STEEL_CROWN = '乳磨牙不锈钢预成冠修复术',
  EARLY_ORTHODONTICS = '早期矫正（活动性矫治器）',
  INVISIBLE_ORTHODONTICS = '隐形矫正术',
  RESIN_FILLING = '树脂充填术',
}

export interface ReminderItem {
  dayOffset: number; // 0 for today, 1 for tomorrow, etc.
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';
  action: string;
  importance: 'High' | 'Medium' | 'Low';
}

export interface CarePlan {
  procedureName: string;
  patientName: string;
  contactInfo: string;
  generatedAt: string;
  reminders: ReminderItem[];
}
