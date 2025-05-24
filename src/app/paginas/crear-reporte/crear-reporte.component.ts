import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

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

// Declaración para Google Maps
declare let google: any;

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
  showLocationSelector: boolean = false;

  // Datos
  categorias: Categoria[] = [];
  fotosSeleccionadas: File[] = [];
  previewUrls: string[] = [];
  prioridadesDisponibles: Array<'baja' | 'media' | 'alta' | 'critica'> = ['baja', 'media', 'alta', 'critica'];
  
  // Mapa
  map: any = null;
  marker: any = null;
  isMapReady: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private router: Router) {
    this.initializeCategorias();
    this.loadUserData();
  }

  ngOnInit(): void {
    this.detectarUbicacionActual();
  }

  ngAfterViewInit(): void {
    // Inicializar mapa cuando se muestre el paso 4 (ubicación)
    setTimeout(() => {
      if (this.currentStep === 4) {
        this.initializeMap();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          this.reporte.idUsuario = user.id || 'user-123'; // ID simulado
        } catch (error) {
          console.warn('Error parsing user data:', error);
          this.reporte.idUsuario = 'user-123'; // ID por defecto
        }
      } else {
        this.reporte.idUsuario = 'user-123'; // ID por defecto
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
          setTimeout(() => this.initializeMap(), 100);
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
        setTimeout(() => this.initializeMap(), 100);
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

      case 5: // Fotos (opcional pero si hay, debe tener al menos una)
        // Las fotos son opcionales según tu diseño de la imagen
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
    // Si es importante, automáticamente establecer prioridad alta
    if (this.reporte.esImportante && this.reporte.prioridad === 'baja') {
      this.reporte.prioridad = 'alta';
    }
  }

  setPrioridad(prioridad: 'baja' | 'media' | 'alta' | 'critica'): void {
    this.reporte.prioridad = prioridad;
    // Si es crítica, automáticamente marcar como importante
    if (prioridad === 'critica') {
      this.reporte.esImportante = true;
    }
  }

  toggleAnonimo(): void {
    this.reporte.esAnonimo = !this.reporte.esAnonimo;
  }

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'baja':
        return '#10b981';
      case 'media':
        return '#f59e0b';
      case 'alta':
        return '#ef4444';
      case 'critica':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  }

  getPrioridadIcon(prioridad: string): string {
    switch (prioridad) {
      case 'baja':
        return 'bi bi-flag';
      case 'media':
        return 'bi bi-flag-fill';
      case 'alta':
        return 'bi bi-exclamation-triangle';
      case 'critica':
        return 'bi bi-exclamation-triangle-fill';
      default:
        return 'bi bi-flag';
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

  // MANEJO DE UBICACIÓN
  private detectarUbicacionActual(): void {
    this.isLoadingLocation = true;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.reporte.ubicacion.latitud = position.coords.latitude;
          this.reporte.ubicacion.longitud = position.coords.longitude;
          this.obtenerDireccionDeLatLng(position.coords.latitude, position.coords.longitude);
          this.isLoadingLocation = false;
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          // Ubicación por defecto (Bogotá)
          this.reporte.ubicacion.latitud = 4.6097;
          this.reporte.ubicacion.longitud = -74.0817;
          this.reporte.ubicacion.direccion = 'Bogotá, Colombia';
          this.isLoadingLocation = false;
        }
      );
    } else {
      // Ubicación por defecto
      this.reporte.ubicacion.latitud = 4.6097;
      this.reporte.ubicacion.longitud = -74.0817;
      this.reporte.ubicacion.direccion = 'Bogotá, Colombia';
      this.isLoadingLocation = false;
    }
  }

  private obtenerDireccionDeLatLng(lat: number, lng: number): void {
    if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: lat, lng: lng } },
        (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            this.reporte.ubicacion.direccion = results[0].formatted_address;
          } else {
            this.reporte.ubicacion.direccion = `${lat}, ${lng}`;
          }
        }
      );
    } else {
      this.reporte.ubicacion.direccion = `${lat}, ${lng}`;
    }
  }

  private initializeMap(): void {
    const mapElement = document.getElementById('map-container');
    if (!mapElement) {
      console.warn('Elemento del mapa no encontrado');
      return;
    }
    
    if (this.map) {
      console.log('Mapa ya inicializado');
      return;
    }

    // Esperar un poco más si Google Maps no está listo
    if (typeof google === 'undefined' || !google.maps) {
      console.log('Google Maps no disponible, reintentando...');
      setTimeout(() => this.initializeMap(), 500);
      return;
    }

    try {
      this.map = new google.maps.Map(mapElement, {
        center: { 
          lat: this.reporte.ubicacion.latitud, 
          lng: this.reporte.ubicacion.longitud 
        },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      this.marker = new google.maps.Marker({
        position: { 
          lat: this.reporte.ubicacion.latitud, 
          lng: this.reporte.ubicacion.longitud 
        },
        map: this.map,
        draggable: true,
        title: 'Ubicación del reporte',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });

      // Actualizar ubicación cuando se mueva el marcador
      this.marker.addListener('dragend', () => {
        const position = this.marker.getPosition();
        this.reporte.ubicacion.latitud = position.lat();
        this.reporte.ubicacion.longitud = position.lng();
        this.obtenerDireccionDeLatLng(position.lat(), position.lng());
      });

      // Permitir hacer clic en el mapa para mover el marcador
      this.map.addListener('click', (event: any) => {
        this.marker.setPosition(event.latLng);
        this.reporte.ubicacion.latitud = event.latLng.lat();
        this.reporte.ubicacion.longitud = event.latLng.lng();
        this.obtenerDireccionDeLatLng(event.latLng.lat(), event.latLng.lng());
      });

      this.isMapReady = true;
      console.log('Mapa inicializado correctamente');
      
    } catch (error) {
      console.error('Error inicializando mapa:', error);
    }
  }

  detectarUbicacionActualEnMapa(): void {
    this.detectarUbicacionActual();
    setTimeout(() => {
      if (this.map && this.marker) {
        const newPosition = { 
          lat: this.reporte.ubicacion.latitud, 
          lng: this.reporte.ubicacion.longitud 
        };
        this.map.setCenter(newPosition);
        this.marker.setPosition(newPosition);
      } else {
        // Si el mapa no existe, lo inicializamos
        this.initializeMap();
      }
    }, 1000);
  }

  // Método para forzar inicialización del mapa
  forceMapInitialization(): void {
    if (this.currentStep === 4) {
      this.map = null; // Reset
      this.marker = null; // Reset
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    }
  }

  // MANEJO DE FOTOS
  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        this.fotosSeleccionadas.push(file);
        
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  removePhoto(index: number): void {
    this.fotosSeleccionadas.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  // ENVÍO DEL FORMULARIO
  async submitReporte(): Promise<void> {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.isSubmitting = true;

    try {
      // Simular subida de fotos
      const fotosUrls: string[] = [];
      for (let i = 0; i < this.fotosSeleccionadas.length; i++) {
        // En producción, aquí subirías las fotos a tu servidor/cloud
        fotosUrls.push(`https://mi-servidor.com/fotos/reporte-${Date.now()}-${i}.jpg`);
      }
      
      this.reporte.fotos = fotosUrls;

      // Simular envío al servidor
      await this.enviarReporteAlServidor(this.reporte);
      
      this.showSuccessMessage = true;
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        this.router.navigate(['/mis-reportes']);
      }, 3000);

    } catch (error) {
      console.error('Error enviando reporte:', error);
      this.formErrors.general = 'Error al enviar el reporte. Por favor, inténtalo de nuevo.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private async enviarReporteAlServidor(reporte: CrearReporteDTO): Promise<void> {
    // Simular llamada HTTP
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Reporte enviado:', reporte);
        resolve();
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
}