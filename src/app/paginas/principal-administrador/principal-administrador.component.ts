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

interface EstadisticasAdmin {
  totalReportes: number;
  reportesPendientes: number;
  reportesEnProceso: number;
  reportesResueltos: number;
  reportesRechazados: number;
  reportesDelDia: number;
  usuariosActivos: number;
}

@Component({
  selector: 'app-principal-administrador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './principal-administrador.component.html',
  styleUrls: ['./principal-administrador.component.css']
})
export class PrincipalAdministradorComponent implements OnInit, OnDestroy, AfterViewInit {
  
  // Datos del usuario administrador
  adminName: string = 'Administrador SegurApp';
  userCity: string = 'Pereira, Colombia';
  userLocation: UserLocation | null = null;
  
  // Estados de la UI
  showUserMenu: boolean = false;
  showNotifications: boolean = false;
  isLoadingMap: boolean = true;
  mapError: string = '';
  showEstadisticas: boolean = true;
  
  // Estadísticas del panel admin
  estadisticas: EstadisticasAdmin = {
    totalReportes: 0,
    reportesPendientes: 0,
    reportesEnProceso: 0,
    reportesResueltos: 0,
    reportesRechazados: 0,
    reportesDelDia: 0,
    usuariosActivos: 0
  };
  
  // Notificaciones para admin
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
    public mapaService: MapaService,
    private authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🏗️ Inicializando PrincipalAdminComponent...');
    this.initializeData();
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Verificando permisos de administrador...');
    
    // Verificar que el usuario sea administrador
    if (!this.verificarPermisoAdmin()) {
      console.error('❌ Usuario sin permisos de administrador');
      this.router.navigate(['/home']);
      return;
    }
    
