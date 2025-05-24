import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import mapboxgl from 'mapbox-gl'; // Import corregido
import { environment } from '../../environments/environment'; // Ruta corregida

// Interfaces para reportes - basadas en los DTOs del backend
export interface UbicacionDTO {
  latitud: number;
  longitud: number;
}

export interface ReporteDTO {
  id: string;
  descripcion: string;
  fecha: string;
  contadorImportante: number;
  idUsuario: string;
  titulo: string;
  ubicacion: UbicacionDTO;
  fotos: string[];
  estadoActual: string;
  ciudad: string;
  comentarios: string[];
  esAnonimo: boolean;
  nombreUsuario?: string;
}

export interface CrearReporteDTO {
  titulo: string;
  descripcion: string;
  fotos: string[];
  idCategoria: string;
  ubicacion: UbicacionDTO;
  idUsuario: string;
}

export interface Coordenadas {
  lng: number;
  lat: number;
}

export interface ConfiguracionMapa {
  accessToken: string;
  contenedor: string;
  estilo?: string;
  centro?: mapboxgl.LngLatLike;
  zoom?: number;
  pitch?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapaService {
  
  mapa: mapboxgl.Map | null = null;
  marcadores: mapboxgl.Marker[] = [];
  posicionActual: mapboxgl.LngLatLike;
  
  // Token de acceso desde environment
  private readonly MAPBOX_TOKEN = environment.mapboxToken;

  constructor() {
    console.log('🏗️ Inicializando MapaService...');
    console.log('🔑 Token disponible:', !!this.MAPBOX_TOKEN);
    
    // Configurar token global de Mapbox
    if (this.MAPBOX_TOKEN) {
      mapboxgl.accessToken = this.MAPBOX_TOKEN;
      console.log('✅ Token de Mapbox configurado');
    } else {
      console.error('❌ Token de Mapbox no encontrado en environment');
    }
    
    this.marcadores = [];
    // Coordenadas por defecto (Pereira, Colombia)
    this.posicionActual = [-75.67270, 4.53252];
  }

  /**
   * Crear mapa con configuración por defecto
   */
  public crearMapa(contenedor: string = 'mapa'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const config: ConfiguracionMapa = {
        accessToken: this.MAPBOX_TOKEN,
        contenedor: contenedor,
        estilo: 'mapbox://styles/mapbox/streets-v12',
        centro: this.posicionActual,
        zoom: 13,
        pitch: 0
      };

      this.crearMapaConConfiguracion(config)
        .then(() => resolve(true))
        .catch(error => reject(error));
    });
  }

  /**
   * Crear mapa con configuración personalizada
   */
  public crearMapaConConfiguracion(config: ConfiguracionMapa): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🗺️ Iniciando creación del mapa...');
      
      if (!this.MAPBOX_TOKEN) {
        const error = 'Token de Mapbox no configurado en environment';
        console.error('⚠️ MapaService:', error);
        reject(new Error(error));
        return;
      }

      try {
        // Verificar que el contenedor existe
        const contenedor = document.getElementById(config.contenedor);
        if (!contenedor) {
          const error = `Contenedor '${config.contenedor}' no encontrado`;
          console.error('❌ MapaService:', error);
          reject(new Error(error));
          return;
        }

        console.log('📦 Contenedor encontrado:', config.contenedor);

        // Destruir mapa anterior si existe
        if (this.mapa) {
          console.log('🗑️ Destruyendo mapa anterior...');
          this.destruirMapa();
        }

        this.mapa = new mapboxgl.Map({
          container: config.contenedor,
          style: config.estilo || 'mapbox://styles/mapbox/streets-v12',
          center: config.centro || this.posicionActual,
          zoom: config.zoom || 13,
          pitch: config.pitch || 0,
          attributionControl: false,
          logoPosition: 'bottom-right'
        });

        console.log('🗺️ Instancia de mapa creada');

        // Eventos del mapa
        this.mapa.on('load', () => {
          console.log('✅ Mapa Mapbox cargado exitosamente');
          this.agregarControlesMapa();
          resolve();
        });

        this.mapa.on('error', (error: any) => {
          console.error('❌ Error en Mapbox:', error);
          reject(new Error(`Error de Mapbox: ${error.error?.message || 'Error desconocido'}`));
        });

        this.mapa.on('style.load', () => {
          console.log('🎨 Estilo del mapa cargado');
        });

        // Timeout de seguridad
        setTimeout(() => {
          if (this.mapa && !this.mapa.loaded()) {
            console.warn('⏰ Timeout: El mapa tardó mucho en cargar');
            reject(new Error('Timeout: El mapa tardó mucho en cargar'));
          }
        }, 15000);

      } catch (error: any) {
        console.error('❌ Error creando mapa:', error);
        reject(error);
      }
    });
  }

  /**
   * Agregar controles de navegación y geolocalización al mapa
   */
  private agregarControlesMapa(): void {
    if (!this.mapa) {
      console.warn('⚠️ No se pueden agregar controles: mapa no inicializado');
      return;
    }

    try {
      console.log('🎮 Agregando controles al mapa...');

      // Control de navegación (zoom y rotación)
      const navControl = new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
      });
      this.mapa.addControl(navControl, 'top-right');

      // Control de geolocalización
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: false
      });
      
      this.mapa.addControl(geolocateControl, 'top-right');

      // Control de escala
      const scaleControl = new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      });
      this.mapa.addControl(scaleControl, 'bottom-left');

      // Control de pantalla completa
      const fullscreenControl = new mapboxgl.FullscreenControl();
      this.mapa.addControl(fullscreenControl, 'top-right');

      console.log('✅ Controles agregados exitosamente');

    } catch (error) {
      console.error('❌ Error agregando controles:', error);
    }
  }

  /**
   * Agregar marcador clickeable al mapa
   */
  public agregarMarcador(): Observable<Coordenadas> {
    if (!this.mapa) {
      return new Observable(observer => {
        observer.error('Mapa no inicializado');
      });
    }

    const mapaGlobal = this.mapa;
    const marcadores = this.marcadores;

    return new Observable<Coordenadas>(observer => {
      const clickHandler = (e: mapboxgl.MapMouseEvent) => {
        console.log('👆 Click en mapa detectado:', e.lngLat);

        // Limpiar marcadores temporales anteriores
        for (let i = marcadores.length - 1; i >= 0; i--) {
          const marcador = marcadores[i];
          if ((marcador as any).isTemporary) {
            marcador.remove();
            marcadores.splice(i, 1);
          }
        }

        // Crear nuevo marcador temporal
        const marcador = new mapboxgl.Marker({ 
          color: '#ff0000',
          draggable: true,
          scale: 1
        })
        .setLngLat([e.lngLat.lng, e.lngLat.lat])
        .addTo(mapaGlobal);

        // Marcar como temporal
        (marcador as any).isTemporary = true;
        marcadores.push(marcador);
        
        const coordenadas: Coordenadas = {
          lng: Number(e.lngLat.lng.toFixed(6)),
          lat: Number(e.lngLat.lat.toFixed(6))
        };

        observer.next(coordenadas);
      };

      mapaGlobal.on('click', clickHandler);

      // Cleanup cuando se complete el observable
      return () => {
        if (mapaGlobal && !mapaGlobal._removed) {
          mapaGlobal.off('click', clickHandler);
        }
      };
    });
  }

  /**
   * Pintar marcadores de reportes en el mapa
   */
  public pintarMarcadores(reportes: ReporteDTO[]): void {
    if (!this.mapa) {
      console.warn('⚠️ Mapa no inicializado para pintar marcadores');
      return;
    }

    if (!this.mapa.loaded()) {
      console.warn('⚠️ Mapa aún no está cargado completamente');
      // Intentar de nuevo después de un momento
      setTimeout(() => {
        this.pintarMarcadores(reportes);
      }, 1000);
      return;
    }

    console.log(`📍 Pintando ${reportes.length} marcadores en el mapa`);

    reportes.forEach((reporte, index) => {
      try {
        // Validar que tenga ubicación válida
        if (!reporte.ubicacion || 
            typeof reporte.ubicacion.longitud !== 'number' || 
            typeof reporte.ubicacion.latitud !== 'number' ||
            isNaN(reporte.ubicacion.longitud) ||
            isNaN(reporte.ubicacion.latitud) ||
            Math.abs(reporte.ubicacion.longitud) > 180 ||
            Math.abs(reporte.ubicacion.latitud) > 90) {
          console.warn(`⚠️ Reporte ${reporte.id} sin ubicación válida:`, reporte.ubicacion);
          return;
        }

        // Crear popup con información del reporte
        const popupContent = this.crearContenidoPopup(reporte);
        
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '300px',
          className: 'custom-popup'
        }).setHTML(popupContent);

        // Determinar color según estado
        const color = this.obtenerColorPorEstado(reporte.estadoActual);

        // Crear marcador
        const marcador = new mapboxgl.Marker({ 
          color: color,
          scale: 0.9
        })
        .setLngLat([reporte.ubicacion.longitud, reporte.ubicacion.latitud])
        .setPopup(popup)
        .addTo(this.mapa!);

        // Marcar como permanente
        (marcador as any).isTemporary = false;
        (marcador as any).reporteId = reporte.id;
        this.marcadores.push(marcador);

        console.log(`✅ Marcador ${index + 1}/${reportes.length} agregado para reporte ${reporte.id}`);

      } catch (error) {
        console.error(`❌ Error pintando marcador para reporte ${reporte.id}:`, error);
      }
    });

    console.log(`🎯 Total de marcadores en el mapa: ${this.marcadores.length}`);
  }

  /**
   * Crear contenido HTML para popup de reporte
   */
  private crearContenidoPopup(reporte: ReporteDTO): string {
    try {
      const fecha = new Date(reporte.fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const autor = reporte.esAnonimo ? 'Anónimo' : (reporte.nombreUsuario || 'Usuario');
      
      return `
        <div class="popup-reporte" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 280px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; line-height: 1.3;">
            ${this.escapeHtml(reporte.titulo)}
          </h4>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; line-height: 1.4;">
            ${this.escapeHtml(reporte.descripcion.length > 100 ? 
              reporte.descripcion.substring(0, 100) + '...' : 
              reporte.descripcion)}
          </p>
          <div style="font-size: 11px; color: #9ca3af; line-height: 1.4;">
            <div style="margin-bottom: 2px;">📅 ${fecha}</div>
            <div style="margin-bottom: 2px;">👤 ${this.escapeHtml(autor)}</div>
            <div style="margin-bottom: 2px;">📍 ${this.escapeHtml(reporte.ciudad)}</div>
            <div style="margin-bottom: 2px;">📊 Estado: <span style="font-weight: 600; color: ${this.obtenerColorPorEstado(reporte.estadoActual)};">${reporte.estadoActual}</span></div>
            ${reporte.contadorImportante > 0 ? 
              `<div>⭐ ${reporte.contadorImportante} personas lo marcaron como importante</div>` : ''}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error creando popup:', error);
      return '<div style="padding: 10px;">Error mostrando información del reporte</div>';
    }
  }

  /**
   * Escapar HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Obtener color del marcador según estado del reporte
   */
  private obtenerColorPorEstado(estado: string): string {
    const coloresPorEstado: { [key: string]: string } = {
      'PENDIENTE': '#f59e0b', // Amarillo/Naranja
      'EN_PROCESO': '#3b82f6', // Azul
      'RESUELTO': '#10b981', // Verde
      'RECHAZADO': '#ef4444', // Rojo
      'CERRADO': '#6b7280' // Gris
    };

    return coloresPorEstado[estado?.toUpperCase()] || '#ef4444';
  }

  /**
   * Limpiar todos los marcadores del mapa o solo los temporales
   */
  public limpiarMarcadores(soloTemporales: boolean = false): void {
    console.log(`🧹 Limpiando marcadores... ${soloTemporales ? '(solo temporales)' : '(todos)'}`);
    
    if (soloTemporales) {
      for (let i = this.marcadores.length - 1; i >= 0; i--) {
        const marcador = this.marcadores[i];
        if ((marcador as any).isTemporary) {
          marcador.remove();
          this.marcadores.splice(i, 1);
        }
      }
    } else {
      this.marcadores.forEach(marcador => {
        try {
          marcador.remove();
        } catch (error) {
          console.warn('Advertencia removiendo marcador:', error);
        }
      });
      this.marcadores = [];
    }
    
    console.log(`✅ Marcadores limpiados. Restantes: ${this.marcadores.length}`);
  }

  /**
   * Centrar mapa en coordenadas específicas
   */
  public centrarMapa(coordenadas: mapboxgl.LngLatLike, zoom: number = 15): void {
    if (!this.mapa) {
      console.warn('⚠️ Mapa no inicializado para centrar');
      return;
    }

    if (!this.mapa.loaded()) {
      console.warn('⚠️ Mapa aún no está cargado');
      return;
    }
    
    console.log('🎯 Centrando mapa en:', coordenadas, 'zoom:', zoom);
    
    this.mapa.flyTo({
      center: coordenadas,
      zoom: zoom,
      duration: 1500,
      essential: true
    });
  }

  /**
   * Obtener coordenadas actuales del centro del mapa
   */
  public obtenerCentroMapa(): Coordenadas | null {
    if (!this.mapa || !this.mapa.loaded()) return null;
    
    const centro = this.mapa.getCenter();
    return {
      lng: Number(centro.lng.toFixed(6)),
      lat: Number(centro.lat.toFixed(6))
    };
  }

  /**
   * Cambiar estilo del mapa
   */
  public cambiarEstiloMapa(estilo: string): void {
    if (!this.mapa || !this.mapa.loaded()) {
      console.warn('⚠️ Mapa no disponible para cambiar estilo');
      return;
    }
    
    const estilosDisponibles = [
      'mapbox://styles/mapbox/streets-v12',
      'mapbox://styles/mapbox/satellite-v9',
      'mapbox://styles/mapbox/satellite-streets-v12',
      'mapbox://styles/mapbox/light-v11',
      'mapbox://styles/mapbox/dark-v11'
    ];
    
    if (estilosDisponibles.includes(estilo)) {
      console.log('🎨 Cambiando estilo del mapa a:', estilo);
      this.mapa.setStyle(estilo);
    } else {
      console.warn('⚠️ Estilo no válido:', estilo);
    }
  }

  /**
   * Destruir mapa y limpiar recursos
   */
  public destruirMapa(): void {
    console.log('🗑️ Destruyendo mapa...');
    
    if (this.mapa) {
      try {
        this.limpiarMarcadores();
        this.mapa.remove();
        this.mapa = null;
        console.log('✅ Mapa destruido y recursos limpiados');
      } catch (error) {
        console.error('❌ Error destruyendo mapa:', error);
        this.mapa = null;
      }
    }
  }

  /**
   * Verificar si el mapa está inicializado y cargado
   */
  public estaInicializado(): boolean {
    return this.mapa !== null && this.mapa.loaded();
  }

  /**
   * Redimensionar mapa (útil cuando el contenedor cambia de tamaño)
   */
  public redimensionarMapa(): void {
    if (this.mapa && this.mapa.loaded()) {
      console.log('📏 Redimensionando mapa...');
      this.mapa.resize();
    }
  }

  /**
   * Obtener bounds actuales del mapa
   */
  public obtenerBounds(): mapboxgl.LngLatBounds | null {
    if (!this.mapa || !this.mapa.loaded()) return null;
    return this.mapa.getBounds();
  }

  /**
   * Ajustar vista para mostrar todos los marcadores
   */
  public ajustarVistaAMarcadores(): void {
    if (!this.mapa || !this.mapa.loaded() || this.marcadores.length === 0) {
      console.warn('⚠️ No se puede ajustar vista: mapa no disponible o sin marcadores');
      return;
    }

    console.log('🔍 Ajustando vista para mostrar todos los marcadores...');

    try {
      const bounds = new mapboxgl.LngLatBounds();
      
      this.marcadores.forEach(marcador => {
        if (!(marcador as any).isTemporary) {
          const lngLat = marcador.getLngLat();
          bounds.extend(lngLat);
        }
      });

      // Solo ajustar si hay marcadores válidos
      if (!bounds.isEmpty()) {
        this.mapa.fitBounds(bounds, {
          padding: 80,
          maxZoom: 16,
          duration: 1500
        });
        console.log('✅ Vista ajustada a marcadores');
      }
    } catch (error) {
      console.error('❌ Error ajustando vista:', error);
    }
  }

  /**
   * Obtener información del mapa para debugging
   */
  public obtenerInfoMapa(): any {
    if (!this.mapa) return null;
    
    return {
      cargado: this.mapa.loaded(),
      centro: this.mapa.getCenter(),
      zoom: this.mapa.getZoom(),
      estilo: this.mapa.getStyle()?.name,
      marcadores: this.marcadores.length
    };
  }
}