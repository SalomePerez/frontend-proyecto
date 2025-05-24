import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MapaService, ReporteDTO, Coordenadas } from '../../servicios/mapa.service';
import { AuthService } from '../../servicios/auth.service';

// Interfaces
interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface UserLocation {
  lat: number;
  lng: number;
  city: string;
}

@Component({
  selector: 'app-principal-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './principal-cliente.component.html',
  styleUrls: ['./principal-cliente.component.css']
})
export class PrincipalClienteComponent implements OnInit, OnDestroy, AfterViewInit {
  
  // Datos del usuario
  userName: string = 'Cliente SegurApp';
  userCity: string = 'Pereira, Colombia';
  userLocation: UserLocation | null = null;
  
  // Estados de la UI
  showUserMenu: boolean = false;
  showNotifications: boolean = false;
  isLoadingMap: boolean = true;
  mapError: string = '';
  
  // Notificaciones
  notifications: Notification[] = [];
  notificationCount: number = 0;
  
  // Reportes para el mapa
  reportes: ReporteDTO[] = [];
  
  // Estilos de mapa disponibles
  estilosMapas = [
    { nombre: 'Calles', valor: 'mapbox://styles/mapbox/streets-v12' },
    { nombre: 'Satélite', valor: 'mapbox://styles/mapbox/satellite-v9' },
    { nombre: 'Híbrido', valor: 'mapbox://styles/mapbox/satellite-streets-v12' },
    { nombre: 'Claro', valor: 'mapbox://styles/mapbox/light-v11' },
    { nombre: 'Oscuro', valor: 'mapbox://styles/mapbox/dark-v11' }
  ];
  
  estiloActual = 0;
  private destroy$ = new Subject<void>();
  private mapaInicializado = false;

  constructor(
    private router: Router,
    public mapaService: MapaService, // Hacer público para acceso desde template
    private authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🏗️ Inicializando PrincipalClienteComponent...');
    this.initializeData();
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Cargando datos iniciales...');
    this.loadUserData();
    this.loadNotifications();
    this.loadReportesMockData();
    this.detectUserLocation();
  }

  ngAfterViewInit(): void {
    console.log('🔄 ngAfterViewInit - Preparando inicialización del mapa...');
    
    // Usar NgZone para optimizar la detección de cambios
    this.ngZone.runOutsideAngular(() => {
      // Múltiples timeouts para asegurar que el DOM esté listo
      setTimeout(() => {
        this.ngZone.run(() => {
          this.initializeMapbox();
        });
      }, 500);
    });
  }

  ngOnDestroy(): void {
    console.log('💀 ngOnDestroy - Limpiando recursos...');
    
    this.mapaService.destruirMapa();
    this.destroy$.next();
    this.destroy$.complete();
    this.mapaInicializado = false;
  }