    this.loadAdminData();
    this.loadNotifications();
    this.loadReportesMockData();
    this.loadEstadisticas();
    this.detectUserLocation();
  }

  ngAfterViewInit(): void {
    console.log('🔄 ngAfterViewInit - Preparando inicialización del mapa admin...');
    
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.initializeMapbox();
        });
      }, 500);
    });
  }

  ngOnDestroy(): void {
    console.log('💀 ngOnDestroy - Limpiando recursos admin...');
    
    this.mapaService.destruirMapa();
    this.destroy$.next();
    this.destroy$.complete();
    this.mapaInicializado = false;
  }

  /**
   * Verificar que el usuario tenga permisos de administrador
   */
  private verificarPermisoAdmin(): boolean {
    try {
      const usuario = this.authService.getCurrentUser();
      if (!usuario) {
        console.warn('⚠️ Usuario no autenticado');
        return false;
      }

      // Verificar rol de administrador
      const esAdmin = usuario.rol === 'ADMIN' || usuario.rol === 'ADMINISTRADOR';
      
      if (!esAdmin) {
        console.warn('⚠️ Usuario sin permisos de administrador:', usuario.rol);
        return false;
      }

      console.log('✅ Usuario administrador verificado:', usuario.nombre);
      return true;
    } catch (error) {
      console.error('❌ Error verificando permisos:', error);
      return false;
    }
  }

  /**
   * Cargar estadísticas del panel administrativo
   */
  private loadEstadisticas(): void {
    console.log('📊 Cargando estadísticas administrativas...');
    
    // En producción, esto vendría de un servicio
    this.estadisticas = {
      totalReportes: this.reportes.length,
      reportesPendientes: this.reportes.filter(r => r.estadoActual === 'PENDIENTE').length,
      reportesEnProceso: this.reportes.filter(r => r.estadoActual === 'EN_PROCESO').length,
      reportesResueltos: this.reportes.filter(r => r.estadoActual === 'RESUELTO').length,
      reportesRechazados: this.reportes.filter(r => r.estadoActual === 'RECHAZADO').length,
      reportesDelDia: this.getReportesDelDia(),
      usuariosActivos: 157 // Mock data
    };
    
    console.log('📈 Estadísticas cargadas:', this.estadisticas);
  }

  /**
   * Obtener reportes del día actual
   */
  private getReportesDelDia(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return this.reportes.filter(reporte => {
      const fechaReporte = new Date(reporte.fecha);
      fechaReporte.setHours(0, 0, 0, 0);
      return fechaReporte.getTime() === hoy.getTime();
    }).length;
  }

  /**
   * Inicializar Mapbox usando el servicio
   */
  private async initializeMapbox(): Promise<void> {
    console.log('🗺️ Iniciando inicialización de Mapbox para admin...');
    
    this.isLoadingMap = true;
    this.mapError = '';
    this.cdr.detectChanges();
    
    try {
      let contenedor = document.getElementById('admin-mapbox-map');
      let intentos = 0;
      const maxIntentos = 10;
      
      while (!contenedor && intentos < maxIntentos) {
        console.log(`🔍 Intento ${intentos + 1}: Buscando contenedor del mapa admin...`);
        await new Promise(resolve => setTimeout(resolve, 200));
        contenedor = document.getElementById('admin-mapbox-map');
        intentos++;
      }
      
      if (!contenedor) {
        throw new Error('Contenedor del mapa admin no encontrado después de múltiples intentos');
      }

      console.log('📦 Contenedor del mapa admin encontrado:', contenedor);

      const rect = contenedor.getBoundingClientRect();
      console.log('📏 Dimensiones del contenedor admin:', {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      });

      if (rect.width === 0 || rect.height === 0) {
        console.warn('⚠️ El contenedor admin tiene dimensiones 0, aplicando dimensiones mínimas...');
        contenedor.style.width = '100%';
        contenedor.style.height = '400px';
        contenedor.style.minHeight = '400px';
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log('🎯 Creando mapa admin con MapaService...');
      await this.mapaService.crearMapa('admin-mapbox-map');
      
      console.log('✅ Mapa Mapbox admin inicializado correctamente');
      this.mapaInicializado = true;
      
      setTimeout(async () => {
        await this.cargarReportesEnMapa();
        this.configurarClickListener();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error inicializando Mapbox admin:', error);
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
    console.log('🔍 Analizando error admin:', error);
    
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
      console.warn('⚠️ No se puede configurar click listener admin: mapa no inicializado');
      return;
    }

    console.log('👆 Configurando listener de clicks admin...');
    
    this.mapaService.agregarMarcador()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coordenadas: Coordenadas) => {
          console.log('📍 Click en mapa admin detectado:', coordenadas);
        },
        error: (error) => {
          console.error('❌ Error en click del mapa admin:', error);
        }
      });
  }

  /**
   * Cargar reportes en el mapa
   */
  private async cargarReportesEnMapa(): Promise<void> {
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ No se pueden cargar reportes admin: mapa no inicializado');
      return;
    }

    try {
      if (this.reportes.length > 0) {
        console.log(`📍 Cargando ${this.reportes.length} reportes en el mapa admin`);
        
        this.mapaService.pintarMarcadores(this.reportes);
        
        setTimeout(() => {
          if (this.mapaService.estaInicializado()) {
            this.mapaService.ajustarVistaAMarcadores();
          }
        }, 2000);
      } else {
        console.log('⚠️ No hay reportes para mostrar en el mapa admin');
      }
    } catch (error) {
      console.error('❌ Error cargando reportes en el mapa admin:', error);
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
      },
      {
        id: '6',
        titulo: 'Vandalismo en parque público',
        descripcion: 'Daños a mobiliario urbano y grafitis en el parque central del barrio.',
        fecha: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        contadorImportante: 4,
        idUsuario: 'user6',
        ubicacion: {
          latitud: 4.8073,
          longitud: -75.6866
        },
        fotos: [],
        estadoActual: 'EN_PROCESO',
        ciudad: 'PEREIRA',
        comentarios: [],
        esAnonimo: false,
        nombreUsuario: 'Pedro Martínez'
      }
    ];
    
    console.log(`📊 Cargados ${this.reportes.length} reportes de ejemplo para administrador`);
  }

  private initializeData(): void {
    this.notifications = [
      {
        id: 1,
        type: 'warning',
        title: 'Reportes pendientes de atención',
        message: 'Hay 5 reportes nuevos que requieren revisión inmediata.',
        time: 'Hace 10 minutos',
        read: false
      },
      {
        id: 2,
        type: 'info',
        title: 'Nuevo usuario registrado',
        message: 'Se ha registrado un nuevo usuario en el sistema.',
        time: 'Hace 30 minutos',
        read: false
      },
      {
        id: 3,
        type: 'success',
        title: 'Reporte resuelto',
        message: 'El reporte #245 ha sido marcado como resuelto exitosamente.',
        time: 'Hace 1 hora',
        read: true
      },
      {
        id: 4,
        type: 'error',
        title: 'Reporte de alta prioridad',
        message: 'Reporte de seguridad crítico requiere atención inmediata en zona centro.',
        time: 'Hace 2 horas',
        read: false
      }
    ];
    
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  private loadAdminData(): void {
    try {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        this.adminName = usuario.nombre || 'Administrador SegurApp';
      }
    } catch (error) {
      console.warn('Error cargando datos del administrador:', error);
    }
    
    this.userLocation = {
      lat: 4.8143,
      lng: -75.6946,
      city: 'Pereira, Colombia'
    };
    this.userCity = 'Pereira, Colombia';
  }

  private loadNotifications(): void {
    console.log('📬 Notificaciones de administrador cargadas:', this.notifications.length);
  }

  private detectUserLocation(): void {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocalización no soportada por este navegador');
      return;
    }

    console.log('📍 Solicitando ubicación del administrador...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: 'Ubicación actual'
        };
        console.log('✅ Ubicación del administrador detectada:', this.userLocation);
        
        if (this.mapaService.estaInicializado()) {
          this.mapaService.centrarMapa([this.userLocation.lng, this.userLocation.lat], 15);
        }
      },
      (error) => {
        console.warn('⚠️ Error obteniendo ubicación del admin:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  }

  // === MÉTODOS DE NAVEGACIÓN ESPECÍFICOS PARA ADMIN ===
  goToGestionReportes(): void {
    console.log('🧭 Navegando a gestión de reportes...');
    this.router.navigate(['/gestion-reportes-admin']);
  }

  goToGestionarInformes(): void {
    console.log('🧭 Navegando a gestionar informes...');
    this.router.navigate(['/gestionar-informes']);
  }

  goToGestionarCategorias(): void {
    console.log('🧭 Navegando a gestionar categorías...');
    this.router.navigate(['/gestionar-categorias-informes']);
  }

  goToProfile(): void {
    this.closeAllMenus();
    console.log('🧭 Navegando a perfil de administrador...');
    this.router.navigate(['/perfil-admin']);
  }

  goToSettings(): void {
    this.closeAllMenus();
    console.log('🧭 Navegando a configuración de administrador...');
    this.router.navigate(['/configuracion-admin']);
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

  toggleEstadisticas(): void {
    this.showEstadisticas = !this.showEstadisticas;
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
    console.log('🎯 Centrando mapa admin en ubicación...');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ No se puede centrar el mapa admin: mapa no inicializado');
      return;
    }
    
    if (this.userLocation) {
      this.mapaService.centrarMapa([this.userLocation.lng, this.userLocation.lat], 16);
    } else {
      console.warn('⚠️ No se puede centrar el mapa admin: ubicación no disponible');
      this.mapaService.centrarMapa([-75.6946, 4.8143], 14);
    }
  }

  toggleMapType(): void {
    console.log('🗺️ Cambiando estilo del mapa admin...');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ Mapa admin no inicializado para cambiar estilo');
      return;
    }
    
    this.estiloActual = (this.estiloActual + 1) % this.estilosMapas.length;
    const nuevoEstilo = this.estilosMapas[this.estiloActual];
    
    this.mapaService.cambiarEstiloMapa(nuevoEstilo.valor);
    console.log(`✅ Mapa admin cambiado a estilo: ${nuevoEstilo.nombre}`);
  }

  async refreshReports(): Promise<void> {
    console.log('🔄 Actualizando reportes en el mapa admin...');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ Mapa admin no inicializado para actualizar reportes');
      return;
    }
    
    this.isLoadingMap = true;
    this.cdr.detectChanges();
    
    try {
      this.mapaService.limpiarMarcadores();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.loadReportesMockData();
      this.loadEstadisticas(); // Actualizar estadísticas también
      await this.cargarReportesEnMapa();
      
      console.log('✅ Reportes admin actualizados exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando reportes admin:', error);
    } finally {
      this.isLoadingMap = false;
      this.cdr.detectChanges();
    }
  }

  requestLocation(): void {
    console.log('📍 Solicitando permisos de ubicación para admin...');
    this.detectUserLocation();
  }

  retryMapInitialization(): void {
    console.log('🔄 Reintentando inicializar mapa admin...');
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
    console.log('👋 Cerrando sesión de administrador...');
    
    try {
      this.mapaService.destruirMapa();
      this.authService.logout();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error durante logout admin:', error);
      this.router.navigate(['/home']);
    }
  }

  // === MÉTODOS DE FILTRADO DE REPORTES ===
  filtrarReportesPorEstado(estado: string): void {
    console.log(`🔍 Filtrando reportes admin por estado: ${estado}`);
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ Mapa admin no inicializado para filtrar');
      return;
    }
    
    const reportesFiltrados = this.reportes.filter(r => r.estadoActual === estado);
    console.log(`📊 Reportes admin filtrados: ${reportesFiltrados.length}/${this.reportes.length}`);
    
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
    console.log('📍 Mostrando todos los reportes en admin');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ Mapa admin no inicializado para mostrar todos los reportes');
      return;
    }
    
    this.mapaService.limpiarMarcadores();
    this.cargarReportesEnMapa();
  }

  /**
   * Método para debugging admin
   */
  debugMapInfo(): void {
    const info = this.mapaService.obtenerInfoMapa();
    console.log('🐛 Información del mapa admin:', info);
    console.log('🐛 Estado del componente admin:', {
      isLoadingMap: this.isLoadingMap,
      mapError: this.mapError,
      mapaInicializado: this.mapaInicializado,
      reportes: this.reportes.length,
      estadisticas: this.estadisticas
    });
  }

  /**
   * Obtener porcentaje de un valor respecto al total
   */
  getPorcentaje(valor: number, total: number): number {
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }

  /**
   * Actualizar estadísticas manualmente
   */
  actualizarEstadisticas(): void {
    console.log('📊 Actualizando estadísticas...');
    this.loadEstadisticas();
  }
}