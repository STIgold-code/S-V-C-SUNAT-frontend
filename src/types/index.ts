// User types
export interface User {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
}

// Empresa types
export interface Empresa {
  id: string;
  ruc: string;
  razon_social: string | null;
  usuario_sol?: string;
  validada: boolean;
  activa: boolean;
  grupo: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmpresaStats {
  total: number;
  activas: number;
  validadas: number;
  por_grupo: Record<string, number>;
}

export interface EmpresaCreate {
  ruc: string;
  razon_social?: string;
  usuario_sol: string;
  clave_sol: string;
  grupo?: string;
}

export interface EmpresaUpdate {
  razon_social?: string;
  usuario_sol?: string;
  clave_sol?: string;
  grupo?: string;
  activa?: boolean;
}

// Descarga types
export type ModuloType =
  | 'facturas_emitidas'
  | 'facturas_recibidas'
  | 'boletas_emitidas'
  | 'boletas_recibidas'
  | 'nc_boletas_emitidas'
  | 'nd_boletas_emitidas'
  | 'guias_remision_emitidas'
  | 'guias_remision_recibidas'
  | 'guias_transportista_emitidas'
  | 'guias_transportista_recibidas'
  | 'retenciones_emitidas'
  | 'retenciones_recibidas'
  | 'percepciones_emitidas'
  | 'percepciones_recibidas';

export type FormatoType = 'xml' | 'pdf' | 'cdr' | 'json';

export type EstadoDescarga = 'pending' | 'processing' | 'completed' | 'failed';

export interface Descarga {
  id: string;
  estado: EstadoDescarga;
  periodo: string;
  modulos: ModuloType[];
  formatos: FormatoType[];
  archivo_url: string | null;
  excel_url: string | null;
  total_comprobantes: number;
  progreso: number;
  mensaje_progreso: string | null;
  errores: string | null;
  iniciado_at: string | null;
  completado_at: string | null;
  created_at: string;
  empresa: Empresa | null;
}

export interface DescargaCreate {
  empresa_id?: string;
  periodo: string;
  modulos: ModuloType[];
  formatos: FormatoType[];
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Comprobante types
export interface Comprobante {
  id: string;
  tipo: string;
  serie: string;
  numero: string;
  fecha_emision: string;
  ruc_emisor: string;
  razon_emisor: string | null;
  ruc_receptor: string | null;
  razon_receptor: string | null;
  moneda: string;
  total: number | null;
  modulo: string;
  has_xml: boolean;
  has_pdf: boolean;
}

export interface ComprobantesPageResponse {
  items: Comprobante[];
  total: number;
  skip: number;
  limit: number;
}
