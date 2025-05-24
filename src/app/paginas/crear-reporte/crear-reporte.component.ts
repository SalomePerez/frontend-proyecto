import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { ReporteService, CategoriaBackend } from '../../servicios/reporte.service';
import { AuthService } from '../../servicios/auth.service';

// Interfaces para el frontend
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
  isLoadingCategorias: boolean = false;

  // Datos del backend
  categorias: Categoria[] = [];
  categoriasBackend: CategoriaBackend[] = [];
  fotosSeleccionadas: File[] = [];
  previewUrls: string[] = [];
  prioridadesDisponibles: Array<'baja' | 'media' | 'alta' | 'critica'> = ['baja', 'media', 'alta', 'critica'];
  
  // Mapbox
  map: mapboxgl.Map | null = null;
  marker: mapboxgl.Marker | null = null;
  isMapReady: boolean = false;
  mapError: string = '';
  private readonly MAPBOX_TOKEN = environment.mapboxToken;

  // Estados de progreso
  uploadProgress: number = 0;
  currentUploadStep: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private reporteService: ReporteService,
    private authService: AuthService
  ) {
    console.log('🏗️ Inicializando CrearReporteComponent con backend...');
    this.loadUserData();
    this.configureMapbox();
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Cargando datos del backend...');
    this.loadCategoriasFromBackend();
    this.detectarUbicacionActual();
  }

  ngAfterViewInit(): void {
    console.log('🔄 ngAfterViewInit - Preparando para inicializar mapa si es necesario...');
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

  /**
   * Cargar categorías desde el backend
   */
  private loadCategoriasFromBackend(): void {
    console.log('📋 Cargando categorías desde el backend...');
    this.isLoadingCategorias = true;
    
    this.reporteService.getCategorias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categorias) => {
          console.log('✅ Categorías cargadas del backend:', categorias);
          this.categoriasBackend = categorias;
          this.mapCategoriasToFrontend(categorias);
          this.isLoadingCategorias = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error cargando categorías:', error);
          this.formErrors.categorias = 'Error cargando categorías. Usando categorías por defecto.';
          this.initializeDefaultCategorias();
          this.isLoadingCategorias = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Mapear categorías del backend al formato del frontend
   */
  private mapCategoriasToFrontend(categoriasBackend: CategoriaBackend[]): void {
    const iconosYColores: { [key: string]: { icono: string; color: string; descripcion: string } } = {
      'Seguridad': { 
        icono: 'bi bi-shield-exclamation', 
        color: '#f59e0b',
        descripcion: 'Problemas de seguridad ciudadana (robos, vandalismo, etc.)'
      },
      'Emergencia': { 
        icono: 'bi bi-exclamation-triangle-fill', 
        color: '#ef4444',
        descripcion: 'Situaciones que requieren atención inmediata (accidentes, incendios, etc.)'
      },
      'Infraestructura': { 
        icono: 'bi bi-tools', 
        color: '#3b82f6',
        descripcion: 'Problemas con servicios públicos (semáforos, alumbrado, etc.)'
      },
      'Otros': { 
        icono: 'bi bi-chat-dots', 
        color: '#6b7280',
        descripcion: 'Otras situaciones que requieren atención'
      }
    };

    this.categorias = categoriasBackend.map(categoria => ({
      id: categoria.id,
      nombre: categoria.nombre,
      icono: iconosYColores[categoria.nombre]?.icono || 'bi bi-question-circle',
      color: iconosYColores[categoria.nombre]?.color || '#6b7280',
      descripcion: iconosYColores[categoria.nombre]?.descripcion || 'Categoría de reporte'
    }));

    console.log('🎨 Categorías mapeadas:', this.categorias);
  }

  /**
   * Categorías por defecto en caso de error
   */
  private initializeDefaultCategorias(): void {
    this.categorias = [
      {
        id: 'default-emergencia',
        nombre: 'Emergencia',
        icono: 'bi bi-exclamation-triangle-fill',
        color: '#ef4444',
        descripcion: 'Situaciones que requieren atención inmediata'
      },
      {
        id: 'default-seguridad',
        nombre: 'Seguridad',
        icono: 'bi bi-shield-exclamation',
        color: '#f59e0b',
        descripcion: 'Problemas de seguridad ciudadana'
      },
      {
        id: 'default-infraestructura',
        nombre: 'Infraestructura',
        icono: 'bi bi-tools',
        color: '#3b82f6',
        descripcion: 'Problemas con servicios públicos'
      },
      {
        id: 'default-otros',
        nombre: 'Otros',
        icono: 'bi bi-chat-dots',
        color: '#6b7280',
        descripcion: 'Otras situaciones'
      }
    ];
  }

  private loadUserData(): void {
    try {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        this.reporte.idUsuario = usuario.id;
        console.log('👤 Usuario cargado:', usuario.nombre);
      } else {
        console.warn('⚠️ No se encontró usuario autenticado');
        this.reporte.idUsuario = 'usuario-anonimo-' + Date.now();
      }
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
      this.reporte.idUsuario = 'usuario-error-' + Date.now();
    }
  }

  // NAVEGACIÓN DE PASOS
  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        
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
        // Validaciones opcionales
        break;

      case 4: // Ubicación
        if (!this.reporte.ubicacion.latitud || !this.reporte.ubicacion.longitud) {
          this.formErrors.ubicacion = 'Debe seleccionar una ubicación válida';
          isValid = false;
        }
        break;

      case 5: // Fotos
        // Validar archivos si existen
        if (this.fotosSeleccionadas.length > 0) {
          for (const archivo of this.fotosSeleccionadas) {
            const validacion = this.reporteService.validarArchivoImagen(archivo);
            if (!validacion.valido) {
              this.formErrors.fotos = validacion.error;
              isValid = false;
              break;
            }
          }
        }
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
    console.log('📋 Categoría seleccionada:', categoria);
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
    console.log('🗺️ Inicializando Mapbox...');
    
    if (!this.MAPBOX_TOKEN) {
      this.mapError = 'Token de Mapbox no configurado';
      return;
    }

    const mapElement = document.getElementById('map-container');
    if (!mapElement) {
      setTimeout(() => this.initializeMapbox(), 500);
      return;
    }
    
    if (this.map) {
      return;
    }

    try {
      const rect = mapElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        mapElement.style.width = '100%';
        mapElement.style.height = '400px';
        mapElement.style.minHeight = '400px';
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      this.map = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [this.reporte.ubicacion.longitud, this.reporte.ubicacion.latitud],
        zoom: 15,
        attributionControl: false
      });

      this.map.on('load', () => {
        console.log('✅ Mapa cargado');
        this.agregarControlesMapa();
        this.crearMarcadorInteractivo();
        this.isMapReady = true;
        this.cdr.detectChanges();
      });

      this.map.on('error', (error) => {
        console.error('❌ Error en mapa:', error);
        this.mapError = 'Error cargando el mapa';
        this.cdr.detectChanges();
      });

      this.map.on('click', (e) => {
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
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: false
      });
      
      this.map.addControl(geolocateControl, 'top-right');

      geolocateControl.on('geolocate', (e: any) => {
        this.actualizarUbicacion(e.coords.latitude, e.coords.longitude);
      });

      console.log('✅ Controles agregados');
    } catch (error) {
      console.error('❌ Error agregando controles:', error);
    }
  }

  private crearMarcadorInteractivo(): void {
    if (!this.map) return;

    try {
      this.marker = new mapboxgl.Marker({
        color: '#ef4444',
        draggable: true,
        scale: 1.2
      })
      .setLngLat([this.reporte.ubicacion.longitud, this.reporte.ubicacion.latitud])
      .addTo(this.map);

      this.marker.on('dragend', () => {
        if (this.marker) {
          const lngLat = this.marker.getLngLat();
          this.actualizarUbicacion(lngLat.lat, lngLat.lng);
        }
      });

      console.log('✅ Marcador creado');
    } catch (error) {
      console.error('❌ Error creando marcador:', error);
    }
  }

  private actualizarUbicacion(lat: number, lng: number): void {
    console.log(`📍 Actualizando ubicación: ${lat}, ${lng}`);
    
    this.reporte.ubicacion.latitud = lat;
    this.reporte.ubicacion.longitud = lng;
    
    if (this.marker) {
      this.marker.setLngLat([lng, lat]);
    }
    
    this.obtenerDireccionDeLatLng(lat, lng);
  }

  detectarUbicacionActualEnMapa(): void {
    this.isLoadingLocation = true;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          this.actualizarUbicacion(lat, lng);
          
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
        }
      );
    }
  }

  forceMapInitialization(): void {
    this.destroyMap();
    this.mapError = '';
    setTimeout(() => this.initializeMapbox(), 300);
  }

  private destroyMap(): void {
    if (this.map) {
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
    
    // Limpiar errores previos
    delete this.formErrors.fotos;
    
    files.forEach(file => {
      // Validar archivo
      const validacion = this.reporteService.validarArchivoImagen(file);
      if (!validacion.valido) {
        this.formErrors.fotos = validacion.error;
        return;
      }

      this.fotosSeleccionadas.push(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrls.push(e.target.result);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });

    console.log(`📸 ${this.fotosSeleccionadas.length} foto(s) seleccionada(s)`);
  }

  removePhoto(index: number): void {
    this.fotosSeleccionadas.splice(index, 1);
    this.previewUrls.splice(index, 1);
    delete this.formErrors.fotos;
  }

  // ENVÍO DEL FORMULARIO CON BACKEND
  async submitReporte(): Promise<void> {
    console.log('📤 Iniciando envío de reporte al backend...');
    
    if (!this.validateCurrentStep()) {
      console.warn('⚠️ Validación fallida');
      return;
    }

    if (!this.reporte.ubicacion.latitud || !this.reporte.ubicacion.longitud) {
      this.formErrors.general = 'Debe seleccionar una ubicación válida';
      return;
    }

    // Verificar autenticación antes de proceder
    if (!this.verificarAutenticacion()) {
      return;
    }

    this.isSubmitting = true;
    this.formErrors = {};
    this.uploadProgress = 0;
    this.currentUploadStep = 'Verificando autenticación...';
    this.cdr.detectChanges();

    try {
      // Verificar que tenemos los datos necesarios
      if (!this.reporte.idUsuario && !this.reporte.esAnonimo) {
        const usuario = this.authService.getCurrentUser();
        if (usuario) {
          this.reporte.idUsuario = usuario.id;
        } else {
          throw new Error('No se pudo obtener información del usuario');
        }
      }

      // Usar el servicio para procesar la creación completa
      this.currentUploadStep = 'Procesando reporte...';
      this.uploadProgress = 10;
      this.cdr.detectChanges();

      const reporteId = await this.reporteService.procesarCreacionReporte(
        this.reporte,
        this.fotosSeleccionadas,
        this.reporte.esAnonimo,
        this.reporte.esImportante,
        this.reporte.idUsuario
      );

      console.log('🎉 Reporte creado exitosamente con ID:', reporteId);
      
      this.currentUploadStep = 'Reporte enviado exitosamente';
      this.uploadProgress = 100;
      this.showSuccessMessage = true;
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        this.router.navigate(['/principal-cliente']);
      }, 3000);

    } catch (error: any) {
      console.error('❌ Error enviando reporte:', error);
      
      // Manejar errores específicos de autenticación
      if (error.message.includes('autenticado') || error.message.includes('permisos')) {
        this.formErrors.general = error.message;
        
        // Redirigir al login después de mostrar el error
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: '/crear-reporte' }
          });
        }, 3000);
      } else {
        this.formErrors.general = error.message || 'Error al enviar el reporte. Por favor, inténtalo de nuevo.';
      }
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
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

  // DEBUGGING
  debugInfo(): void {
    console.log('🐛 Estado actual:', {
      currentStep: this.currentStep,
      reporte: this.reporte,
      categorias: this.categorias.length,
      categoriasBackend: this.categoriasBackend.length,
      fotos: this.fotosSeleccionadas.length,
      mapReady: this.isMapReady,
      errors: this.formErrors
    });
  }


  // Método para verificar autenticación antes de enviar
  private verificarAutenticacion(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.formErrors.general = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      
      setTimeout(() => {
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: '/crear-reporte' }
        });
      }, 2000);
      
      return false;
    }

    if (this.authService.isSessionExpiringSoon()) {
      this.formErrors.general = 'Tu sesión ha expirado. Redirigiendo al login...';
      
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: '/crear-reporte' }
        });
      }, 2000);
      
      return false;
    }

    return true;
  }
}