  /**
   * Inicializar Mapbox usando el servicio
   */
  private async initializeMapbox(): Promise<void> {
    console.log('🗺️ Iniciando inicialización de Mapbox...');
    
    this.isLoadingMap = true;
    this.mapError = '';
    this.cdr.detectChanges();
    
    try {
      // Verificar múltiples veces que el contenedor existe
      let contenedor = document.getElementById('mapbox-map');
      let intentos = 0;
      const maxIntentos = 10;
      
      while (!contenedor && intentos < maxIntentos) {
        console.log(`🔍 Intento ${intentos + 1}: Buscando contenedor del mapa...`);
        await new Promise(resolve => setTimeout(resolve, 200));
        contenedor = document.getElementById('mapbox-map');
        intentos++;
      }
      
      if (!contenedor) {
        throw new Error('Contenedor del mapa no encontrado después de múltiples intentos');
      }

      console.log('📦 Contenedor del mapa encontrado:', contenedor);

      // Verificar dimensiones del contenedor
      const rect = contenedor.getBoundingClientRect();
      console.log('📏 Dimensiones del contenedor:', {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      });

      if (rect.width === 0 || rect.height === 0) {
        console.warn('⚠️ El contenedor tiene dimensiones 0, aplicando dimensiones mínimas...');
        contenedor.style.width = '100%';
        contenedor.style.height = '400px';
        contenedor.style.minHeight = '400px';
        
        // Esperar un momento después de aplicar estilos
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Crear mapa usando el servicio
      console.log('🎯 Creando mapa con MapaService...');
      await this.mapaService.crearMapa('mapbox-map');
      
      console.log('✅ Mapa Mapbox inicializado correctamente');
      this.mapaInicializado = true;
      
      // Cargar reportes en el mapa después de un momento
      setTimeout(async () => {
        await this.cargarReportesEnMapa();
        this.configurarClickListener();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error inicializando Mapbox:', error);
      this.mapError = this.getErrorMessage(error);
      this.mapaInicializado = false;
    } finally {
      this.isLoadingMap = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Obtener mensaje de error amigable
   */
  private getErrorMessage(error: any): string {
    console.log('🔍 Analizando error:', error);
    
    const message = error?.message || error?.toString() || 'Error desconocido';
    
    if (message.includes('token') || message.includes('Unauthorized')) {
      return 'Token de Mapbox no válido. Verifica tu configuración.';
    } else if (message.includes('network') || message.includes('fetch') || message.includes('NetworkError')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    } else if (message.includes('contenedor') || message.includes('container')) {
      return 'Error en el contenedor del mapa. Intenta recargar la página.';
    } else if (message.includes('timeout') || message.includes('Timeout')) {
      return 'El mapa tardó mucho en cargar. Verifica tu conexión.';
    } else {
      return `Error cargando el mapa: ${message}`;
    }
  }

  /**
   * Configurar listener para clicks en el mapa
   */
  private configurarClickListener(): void {
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ No se puede configurar click listener: mapa no inicializado');
      return;
    }

    console.log('👆 Configurando listener de clicks...');
    
    this.mapaService.agregarMarcador()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coordenadas: Coordenadas) => {
          console.log('📍 Click en mapa detectado:', coordenadas);
          // Aquí puedes manejar clicks en el mapa si es necesario
          // Por ejemplo, para crear nuevos reportes
        },
        error: (error) => {
          console.error('❌ Error en click del mapa:', error);
        }
      });
  }

  /**
   * Cargar reportes en el mapa
   */
  private async cargarReportesEnMapa(): Promise<void> {
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ No se pueden cargar reportes: mapa no inicializado');
      return;
    }

    try {
      if (this.reportes.length > 0) {
        console.log(`📍 Cargando ${this.reportes.length} reportes en el mapa`);
        
        // Pintar marcadores
        this.mapaService.pintarMarcadores(this.reportes);
        
        // Ajustar vista para mostrar todos los reportes después de un momento
        setTimeout(() => {
          if (this.mapaService.estaInicializado()) {
            this.mapaService.ajustarVistaAMarcadores();
          }
        }, 2000);
      } else {
        console.log('⚠️ No hay reportes para mostrar en el mapa');
      }
    } catch (error) {
      console.error('❌ Error cargando reportes en el mapa:', error);
    }
  }

  /**
   * Cargar datos de ejemplo de reportes con coordenadas válidas
   */
  private loadReportesMockData(): void {
    this.reportes = [
      {
        id: '1',
        titulo: 'Semáforo dañado en Av. Circunvalar',
        descripcion: 'El semáforo de la intersección Circunvalar con Calle 15 no está funcionando correctamente, causando problemas de tráfico en horas pico.',
        fecha: new Date().toISOString(),
        contadorImportante: 3,
        idUsuario: 'user1',
        ubicacion: {
          latitud: 4.8143,
          longitud: -75.6946
        },
        fotos: [],
        estadoActual: 'PENDIENTE',
        ciudad: 'PEREIRA',
        comentarios: [],
        esAnonimo: false,
        nombreUsuario: 'Juan Pérez'
      },
      {
        id: '2',
        titulo: 'Robo a mano armada',
        descripcion: 'Se reportó un robo a mano armada en esta zona durante la madrugada. Las autoridades ya fueron notificadas.',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        contadorImportante: 8,
        idUsuario: 'user2',
        ubicacion: {
          latitud: 4.8093,
          longitud: -75.6906
        },
        fotos: [],
        estadoActual: 'EN_PROCESO',
        ciudad: 'PEREIRA',
        comentarios: [],
        esAnonimo: false,
        nombreUsuario: 'María García'
      },
      {
        id: '3',
        titulo: 'Hueco profundo en Carrera 15',
        descripcion: 'Hueco profundo en la carrera 15 con calle 18 que puede causar accidentes a los vehículos, especialmente motocicletas.',
        fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        contadorImportante: 1,
        idUsuario: 'user3',
        ubicacion: {
          latitud: 4.8113,
          longitud: -75.6976
        },
        fotos: [],
        estadoActual: 'RESUELTO',
        ciudad: 'PEREIRA',
        comentarios: [],
        esAnonimo: true
      },
      {
        id: '4',
        titulo: 'Ruido excesivo - Construcción',
        descripcion: 'Construcción con ruido excesivo en horarios no permitidos (después de las 6 PM), afecta el descanso de los vecinos del sector.',
        fecha: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        contadorImportante: 5,
        idUsuario: 'user4',
        ubicacion: {
          latitud: 4.8163,
          longitud: -75.6856
        },
        fotos: [],
        estadoActual: 'RECHAZADO',
        ciudad: 'PEREIRA',
        comentarios: [],
        esAnonimo: false,
        nombreUsuario: 'Carlos López'
      },
      {
        id: '5',
        titulo: 'Alumbrado público deficiente',
        descripcion: 'Varias luminarias del sector están fundidas, generando inseguridad durante las horas nocturnas.',
        fecha: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        contadorImportante: 2,
        idUsuario: 'user5',
        ubicacion: {
          latitud: 4.8053,
          longitud: -75.6926
        },
        fotos: [],
        estadoActual: 'PENDIENTE',
        ciudad: 'PEREIRA',
        comentarios: [],
        esAnonimo: false,
        nombreUsuario: 'Ana Rodríguez'
      }
    ];
    
    console.log(`📊 Cargados ${this.reportes.length} reportes de ejemplo con coordenadas válidas`);
  }

