/**
 * Traductor de errores técnicos a mensajes amigables para contadores.
 *
 * Clasifica errores en:
 * - user: El usuario debe corregir algo
 * - temporary: Reintentar más tarde
 * - sunat: Problema de SUNAT
 * - system: Contactar soporte
 */

export type ErrorType = 'user' | 'temporary' | 'sunat' | 'system';

export interface FriendlyError {
  type: ErrorType;
  message: string;
  action: string;
  icon: 'user' | 'clock' | 'cloud' | 'alert';
}

const ERROR_PATTERNS: Array<{
  patterns: RegExp[];
  error: FriendlyError;
}> = [
  // Credenciales inválidas
  {
    patterns: [
      /invalid credentials/i,
      /login failed/i,
      /credenciales.*inv[aá]lid/i,
      /usuario.*incorrecto/i,
      /clave.*incorrecta/i,
      /autenticaci[oó]n.*fall/i,
    ],
    error: {
      type: 'user',
      message: 'Credenciales SOL inválidas',
      action: 'Verifique usuario y clave en la sección Empresas',
      icon: 'user',
    },
  },
  // Sin comprobantes
  {
    patterns: [
      /no.*data.*found/i,
      /0 comprobantes/i,
      /sin.*comprobantes/i,
      /no se encontr/i,
      /empty.*result/i,
    ],
    error: {
      type: 'user',
      message: 'Sin comprobantes en este periodo',
      action: 'Verifique que el periodo y módulo sean correctos',
      icon: 'user',
    },
  },
  // Timeout / SUNAT lenta
  {
    patterns: [
      /timeout/i,
      /timed?\s*out/i,
      /tiempo.*agotado/i,
      /no respond/i,
      /ETIMEDOUT/i,
    ],
    error: {
      type: 'temporary',
      message: 'SUNAT no respondió a tiempo',
      action: 'Intente nuevamente en unos minutos',
      icon: 'clock',
    },
  },
  // Captcha
  {
    patterns: [
      /captcha/i,
      /verificaci[oó]n.*humana/i,
      /robot/i,
    ],
    error: {
      type: 'sunat',
      message: 'SUNAT requiere verificación manual',
      action: 'Ingrese a SUNAT manualmente y vuelva a intentar',
      icon: 'cloud',
    },
  },
  // Sesión expirada
  {
    patterns: [
      /session.*expir/i,
      /sesi[oó]n.*expir/i,
      /sesi[oó]n.*cerr/i,
      /logged.*out/i,
    ],
    error: {
      type: 'temporary',
      message: 'La sesión de SUNAT expiró',
      action: 'Reintente la descarga',
      icon: 'clock',
    },
  },
  // Conexión / Red
  {
    patterns: [
      /connection.*refused/i,
      /ECONNREFUSED/i,
      /network/i,
      /sin.*conexi[oó]n/i,
      /ENOTFOUND/i,
      /DNS/i,
    ],
    error: {
      type: 'temporary',
      message: 'Error de conexión',
      action: 'Verifique su conexión a internet',
      icon: 'clock',
    },
  },
  // SUNAT cambió su portal
  {
    patterns: [
      /element.*not.*found/i,
      /selector.*not.*found/i,
      /elemento.*no.*encontr/i,
      /page.*structure/i,
      /iframe/i,
    ],
    error: {
      type: 'sunat',
      message: 'SUNAT actualizó su portal',
      action: 'Contacte a soporte técnico',
      icon: 'cloud',
    },
  },
  // Browser/Playwright cerrado
  {
    patterns: [
      /browser.*closed/i,
      /page.*closed/i,
      /context.*closed/i,
      /target.*closed/i,
    ],
    error: {
      type: 'temporary',
      message: 'El proceso se interrumpió',
      action: 'Reintente la descarga',
      icon: 'clock',
    },
  },
  // Errores internos del sistema
  {
    patterns: [
      /errno\s*22/i,
      /invalid.*argument/i,
      /worker.*error/i,
      /subprocess/i,
      /internal.*error/i,
    ],
    error: {
      type: 'system',
      message: 'Error interno del sistema',
      action: 'Si persiste, contacte a soporte',
      icon: 'alert',
    },
  },
];

// Error por defecto
const DEFAULT_ERROR: FriendlyError = {
  type: 'system',
  message: 'Error inesperado',
  action: 'Reintente o contacte a soporte',
  icon: 'alert',
};

/**
 * Traduce un mensaje de error técnico a un mensaje amigable para el usuario.
 */
export function translateError(technicalError: string | null | undefined): FriendlyError {
  if (!technicalError) {
    return DEFAULT_ERROR;
  }

  for (const { patterns, error } of ERROR_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(technicalError)) {
        return error;
      }
    }
  }

  return DEFAULT_ERROR;
}

/**
 * Obtiene el color asociado al tipo de error.
 */
export function getErrorColor(type: ErrorType): string {
  switch (type) {
    case 'user':
      return 'amber'; // Amarillo - acción del usuario requerida
    case 'temporary':
      return 'blue'; // Azul - temporal, reintentar
    case 'sunat':
      return 'orange'; // Naranja - problema externo
    case 'system':
      return 'destructive'; // Rojo - error grave
    default:
      return 'destructive';
  }
}
