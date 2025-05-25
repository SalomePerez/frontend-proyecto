import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { normalizarNombreCiudad } from '../config/ciudades.config'; // ← Importar configuración

// Interfaces para el backend
export interface UbicacionBackend {
  latitud: number;
  longitud: number;
}

export interface CategoriaBackend {
  id: string;
  nombre: string;
}

export interface CrearReporteBackend {
  titulo: string;
  descripcion: string;
  fotos: string[];
  idCategoria: string;
  ubicacion: UbicacionBackend;
  idUsuario: string;
}

export interface CrearReporteAnonimoBackend {
  titulo: string;
  descripcion: string;
  idCategoria: string;
  esAnonimo: true;
  ubicacion: UbicacionBackend;
  fotos: string[];
  ciudad: string;
}

export interface ApiResponse<T> {
  error: boolean;
  mensaje: T;
}

export interface ImagenUploadResponse {
  url: string;
  id: string;
  nombreOriginal: string;
  tamano: number;
  formato: string;
}

export interface CrearReporteResponse {
  error: boolean;
  mensaje: string; // "Reporte creado exitosamente, el ID es: 64a7f8e0b27c1234567890ab"
}

// ✨ NUEVAS INTERFACES PARA OBTENER REPORTES
export interface ReporteDTO {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  contadorImportante: number;
  idUsuario: string;
  ubicacion: UbicacionBackend;
  fotos: string[];
  estadoActual: string;
  ciudad: string;
  comentarios: string[];
  esAnonimo: boolean;
  nombreUsuario?: string;
}