  private initializeData(): void {
    this.notifications = [
      {
        id: 1,
        type: 'info',
        title: 'Nuevo reporte cercano',
        message: 'Se ha reportado un incidente de seguridad a 2 cuadras de tu ubicación.',
        time: 'Hace 5 minutos',
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: 'Reporte actualizado',
        message: 'Tu reporte #123 ha sido verificado por las autoridades.',
        time: 'Hace 1 hora',
        read: false
      },
      {
        id: 3,
        type: 'warning',
        title: 'Alerta de zona',
        message: 'Aumento de reportes en el sector La María. Mantente alerta.',
        time: 'Hace 3 horas',
        read: true
      }
    ];
    
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  private loadUserData(): void {
    try {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        this.userName = usuario.nombre || 'Cliente SegurApp';
      }
    } catch (error) {
      console.warn('Error cargando datos del usuario:', error);
    }
    
    this.userLocation = {
      lat: 4.8143,
      lng: -75.6946,
      city: 'Pereira, Colombia'
    };
    this.userCity = 'Pereira, Colombia';
  }

  private loadNotifications(): void {
    console.log('📬 Notificaciones cargadas:', this.notifications.length);
  }

  private detectUserLocation(): void {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocalización no soportada por este navegador');
      return;
    }

    console.log('📍 Solicitando ubicación del usuario...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: 'Ubicación actual'
        };
        console.log('✅ Ubicación del usuario detectada:', this.userLocation);
        
