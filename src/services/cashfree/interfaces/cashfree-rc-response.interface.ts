export interface ICashfreeVehicleRcResponse {
  verification_id: string;
  reference_id?: number | string;
  status: 'VALID' | 'INVALID' | string;
  reg_no?: string;
  class?: string;
  chassis?: string;
  engine?: string;
  vehicle_manufacturer_name?: string;
  model?: string;
  vehicle_color?: string;
  type?: string;
  fuel_type?: string;
  rc_norm_type?: string;
  reg_date?: string;
  fitness_upto?: string;
  insurance_upto?: string;
  insurance_company?: string;
  insurance_policy_no?: string;
  owner_name?: string;
  owner_count?: string | number;
  father_name?: string;
  present_address?: string;
  permanent_address?: string;
  financer?: string;
  blacklist_status?: string;
  pucc_upto?: string;
  pucc_no?: string;
  message?: string;
  [key: string]: any;
}

