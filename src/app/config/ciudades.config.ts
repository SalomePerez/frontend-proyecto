// src/app/config/ciudades.config.ts

export interface CiudadConfig {
  nombre: string;
  nombreBackend: string;
  coordenadas: {
    latitud: number;
    longitud: number;
  };
  zoom: number;
  aliases: string[];
}

/**
 * Configuración de ciudades colombianas
 * Mapea nombres de ciudades detectados por geocodificación al formato esperado por el backend
 */
export const CIUDADES_COLOMBIA: CiudadConfig[] = [
  {
    nombre: 'Armenia',
    nombreBackend: 'ARMENIA',
    coordenadas: { latitud: 4.5339, longitud: -75.6811 },
    zoom: 13,
    aliases: ['Armenia', 'ARMENIA', 'armenia']
  },
  {
    nombre: 'Pereira',
    nombreBackend: 'PEREIRA',
    coordenadas: { latitud: 4.8143, longitud: -75.6946 },
    zoom: 13,
    aliases: ['Pereira', 'PEREIRA', 'pereira']
  },
  {
    nombre: 'Manizales',
    nombreBackend: 'MANIZALES',
    coordenadas: { latitud: 5.0703, longitud: -75.5138 },
    zoom: 13,
    aliases: ['Manizales', 'MANIZALES', 'manizales']
  },
  {
    nombre: 'Bogotá',
    nombreBackend: 'BOGOTA',
    coordenadas: { latitud: 4.7110, longitud: -74.0721 },
    zoom: 11,
    aliases: ['Bogotá', 'Bogota', 'BOGOTA', 'bogota', 'Bogotá D.C.', 'Santafé de Bogotá']
  },
  {
    nombre: 'Medellín',
    nombreBackend: 'MEDELLIN',
    coordenadas: { latitud: 6.2476, longitud: -75.5658 },
    zoom: 12,
    aliases: ['Medellín', 'Medellin', 'MEDELLIN', 'medellin']
  },
  {
    nombre: 'Cali',
    nombreBackend: 'CALI',
    coordenadas: { latitud: 3.4516, longitud: -76.5320 },
    zoom: 12,
    aliases: ['Cali', 'CALI', 'cali', 'Santiago de Cali']
  },
  {
    nombre: 'Barranquilla',
    nombreBackend: 'BARRANQUILLA',
    coordenadas: { latitud: 10.9685, longitud: -74.7813 },
    zoom: 12,
    aliases: ['Barranquilla', 'BARRANQUILLA', 'barranquilla']
  },
  {
    nombre: 'Cartagena',
    nombreBackend: 'CARTAGENA',
    coordenadas: { latitud: 10.3932, longitud: -75.4832 },
    zoom: 12,
    aliases: ['Cartagena', 'CARTAGENA', 'cartagena', 'Cartagena de Indias']
  },
  {
    nombre: 'Bucaramanga',
    nombreBackend: 'BUCARAMANGA',
    coordenadas: { latitud: 7.1253, longitud: -73.1198 },
    zoom: 12,
    aliases: ['Bucaramanga', 'BUCARAMANGA', 'bucaramanga']
  },
  {
    nombre: 'Ibagué',
    nombreBackend: 'IBAGUE',
    coordenadas: { latitud: 4.4389, longitud: -75.2322 },
    zoom: 13,
    aliases: ['Ibagué', 'Ibague', 'IBAGUE', 'ibague', 'ibagué']
  }
];

/**
 * Normalizar nombre de ciudad detectado por geocodificación
 * al formato esperado por el backend
 */
export function normalizarNombreCiudad(nombreDetectado: string): string {
  if (!nombreDetectado) return 'ARMENIA'; // ← CAMBIO: Ciudad por defecto
  
  // Buscar la ciudad en la configuración
  const ciudadEncontrada = CIUDADES_COLOMBIA.find(ciudad =>
    ciudad.aliases.some(alias => 
      alias.toLowerCase() === nombreDetectado.toLowerCase()
    )
  );
  
  if (ciudadEncontrada) {
    console.log(`✅ Ciudad normalizada: ${nombreDetectado} → ${ciudadEncontrada.nombreBackend}`);
    return ciudadEncontrada.nombreBackend;
  }
  
  // Si no se encuentra, intentar normalización básica
  const nombreNormalizado = nombreDetectado
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .trim();
  
  console.log(`⚠️ Ciudad no reconocida: ${nombreDetectado}, usando normalización: ${nombreNormalizado}`);
  return nombreNormalizado || 'ARMENIA'; // ← CAMBIO: Armenia por defecto
}

/**
 * Obtener configuración de ciudad por nombre del backend
 */
export function obtenerConfigCiudad(nombreBackend: string): CiudadConfig | null {
  return CIUDADES_COLOMBIA.find(ciudad => 
    ciudad.nombreBackend === nombreBackend.toUpperCase()
  ) || null;
}

/**
 * Obtener coordenadas por defecto para una ciudad
 */
export function obtenerCoordenadasCiudad(nombreBackend: string): { latitud: number; longitud: number; zoom: number } {
  const config = obtenerConfigCiudad(nombreBackend);
  
  if (config) {
    return {
      latitud: config.coordenadas.latitud,
      longitud: config.coordenadas.longitud,
      zoom: config.zoom
    };
  }
  
  // Coordenadas por defecto (Armenia) ← CAMBIO
  return {
    latitud: 4.5339,
    longitud: -75.6811,
    zoom: 13
  };
}

/**
 * Verificar si una ciudad está soportada
 */
export function esCiudadSoportada(nombreCiudad: string): boolean {
  return CIUDADES_COLOMBIA.some(ciudad =>
    ciudad.aliases.some(alias => 
      alias.toLowerCase() === nombreCiudad.toLowerCase()
    )
  );
}

/**
 * Obtener lista de ciudades soportadas para mostrar al usuario
 */
export function obtenerCiudadesSoportadas(): string[] {
  return CIUDADES_COLOMBIA.map(ciudad => ciudad.nombre);
}