        // Centrar mapa en la nueva ubicación si ya está inicializado
        if (this.mapaService.estaInicializado()) {
          this.mapaService.centrarMapa([this.userLocation.lng, this.userLocation.lat], 15);
        }
      },
      (error) => {
        console.warn('⚠️ Error obteniendo ubicación:', error.message);
        // Mantener ubicación por defecto
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  }

  // === MÉTODOS DE NAVEGACIÓN ===
  goToReportes(): void {
    console.log('🧭 Navegando a reportes...');
    this.router.navigate(['/mis-reportes']);
  }

  goToReportar(): void {
    console.log('🧭 Navegando a crear reporte...');
    this.router.navigate(['/crear-reporte']);
  }

  goToMisReportes(): void {
    console.log('🧭 Navegando a mis reportes...');
    this.router.navigate(['/mis-reportes']);
  }

  // ✅ MÉTODO CLAVE: Navegación a reportes propios
  goToReportesPropios(): void {
    this.router.navigate(['/reportes-propios']);
  }

  goToProfile(): void {
    this.closeAllMenus();
    console.log('🧭 Navegando a perfil...');
    this.router.navigate(['/perfil-cliente']);
  }

  goToSettings(): void {
    this.closeAllMenus();
    console.log('🧭 Navegando a configuración...');
    // this.router.navigate(['/configuracion']);
  }

  // === MÉTODOS DE UI ===
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
      this.markNotificationsAsRead();
    }
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  closeAllMenus(): void {
    this.showUserMenu = false;
    this.showNotifications = false;
  }

  private markNotificationsAsRead(): void {
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
      }
    });
    this.notificationCount = 0;
  }

  // === MÉTODOS DEL MAPA ===
  centerMap(): void {
    console.log('🎯 Centrando mapa en ubicación del usuario...');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ No se puede centrar el mapa: mapa no inicializado');
      return;
    }
    
    if (this.userLocation) {
      this.mapaService.centrarMapa([this.userLocation.lng, this.userLocation.lat], 16);
    } else {
      console.warn('⚠️ No se puede centrar el mapa: ubicación no disponible');
      // Usar ubicación por defecto
      this.mapaService.centrarMapa([-75.6946, 4.8143], 14);
    }
  }

  toggleMapType(): void {
    console.log('🗺️ Cambiando estilo del mapa...');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ Mapa no inicializado para cambiar estilo');
      return;
    }
    
    this.estiloActual = (this.estiloActual + 1) % this.estilosMapas.length;
    const nuevoEstilo = this.estilosMapas[this.estiloActual];
    
    this.mapaService.cambiarEstiloMapa(nuevoEstilo.valor);
    console.log(`✅ Mapa cambiado a estilo: ${nuevoEstilo.nombre}`);
  }

  async refreshReports(): Promise<void> {
    console.log('🔄 Actualizando reportes en el mapa...');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ Mapa no inicializado para actualizar reportes');
      return;
    }
    
    this.isLoadingMap = true;
    this.cdr.detectChanges();
    
    try {
      // Limpiar marcadores existentes
      this.mapaService.limpiarMarcadores();
      
      // Simular carga de nuevos datos
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // En producción, hacer petición al backend para obtener reportes actualizados
      this.loadReportesMockData();
      await this.cargarReportesEnMapa();
      
      console.log('✅ Reportes actualizados exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando reportes:', error);
    } finally {
      this.isLoadingMap = false;
      this.cdr.detectChanges();
    }
  }

  requestLocation(): void {
    console.log('📍 Solicitando permisos de ubicación...');
    this.detectUserLocation();
  }

  /**
   * Reintentar inicializar el mapa
   */
  retryMapInitialization(): void {
    console.log('🔄 Reintentando inicializar mapa...');
    this.mapError = '';
    this.mapaInicializado = false;
    this.initializeMapbox();
  }

  // === MÉTODOS DE UTILIDAD ===
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info': return 'bi bi-info-circle';
      case 'success': return 'bi bi-check-circle';
      case 'warning': return 'bi bi-exclamation-triangle';
      case 'error': return 'bi bi-x-circle';
      default: return 'bi bi-bell';
    }
  }

  logout(): void {
    console.log('👋 Cerrando sesión...');
    
    try {
      this.mapaService.destruirMapa();
      this.authService.logout();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error durante logout:', error);
      // Navegar de todas formas
      this.router.navigate(['/home']);
    }
  }

  // === MÉTODOS DE FILTRADO DE REPORTES ===
  filtrarReportesPorEstado(estado: string): void {
    console.log(`🔍 Filtrando reportes por estado: ${estado}`);
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ Mapa no inicializado para filtrar');
      return;
    }
    
    const reportesFiltrados = this.reportes.filter(r => r.estadoActual === estado);
    console.log(`📊 Reportes filtrados: ${reportesFiltrados.length}/${this.reportes.length}`);
    
    this.mapaService.limpiarMarcadores();
    
    if (reportesFiltrados.length > 0) {
      this.mapaService.pintarMarcadores(reportesFiltrados);
      
      setTimeout(() => {
        if (this.mapaService.estaInicializado()) {
          this.mapaService.ajustarVistaAMarcadores();
        }
      }, 500);
    }
  }

  mostrarTodosLosReportes(): void {
    console.log('📍 Mostrando todos los reportes');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ Mapa no inicializado para mostrar todos los reportes');
      return;
    }
    
    this.mapaService.limpiarMarcadores();
    this.cargarReportesEnMapa();
  }

  /**
   * Método para debugging - obtener información del mapa
   */
  debugMapInfo(): void {
    const info = this.mapaService.obtenerInfoMapa();
    console.log('🐛 Información del mapa:', info);
    console.log('🐛 Estado del componente:', {
      isLoadingMap: this.isLoadingMap,
      mapError: this.mapError,
      mapaInicializado: this.mapaInicializado,
      reportes: this.reportes.length
    });
  }
}