export interface UbicacionUsuario {
  latitud: number;
  longitud: number;
  ciudad: string;
  pais?: string;
  precision?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  private readonly BASE_URL = 'https://proyecto-avanzada.onrender.com/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtener headers con token de autorización
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getTokenFromStorage();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }

    console.warn('⚠️ No se encontró token de autorización');
    return headers;
  }

  /**
   * Obtener headers para FormData con token
   */
  private getAuthHeadersForFormData(): HttpHeaders {
    const token = this.getTokenFromStorage();
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('⚠️ No se encontró token de autorización para FormData');
    }

    return headers;
  }

  /**
   * Obtener token del localStorage
   */
  private getTokenFromStorage(): string | null {
    try {
      // Ajusta el nombre de la clave según como guardas el token
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('token') || 
                   localStorage.getItem('jwt_token');
      
      if (token) {
        console.log('✅ Token encontrado para peticiones HTTP');
        return token;
      }
      
      // Intentar obtener desde sessionStorage también
      const sessionToken = sessionStorage.getItem('authToken') || 
                          sessionStorage.getItem('token') ||
                          sessionStorage.getItem('jwt_token');
      
      if (sessionToken) {
        console.log('✅ Token encontrado en sessionStorage');
        return sessionToken;
      }

      console.warn('⚠️ No se encontró token en ningún storage');
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
      return null;
    }
  }

  /**
   * Verificar si hay token válido
   */
  private hasValidToken(): boolean {
    return !!this.getTokenFromStorage();
  }

  // ✨ NUEVOS MÉTODOS PARA OBTENER REPORTES POR UBICACIÓN

  /**
   * Obtener reportes por ciudad (REQUIERE AUTENTICACIÓN)
   */
  obtenerReportesPorCiudad(ciudad: string, nombre?: string, categoria?: string): Observable<ReporteDTO[]> {
    console.log('🏙️ Obteniendo reportes para ciudad:', ciudad);
    
    // ✨ VERIFICAR AUTENTICACIÓN
    if (!this.hasValidToken()) {
      console.error('❌ Token requerido para obtener reportes');
      return throwError(() => new Error('Debes iniciar sesión para ver los reportes.'));
    }
    
    // Construir parámetros de consulta
    let params = new HttpParams();
    params = params.set('ciudad', ciudad.toUpperCase());
    
    if (nombre && nombre.trim()) {
      params = params.set('nombre', nombre.trim());
    }
    
    if (categoria && categoria.trim()) {
      params = params.set('categoria', categoria.trim());
    }

    console.log('📊 Parámetros de consulta:', params.toString());

    // ✨ AGREGAR HEADERS DE AUTENTICACIÓN
    const httpOptions = {
      headers: this.getAuthHeaders(),
      params: params
    };

    return this.http.get<ApiResponse<ReporteDTO[]>>(`${this.BASE_URL}/reportes`, httpOptions)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error('Error obteniendo reportes');
          }
          console.log(`✅ Reportes obtenidos para ${ciudad}:`, response.mensaje.length);
          return response.mensaje;
        }),
        catchError(error => {
          console.error('❌ Error obteniendo reportes por ciudad:', error);
          
          // Manejo específico de errores de autenticación
          if (error.status === 401 || error.status === 403) {
            return throwError(() => new Error('Tu sesión ha expirado. Inicia sesión nuevamente.'));
          }
          
          return throwError(() => new Error(`Error al obtener reportes de ${ciudad}. Verifica tu conexión.`));
        })
      );
  }

  /**
   * Obtener nombre de ciudad usando geocodificación inversa
   */
  obtenerNombreCiudad(latitud: number, longitud: number): Observable<string> {
    console.log('🌍 Obteniendo nombre de ciudad para coordenadas:', { latitud, longitud });
    
    
    
    // Usar el token de geocodificación del environment
    const mapboxToken = environment.geocoding?.mapboxGeocodingToken || 
                       environment.mapboxToken ||
                       'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'; // Token público de fallback
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitud},${latitud}.json`;
    const params = new HttpParams()
      .set('access_token', mapboxToken)
      .set('types', 'place,locality')
      .set('limit', '1')
      .set('language', 'es'); // Español para obtener nombres en español


    return this.http.get<any>(url, { params })
      .pipe(
        map(response => {
          if (response.features && response.features.length > 0) {
            // Intentar obtener el nombre de la ciudad
            const feature = response.features[0];
            let ciudadNombre = '';
            
            // Buscar en el contexto por tipo de lugar
            if (feature.context) {
              const lugarContext = feature.context.find((ctx: any) => 
                ctx.id.includes('place') || ctx.id.includes('locality')
              );
              if (lugarContext) {
                ciudadNombre = lugarContext.text;
              }
            }
            
            // Si no se encontró en contexto, usar el texto principal
            if (!ciudadNombre && feature.text) {
              ciudadNombre = feature.text;
            }
            
            // Si aún no hay nombre, usar el place_name
            if (!ciudadNombre && feature.place_name) {
              // Extraer la primera parte del place_name (generalmente es la ciudad)
              ciudadNombre = feature.place_name.split(',')[0];
            }
            
            // Convertir a mayúsculas y normalizar usando la configuración
            const ciudadFinal = normalizarNombreCiudad(ciudadNombre);
            console.log('✅ Ciudad detectada y normalizada:', ciudadFinal);
            return ciudadFinal;
          }
          
          // Ciudad por defecto si no se puede determinar (ARMENIA)
          console.warn('⚠️ No se pudo determinar la ciudad, usando ARMENIA por defecto');
          return normalizarNombreCiudad('ARMENIA');
        }),
        catchError(error => {
          console.error('❌ Error en geocodificación:', error);
          // Retornar ciudad por defecto en caso de error (ARMENIA)
          return of(normalizarNombreCiudad('ARMENIA'));
        })
      );
  }

  /**
   * Obtener ubicación completa del usuario (coordenadas + ciudad)
   */
  obtenerUbicacionCompleta(): Observable<UbicacionUsuario> {
    console.log('📍 Obteniendo ubicación completa del usuario...');
    
    return new Observable<UbicacionUsuario>(observer => {
      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocalización no soportada');
        observer.next({
          latitud: 4.5339,  // ← Coordenadas de Armenia
          longitud: -75.6811,
          ciudad: normalizarNombreCiudad('ARMENIA'),
          precision: 0
        });
        observer.complete();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            precision: position.coords.accuracy
          };
          
          console.log('✅ Coordenadas obtenidas:', coords);
          
          // Obtener nombre de ciudad
          this.obtenerNombreCiudad(coords.latitud, coords.longitud)
            .subscribe({
              next: (ciudad) => {
                const ubicacionCompleta: UbicacionUsuario = {
                  ...coords,
                  ciudad: ciudad
                };
                console.log('🎯 Ubicación completa:', ubicacionCompleta);
                observer.next(ubicacionCompleta);
                observer.complete();
              },
              error: (error) => {
                console.error('❌ Error obteniendo ciudad:', error);
                // Aún así devolver las coordenadas con ciudad por defecto
                observer.next({
                  ...coords,
                  ciudad: 'PEREIRA'
                });
                observer.complete();
              }
            });
        },
        (error) => {
          console.warn('⚠️ Error obteniendo ubicación:', error.message);
          // Ubicación por defecto (Armenia)
          observer.next({
            latitud: 4.5339,  // ← Coordenadas de Armenia
            longitud: -75.6811,
            ciudad: normalizarNombreCiudad('ARMENIA'),
            precision: 0
          });
          observer.complete();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  /**
   * Obtener reportes cercanos basados en la ubicación actual
   */
  obtenerReportesCercanos(): Observable<ReporteDTO[]> {
    console.log('🎯 Obteniendo reportes cercanos a la ubicación actual...');
    
    return this.obtenerUbicacionCompleta()
      .pipe(
        switchMap(ubicacion => {
          console.log('📍 Ubicación detectada:', ubicacion.ciudad);
          return this.obtenerReportesPorCiudad(ubicacion.ciudad);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo reportes cercanos:', error);
          // Intentar con ciudad por defecto (ARMENIA)
          return this.obtenerReportesPorCiudad(normalizarNombreCiudad('ARMENIA'));
        })
      );
  }

  // MÉTODOS EXISTENTES (mantener todos los anteriores)

  /**
   * Obtener todas las categorías disponibles
   */
  getCategorias(): Observable<CategoriaBackend[]> {
    console.log('📋 Obteniendo categorías del backend...');
    
    // Las categorías son públicas según tu SecurityConfig
    return this.http.get<ApiResponse<CategoriaBackend[]>>(`${this.BASE_URL}/categorias`)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error('Error obteniendo categorías');
          }
          console.log('✅ Categorías obtenidas:', response.mensaje);
          return response.mensaje;
        }),
        catchError(error => {
          console.error('❌ Error obteniendo categorías:', error);
          return throwError(() => new Error('Error al obtener las categorías. Verifica tu conexión.'));
        })
      );
  }

  /**
   * Subir una sola imagen (requiere autenticación)
   */
  subirImagen(archivo: File): Observable<ImagenUploadResponse> {
    console.log('📤 Subiendo imagen:', archivo.name);
    
    if (!this.hasValidToken()) {
      return throwError(() => new Error('No estás autenticado. Inicia sesión para subir imágenes.'));
    }
    
    const formData = new FormData();
    formData.append('imagen', archivo);

    const httpOptions = {
      headers: this.getAuthHeadersForFormData()
    };

    return this.http.post<ApiResponse<ImagenUploadResponse>>(`${this.BASE_URL}/imagenes`, formData, httpOptions)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error('Error subiendo imagen');
          }
          console.log('✅ Imagen subida:', response.mensaje.url);
          return response.mensaje;
        }),
        catchError(error => {
          console.error('❌ Error subiendo imagen:', error);
          if (error.status === 403) {
            return throwError(() => new Error('No tienes permisos para subir imágenes. Verifica tu sesión.'));
          }
          return throwError(() => new Error(`Error subiendo la imagen ${archivo.name}`));
        })
      );
  }

  /**
   * Subir múltiples imágenes (requiere autenticación)
   */
  subirImagenesMultiples(archivos: File[]): Observable<ImagenUploadResponse[]> {
    console.log('📤 Subiendo múltiples imágenes:', archivos.length);
    
    if (!this.hasValidToken()) {
      return throwError(() => new Error('No estás autenticado. Inicia sesión para subir imágenes.'));
    }
    
    const formData = new FormData();
    archivos.forEach(archivo => {
      formData.append('imagenes', archivo);
    });

    const httpOptions = {
      headers: this.getAuthHeadersForFormData()
    };

    return this.http.post<ApiResponse<ImagenUploadResponse[]>>(`${this.BASE_URL}/imagenes/multiple`, formData, httpOptions)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error('Error subiendo imágenes');
          }
          console.log('✅ Imágenes subidas:', response.mensaje.length);
          return response.mensaje;
        }),
        catchError(error => {
          console.error('❌ Error subiendo imágenes múltiples:', error);
          if (error.status === 403) {
            return throwError(() => new Error('No tienes permisos para subir imágenes. Verifica tu sesión.'));
          }
          return throwError(() => new Error('Error subiendo las imágenes'));
        })
      );
  }

  /**
   * Crear reporte normal (requiere autenticación)
   */
  crearReporte(reporte: CrearReporteBackend): Observable<string> {
    console.log('📝 Creando reporte normal:', reporte);
    
    if (!this.hasValidToken()) {
      return throwError(() => new Error('No estás autenticado. Inicia sesión para crear reportes.'));
    }
    
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    return this.http.post<CrearReporteResponse>(`${this.BASE_URL}/reportes`, reporte, httpOptions)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error('Error creando reporte');
          }
          
          // Extraer ID del mensaje: "Reporte creado exitosamente, el ID es: 64a7f8e0b27c1234567890ab"
          const idMatch = response.mensaje.match(/ID es: ([a-fA-F0-9]{24})/);
          const reporteId = idMatch ? idMatch[1] : '';
          
          console.log('✅ Reporte creado con ID:', reporteId);
          return reporteId;
        }),
        catchError(error => {
          console.error('❌ Error creando reporte:', error);
          if (error.status === 403) {
            return throwError(() => new Error('No tienes permisos para crear reportes. Verifica tu sesión.'));
          }
          return throwError(() => new Error('Error al crear el reporte. Verifica los datos e intenta de nuevo.'));
        })
      );
  }

  /**
   * Crear reporte anónimo (requiere autenticación)
   */
  crearReporteAnonimo(reporte: CrearReporteAnonimoBackend): Observable<string> {
    console.log('🕵️ Creando reporte anónimo:', reporte);
    
    if (!this.hasValidToken()) {
      return throwError(() => new Error('No estás autenticado. Inicia sesión para crear reportes.'));
    }
    
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    return this.http.post<CrearReporteResponse>(`${this.BASE_URL}/reportes/anonimos`, reporte, httpOptions)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error('Error creando reporte anónimo');
          }
          
          // Extraer ID del mensaje
          const idMatch = response.mensaje.match(/ID es: ([a-fA-F0-9]{24})/);
          const reporteId = idMatch ? idMatch[1] : '';
          
          console.log('✅ Reporte anónimo creado con ID:', reporteId);
          return reporteId;
        }),
        catchError(error => {
          console.error('❌ Error creando reporte anónimo:', error);
          if (error.status === 403) {
            return throwError(() => new Error('No tienes permisos para crear reportes. Verifica tu sesión.'));
          }
          return throwError(() => new Error('Error al crear el reporte anónimo. Verifica los datos e intenta de nuevo.'));
        })
      );
  }

  /**
   * Marcar reporte como importante (requiere autenticación)
   */
  marcarComoImportante(reporteId: string): Observable<boolean> {
    console.log('⭐ Marcando reporte como importante:', reporteId);
    
    if (!this.hasValidToken()) {
      return throwError(() => new Error('No estás autenticado. Inicia sesión para marcar reportes.'));
    }
    
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    return this.http.post<ApiResponse<any>>(`${this.BASE_URL}/reportes/${reporteId}/importante`, {}, httpOptions)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error('Error marcando como importante');
          }
          console.log('✅ Reporte marcado como importante');
          return true;
        }),
        catchError(error => {
          console.error('❌ Error marcando como importante:', error);
          if (error.status === 403) {
            return throwError(() => new Error('No tienes permisos para marcar reportes. Verifica tu sesión.'));
          }
          return throwError(() => new Error('Error al marcar el reporte como importante'));
        })
      );
  }

  /**
   * Proceso completo: crear reporte con todas las validaciones
   */
  async procesarCreacionReporte(
    datosReporte: any,
    archivosImagenes: File[],
    esAnonimo: boolean,
    esImportante: boolean,
    idUsuario: string
  ): Promise<string> {
    
    console.log('🚀 Iniciando proceso completo de creación de reporte...');
    
    try {
      // 1. Subir imágenes si existen
      let urlsImagenes: string[] = [];
      
      if (archivosImagenes.length > 0) {
        console.log(`📤 Subiendo ${archivosImagenes.length} imagen(es)...`);
        
        if (archivosImagenes.length === 1) {
          // Subir una sola imagen
          const imagenResponse = await this.subirImagen(archivosImagenes[0]).toPromise();
          if (imagenResponse) {
            urlsImagenes.push(imagenResponse.url);
          }
        } else {
          // Subir múltiples imágenes
          const imagenesResponse = await this.subirImagenesMultiples(archivosImagenes).toPromise();
          if (imagenesResponse) {
            urlsImagenes = imagenesResponse.map(img => img.url);
          }
        }
        
        console.log('✅ Imágenes subidas exitosamente:', urlsImagenes);
      }

      // 2. Crear reporte (normal o anónimo)
      let reporteId: string;
      
      if (esAnonimo) {
        const reporteAnonimo: CrearReporteAnonimoBackend = {
          titulo: datosReporte.titulo,
          descripcion: datosReporte.descripcion,
          idCategoria: datosReporte.categoria,
          esAnonimo: true,
          ubicacion: {
            latitud: datosReporte.ubicacion.latitud,
            longitud: datosReporte.ubicacion.longitud
          },
          fotos: urlsImagenes,
          ciudad: 'ARMENIA' // ← CAMBIO: Armenia por defecto
        };
        
        reporteId = await this.crearReporteAnonimo(reporteAnonimo).toPromise() || '';
      } else {
        const reporteNormal: CrearReporteBackend = {
          titulo: datosReporte.titulo,
          descripcion: datosReporte.descripcion,
          fotos: urlsImagenes,
          idCategoria: datosReporte.categoria,
          ubicacion: {
            latitud: datosReporte.ubicacion.latitud,
            longitud: datosReporte.ubicacion.longitud
          },
          idUsuario: idUsuario
        };
        
        reporteId = await this.crearReporte(reporteNormal).toPromise() || '';
      }

      if (!reporteId) {
        throw new Error('No se pudo obtener el ID del reporte creado');
      }

      // 3. Marcar como importante si es necesario
      if (esImportante && reporteId) {
        console.log('⭐ Marcando reporte como importante...');
        await this.marcarComoImportante(reporteId).toPromise();
      }

      console.log('🎉 Proceso de creación completado exitosamente. ID:', reporteId);
      return reporteId;

    } catch (error: any) {
      console.error('💥 Error en el proceso de creación:', error);
      throw new Error(error.message || 'Error procesando la creación del reporte');
    }
  }

  /**
   * Validar archivo de imagen
   */
  validarArchivoImagen(archivo: File): { valido: boolean; error?: string } {
    // Validar tipo
    if (!archivo.type.startsWith('image/')) {
      return { valido: false, error: 'El archivo debe ser una imagen' };
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (archivo.size > maxSize) {
      return { valido: false, error: 'La imagen no puede superar los 5MB' };
    }

    // Validar formato
    const formatosPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!formatosPermitidos.includes(archivo.type)) {
      return { valido: false, error: 'Formato no permitido. Solo JPG, PNG y WebP' };
    }

    return { valido: true };
  }

  /**
   * Test de conexión y autenticación
   */
  testConection(): Observable<any> {
    console.log('🔌 Probando conexión y autenticación...');
    
    // Primero probar endpoint público (categorías)
    const publicTest = this.http.get(`${this.BASE_URL}/categorias`);
    
    // Luego probar endpoint protegido si hay token
    if (this.hasValidToken()) {
      const httpOptions = {
        headers: this.getAuthHeaders()
      };
      
      // Usar un endpoint que requiera autenticación pero que sea simple
      const authTest = this.http.get(`${this.BASE_URL}/reportes`, httpOptions);
      
      return authTest.pipe(
        map(response => ({
          authenticated: true,
          publicEndpoint: 'OK',
          protectedEndpoint: 'OK',
          token: 'Valid'
        })),
        catchError(error => {
          console.error('❌ Error en endpoint protegido:', error);
          return publicTest.pipe(
            map(() => ({
              authenticated: false,
              publicEndpoint: 'OK',
              protectedEndpoint: 'ERROR',
              token: this.hasValidToken() ? 'Invalid' : 'Missing',
              error: error.status === 403 ? 'Forbidden' : 'Other'
            }))
          );
        })
      );
    } else {
      return publicTest.pipe(
        map(() => ({
          authenticated: false,
          publicEndpoint: 'OK',
          protectedEndpoint: 'Not tested',
          token: 'Missing'
        })),
        catchError(error => 
          // Devuelve un observable del objeto de error
          of({
            authenticated: false,
            publicEndpoint: 'ERROR',
            protectedEndpoint: 'Not tested',
            token: 'Missing',
            error: error
          })
        )
      );
    }
  }

  /**
   * Método para debuggear el token almacenado
   */
  debugToken(): void {
    console.log('🔍 Debug de autenticación:');
    console.log('- localStorage authToken:', localStorage.getItem('authToken'));
    console.log('- localStorage token:', localStorage.getItem('token'));
    console.log('- localStorage jwt_token:', localStorage.getItem('jwt_token'));
    console.log('- sessionStorage authToken:', sessionStorage.getItem('authToken'));
    console.log('- sessionStorage token:', sessionStorage.getItem('token'));
    console.log('- sessionStorage jwt_token:', sessionStorage.getItem('jwt_token'));
    console.log('- Has valid token:', this.hasValidToken());
  }
}

// Necesario para el operador switchMap
// import { switchMap } from 'rxjs/operators'; // Ya importado arriba