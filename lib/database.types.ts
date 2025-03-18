export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'validator' | 'participant';
  state?: string;
  lga?: string;
  chapter?: string;
  organization?: string;
  position?: string;
  avatar_url?: string;
  payment_status: 'pending' | 'completed';
  payment_reference?: string;
  payment_amount?: number;
  payment_date?: Date;
  accreditation_status: 'pending' | 'completed';
  accreditation_date?: Date;
  qr_code?: string;
  unique_id?: string;
  bio?: string;
  dietary_requirements?: string;
  school_name?: string;
  school_address?: string;
  school_city?: string;
  school_state?: string;
  school_type?: string;
  napps_position?: string;
  napps_chapter?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Config {
  id: string;
  key: string;
  value: any;
  description?: string;
  created_at: Date;
}

export interface Booking {
  id: string;
  user_id: string;
  hotel_id: string;
  check_in_date: Date;
  check_out_date: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_reference?: string;
  payment_status: 'pending' | 'completed';
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface Hotel {
  id: string;
  name: string;
  description?: string;
  address?: string;
  price_per_night: number;
  image_url?: string;
  available_rooms: number;
  amenities?: any[];
  created_at: Date;
  updated_at: Date;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  type?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Scan {
  id: string;
  user_id: string;
  scanned_by: string;
  scan_type: 'accreditation' | 'attendance';
  location?: string;
  notes?: string;
  created_at: Date;
}

export interface DbMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingQueries: number;
  lastError?: Error;
  lastErrorTime?: Date;
}

export interface PoolState {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}
