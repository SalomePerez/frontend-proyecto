import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

// Interfaces basadas en tu DTO
interface UbicacionDTO {
  latitud: number;
  longitud: number;
  direccion: string;
}

interface CrearReporteDTO {
  titulo: string;
  descripcion: string;
  fotos: string[];
  categoria: string;
  ubicacion: UbicacionDTO;
  idUsuario: string;
  esImportante: boolean;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'rechazado';
  esAnonimo: boolean;
}

interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  descripcion: string;
}

@Component({
  selector: 'app-crear-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-reporte.component.html',
  styleUrls: ['./crear-reporte.component.css']
})
export class CrearReporteComponent implements OnInit, OnDestroy, AfterViewInit {

  // Datos del formulario
  reporte: CrearReporteDTO = {
    titulo: '',
    descripcion: '',
    fotos: [],
    categoria: '',
    ubicacion: {
      latitud: 0,
      longitud: 0,
      direccion: ''
    },
    idUsuario: '',
    esImportante: false,
    prioridad: 'media',
    estado: 'pendiente',
    esAnonimo: false
  };

  // Estados del formulario
  isSubmitting: boolean = false;
  showSuccessMessage: boolean = false;
  formErrors: any = {};
  
  // Estados de la UI
  currentStep: number = 1;
  totalSteps: number = 5;
  isLoadingLocation: boolean = false;

  // Datos
  categorias: Categoria[] = [];
  fotosSeleccionadas: File[] = [];
  previewUrls: string[] = [];
  prioridadesDisponibles: Array<'baja' | 'media' | 'alta' | 'critica'> = ['baja', 'media', 'alta', 'critica'];
  
