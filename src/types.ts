export type Role = 'elder' | 'caregiver';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // prototype only - plaintext
  role: Role;
  createdAt: number;
}

export interface Pairing {
  id: string;
  elderId: string;
  caregiverId: string;
  createdAt: number;
}

export interface Prescription {
  id: string;
  elderId: string;
  medicineName: string;
  dose: string; // e.g. "1 tablet"
  timesPerDay: number;
  times: string[]; // ["08:00", "20:00"]
  days: number; // how many days it lasts
  startDate: string; // YYYY-MM-DD
  active: boolean;
  totalDoses: number; // total pills supply
  createdAt: number;
}

export interface MedicineLog {
  id: string;
  prescriptionId: string;
  elderId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'taken' | 'missed';
  confirmedAt?: number;
}

export interface CheckIn {
  id: string;
  elderId: string;
  date: string; // YYYY-MM-DD
  feeling: 'good' | 'okay' | 'bad';
  symptoms: string[];
  note: string;
  createdAt: number;
}

export interface Sticker {
  id: string;
  elderId: string;
  caregiverId: string;
  type: string; // sticker key
  milestone: number;
  message: string;
  createdAt: number;
}

export interface VoiceNote {
  id: string;
  elderId: string;
  caregiverId: string;
  prescriptionId?: string;
  dataUrl: string; // base64 audio
  label: string;
  createdAt: number;
}

export type MissedAlert = {
  id: string;
  elderId: string;
  prescriptionId: string;
  date: string;
  time: string;
  medicineName: string;
  acknowledged: boolean;
  createdAt: number;
};