  // Mapbox
  map: mapboxgl.Map | null = null;
  marker: mapboxgl.Marker | null = null;
  isMapReady: boolean = false;
  mapError: string = '';
  private readonly MAPBOX_TOKEN = environment.mapboxToken;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🏗️ Inicializando CrearReporteComponent...');
    this.initializeCategorias();
    this.loadUserData();
    this.configureMapbox();
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Detectando ubicación inicial...');
    this.detectarUbicacionActual();
  }

  ngAfterViewInit(): void {
    console.log('🔄 ngAfterViewInit - Preparando para inicializar mapa si es necesario...');
    // El mapa se inicializará cuando se llegue al paso 4
  }

  ngOnDestroy(): void {
    console.log('💀 ngOnDestroy - Limpiando recursos...');
    this.destroyMap();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configureMapbox(): void {
    if (this.MAPBOX_TOKEN) {
      mapboxgl.accessToken = this.MAPBOX_TOKEN;
      console.log('✅ Token de Mapbox configurado');
    } else {
      console.error('❌ Token de Mapbox no encontrado en environment');
      this.mapError = 'Token de Mapbox no configurado';
    }
  }

  private initializeCategorias(): void {
    this.categorias = [
      {
        id: 'emergencia',
        nombre: 'Emergencia',
        icono: 'bi bi-exclamation-triangle-fill',
        color: '#ef4444',
        descripcion: 'Situaciones que requieren atención inmediata (accidentes, incendios, etc.)'
      },
      {
        id: 'seguridad',
        nombre: 'Seguridad',
        icono: 'bi bi-shield-exclamation',
        color: '#f59e0b',
        descripcion: 'Problemas de seguridad ciudadana (robos, vandalismo, etc.)'
      },
      {
        id: 'infraestructura',
        nombre: 'Infraestructura',
        icono: 'bi bi-tools',
        color: '#3b82f6',
        descripcion: 'Problemas con servicios públicos (semáforos, alumbrado, etc.)'
      },
      {
        id: 'otros',
        nombre: 'Otros',
        icono: 'bi bi-chat-dots',
        color: '#6b7280',
        descripcion: 'Otras situaciones que requieren atención'
      }
    ];
  }

  private loadUserData(): void {
    if (typeof Storage !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.reporte.idUsuario = user.id || 'user-123';
        } catch (error) {
          console.warn('Error parsing user data:', error);
          this.reporte.idUsuario = 'user-123';
        }
      } else {
        this.reporte.idUsuario = 'user-123';
      }
    }
  }

  // NAVEGACIÓN DE PASOS
  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        
        // Inicializar mapa cuando llegue al paso 4 (ubicación)
        if (this.currentStep === 4) {
          setTimeout(() => this.initializeMapbox(), 300);
        }
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.validateStepsUpTo(step - 1)) {
      this.currentStep = step;
      if (step === 4) {
        setTimeout(() => this.initializeMapbox(), 300);
      }
    }
  }

  private validateCurrentStep(): boolean {
    this.formErrors = {};
    let isValid = true;

    switch (this.currentStep) {
      case 1: // Información básica
        if (!this.reporte.titulo.trim()) {
          this.formErrors.titulo = 'El título es obligatorio';
          isValid = false;
        } else if (this.reporte.titulo.length > 150) {
          this.formErrors.titulo = 'El título no puede exceder 150 caracteres';
          isValid = false;
        }

        if (!this.reporte.descripcion.trim()) {
          this.formErrors.descripcion = 'La descripción es obligatoria';
          isValid = false;
        } else if (this.reporte.descripcion.length > 400) {
          this.formErrors.descripcion = 'La descripción no puede exceder 400 caracteres';
          isValid = false;
        }
        break;

      case 2: // Categoría
        if (!this.reporte.categoria) {
          this.formErrors.categoria = 'Debe seleccionar una categoría';
          isValid = false;
        }
        break;

      case 3: // Prioridad y configuraciones
        // Validaciones opcionales, ya que tienen valores por defecto
        break;

      case 4: // Ubicación
        if (!this.reporte.ubicacion.direccion.trim()) {
          this.formErrors.ubicacion = 'Debe seleccionar una ubicación';
          isValid = false;
        }
        break;

      case 5: // Fotos (opcional)
        // Las fotos son opcionales
        break;
    }

    return isValid;
  }

  private validateStepsUpTo(step: number): boolean {
    const currentStepBackup = this.currentStep;
    for (let i = 1; i <= step; i++) {
      this.currentStep = i;
      if (!this.validateCurrentStep()) {
        this.currentStep = currentStepBackup;
        return false;
      }
    }
    this.currentStep = currentStepBackup;
    return true;
  }

  // MANEJO DE PRIORIDAD Y CONFIGURACIONES
  toggleImportante(): void {
    this.reporte.esImportante = !this.reporte.esImportante;
    if (this.reporte.esImportante && this.reporte.prioridad === 'baja') {
      this.reporte.prioridad = 'alta';
    }
  }

  setPrioridad(prioridad: 'baja' | 'media' | 'alta' | 'critica'): void {
    this.reporte.prioridad = prioridad;
    if (prioridad === 'critica') {
      this.reporte.esImportante = true;
    }
  }

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'baja': return '#10b981';
      case 'media': return '#f59e0b';
      case 'alta': return '#ef4444';
      case 'critica': return '#dc2626';
      default: return '#6b7280';
    }
  }

  getPrioridadIcon(prioridad: string): string {
    switch (prioridad) {
      case 'baja': return 'bi bi-flag';
      case 'media': return 'bi bi-flag-fill';
      case 'alta': return 'bi bi-exclamation-triangle';
      case 'critica': return 'bi bi-exclamation-triangle-fill';
      default: return 'bi bi-flag';
    }
  }

  getEstadoInfo(estado: string): { color: string, icon: string, texto: string } {
    switch (estado) {
      case 'pendiente':
        return { color: '#f59e0b', icon: 'bi bi-clock', texto: 'Pendiente de Revisión' };
      case 'en_proceso':
        return { color: '#3b82f6', icon: 'bi bi-gear', texto: 'En Proceso' };
      case 'resuelto':
        return { color: '#10b981', icon: 'bi bi-check-circle', texto: 'Resuelto' };
      case 'rechazado':
        return { color: '#ef4444', icon: 'bi bi-x-circle', texto: 'Rechazado' };
      default:
        return { color: '#6b7280', icon: 'bi bi-question-circle', texto: 'Desconocido' };
    }
  }

  selectCategoria(categoria: Categoria): void {
    this.reporte.categoria = categoria.id;
  }

  getCategoriaSeleccionada(): Categoria | undefined {
    return this.categorias.find(c => c.id === this.reporte.categoria);
  }

  // MANEJO DE UBICACIÓN CON MAPBOX
  private detectarUbicacionActual(): void {
    console.log('📍 Detectando ubicación actual...');
    this.isLoadingLocation = true;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Ubicación detectada:', position.coords);
          this.reporte.ubicacion.latitud = position.coords.latitude;
          this.reporte.ubicacion.longitud = position.coords.longitude;
          this.obtenerDireccionDeLatLng(position.coords.latitude, position.coords.longitude);
          this.isLoadingLocation = false;
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('❌ Error obteniendo ubicación:', error);
          // Ubicación por defecto (Pereira, Colombia)
          this.reporte.ubicacion.latitud = 4.8143;
          this.reporte.ubicacion.longitud = -75.6946;
          this.reporte.ubicacion.direccion = 'Pereira, Colombia (Ubicación por defecto)';
          this.isLoadingLocation = false;
          this.cdr.detectChanges();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      console.warn('⚠️ Geolocalización no disponible');
      this.reporte.ubicacion.latitud = 4.8143;
      this.reporte.ubicacion.longitud = -75.6946;
      this.reporte.ubicacion.direccion = 'Pereira, Colombia (Ubicación por defecto)';
      this.isLoadingLocation = false;
      this.cdr.detectChanges();
    }
  }

  private async obtenerDireccionDeLatLng(lat: number, lng: number): Promise<void> {
    try {
      console.log(`🔍 Obteniendo dirección para: ${lat}, ${lng}`);
      
      // Usar Mapbox Geocoding API para obtener la dirección
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.MAPBOX_TOKEN}&language=es`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          this.reporte.ubicacion.direccion = data.features[0].place_name;
          console.log('✅ Dirección obtenida:', this.reporte.ubicacion.direccion);
        } else {
          this.reporte.ubicacion.direccion = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      } else {
        console.warn('⚠️ Error en geocoding, usando coordenadas');
        this.reporte.ubicacion.direccion = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } catch (error) {
      console.error('❌ Error en geocoding:', error);
      this.reporte.ubicacion.direccion = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } finally {
      this.cdr.detectChanges();
    }
  }

  private async initializeMapbox(): Promise<void> {
    console.log('🗺️ Inicializando Mapbox para crear reporte...');
    
    if (!this.MAPBOX_TOKEN) {
      this.mapError = 'Token de Mapbox no configurado';
      console.error('❌ Token de Mapbox no disponible');
      return;
    }

    const mapElement = document.getElementById('map-container');
    if (!mapElement) {
      console.warn('⚠️ Elemento del mapa no encontrado, reintentando...');
      setTimeout(() => this.initializeMapbox(), 500);
      return;
    }
    
    if (this.map) {
      console.log('✅ Mapa ya inicializado');
      return;
    }

    try {
      // Verificar dimensiones del contenedor
      const rect = mapElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.warn('⚠️ Contenedor sin dimensiones, aplicando estilos...');
        mapElement.style.width = '100%';
        mapElement.style.height = '400px';
        mapElement.style.minHeight = '400px';
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('📦 Creando instancia de mapa Mapbox...');
      
      this.map = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [this.reporte.ubicacion.longitud, this.reporte.ubicacion.latitud],
        zoom: 15,
        attributionControl: false
      });

      // Eventos del mapa
      this.map.on('load', () => {
        console.log('✅ Mapa Mapbox cargado para crear reporte');
        this.agregarControlesMapa();
        this.crearMarcadorInteractivo();
        this.isMapReady = true;
        this.cdr.detectChanges();
      });

      this.map.on('error', (error) => {
        console.error('❌ Error en mapa Mapbox:', error);
        this.mapError = 'Error cargando el mapa. Verifica tu conexión.';
        this.cdr.detectChanges();
      });

      // Configurar clicks en el mapa
      this.map.on('click', (e) => {
        console.log('👆 Click en mapa detectado:', e.lngLat);
        this.actualizarUbicacion(e.lngLat.lat, e.lngLat.lng);
      });

    } catch (error) {
      console.error('❌ Error inicializando Mapbox:', error);
      this.mapError = 'Error inicializando el mapa';
      this.cdr.detectChanges();
    }
  }

  private agregarControlesMapa(): void {
    if (!this.map) return;

    try {
      // Control de navegación
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Control de geolocalización
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: false,
        showUserHeading: false
      });
      
      this.map.addControl(geolocateControl, 'top-right');

      // Listener para el control de geolocalización
      geolocateControl.on('geolocate', (e: any) => {
        console.log('📍 Geolocalización activada:', e.coords);
        this.actualizarUbicacion(e.coords.latitude, e.coords.longitude);
      });

      console.log('✅ Controles de mapa agregados');
    } catch (error) {
      console.error('❌ Error agregando controles:', error);
    }
  }

  private crearMarcadorInteractivo(): void {
    if (!this.map) return;

    try {
      // Crear marcador draggable
      this.marker = new mapboxgl.Marker({
        color: '#ef4444',
        draggable: true,
        scale: 1.2
      })
      .setLngLat([this.reporte.ubicacion.longitud, this.reporte.ubicacion.latitud])
      .addTo(this.map);

      // Listener para cuando se mueva el marcador
      this.marker.on('dragend', () => {
        if (this.marker) {
          const lngLat = this.marker.getLngLat();
          console.log('🔄 Marcador movido a:', lngLat);
          this.actualizarUbicacion(lngLat.lat, lngLat.lng);
        }
      });

      console.log('✅ Marcador interactivo creado');
    } catch (error) {
      console.error('❌ Error creando marcador:', error);
    }
  }

  private actualizarUbicacion(lat: number, lng: number): void {
    console.log(`📍 Actualizando ubicación a: ${lat}, ${lng}`);
    
    // Actualizar datos del reporte
    this.reporte.ubicacion.latitud = lat;
    this.reporte.ubicacion.longitud = lng;
    
    // Mover marcador si existe
    if (this.marker) {
      this.marker.setLngLat([lng, lat]);
    }
    
    // Obtener dirección
    this.obtenerDireccionDeLatLng(lat, lng);
  }

  detectarUbicacionActualEnMapa(): void {
    console.log('🎯 Detectando ubicación actual en mapa...');
    this.isLoadingLocation = true;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          console.log('✅ Nueva ubicación:', lat, lng);
          
          this.actualizarUbicacion(lat, lng);
          
          // Centrar mapa en nueva ubicación
          if (this.map) {
            this.map.flyTo({
              center: [lng, lat],
              zoom: 16,
              duration: 1500
            });
          }
          
          this.isLoadingLocation = false;
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('❌ Error detectando ubicación:', error);
          this.isLoadingLocation = false;
          this.cdr.detectChanges();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.warn('⚠️ Geolocalización no disponible');
      this.isLoadingLocation = false;
      this.cdr.detectChanges();
    }
  }

  forceMapInitialization(): void {
    console.log('🔄 Forzando reinicialización del mapa...');
    this.destroyMap();
    this.mapError = '';
    setTimeout(() => {
      this.initializeMapbox();
    }, 300);
  }

  private destroyMap(): void {
    if (this.map) {
      console.log('🗑️ Destruyendo mapa...');
      try {
        if (this.marker) {
          this.marker.remove();
          this.marker = null;
        }
        this.map.remove();
        this.map = null;
        this.isMapReady = false;
      } catch (error) {
        console.error('❌ Error destruyendo mapa:', error);
        this.map = null;
        this.marker = null;
        this.isMapReady = false;
      }
    }
  }

  // MANEJO DE FOTOS
  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    
    files.forEach(file => {
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB max
        this.fotosSeleccionadas.push(file);
        
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      } else {
        console.warn('⚠️ Archivo inválido o muy grande:', file.name);
      }
    });
  }

  removePhoto(index: number): void {
    this.fotosSeleccionadas.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  // ENVÍO DEL FORMULARIO
  async submitReporte(): Promise<void> {
    console.log('📤 Enviando reporte...');
    
    if (!this.validateCurrentStep()) {
      console.warn('⚠️ Validación fallida');
      return;
    }

    if (!this.reporte.ubicacion.latitud || !this.reporte.ubicacion.longitud) {
      this.formErrors.general = 'Debe seleccionar una ubicación válida';
      return;
    }

    this.isSubmitting = true;
    this.formErrors = {};

    try {
      // Simular subida de fotos
      const fotosUrls: string[] = [];
      for (let i = 0; i < this.fotosSeleccionadas.length; i++) {
        // En producción, aquí subirías las fotos a tu servidor/cloud
        fotosUrls.push(`https://mi-servidor.com/fotos/reporte-${Date.now()}-${i}.jpg`);
      }
      
      this.reporte.fotos = fotosUrls;

      // Agregar timestamp
      const reporteCompleto = {
        ...this.reporte,
        fechaCreacion: new Date().toISOString(),
        ip: 'xxx.xxx.xxx.xxx', // En producción, obtener IP real
        userAgent: navigator.userAgent
      };

      console.log('📋 Reporte a enviar:', reporteCompleto);

      // Simular envío al servidor
      await this.enviarReporteAlServidor(reporteCompleto);
      
      this.showSuccessMessage = true;
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        this.router.navigate(['/principal-cliente']);
      }, 3000);

    } catch (error) {
      console.error('❌ Error enviando reporte:', error);
      this.formErrors.general = 'Error al enviar el reporte. Por favor, inténtalo de nuevo.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  private async enviarReporteAlServidor(reporte: any): Promise<void> {
    // Simular llamada HTTP
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% de éxito
          console.log('✅ Reporte enviado exitosamente:', reporte);
          resolve();
        } else {
          reject(new Error('Error simulado del servidor'));
        }
      }, 2000);
    });
  }

  // NAVEGACIÓN
  goBack(): void {
    this.router.navigate(['/principal-cliente']);
  }

  // UTILIDADES
  getStepClass(step: number): string {
    if (step < this.currentStep) return 'completed';
    if (step === this.currentStep) return 'active';
    return 'pending';
  }

  isStepAccessible(step: number): boolean {
    return step <= this.currentStep || this.validateStepsUpTo(step - 1);
  }

  // Método para debugging
  debugInfo(): void {
    console.log('🐛 Estado del componente:', {
      currentStep: this.currentStep,
      mapReady: this.isMapReady,
      mapError: this.mapError,
      ubicacion: this.reporte.ubicacion,
      hasMap: !!this.map,
      hasMarker: !!this.marker
    });
  }
}