import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MapaService, ReporteDTO, Coordenadas } from '../../servicios/mapa.service';
import { AuthService } from '../../servicios/auth.service';
import { ReporteService, UbicacionUsuario } from '../../servicios/reporte.service';
import { WebSocketNotificationService, NotificacionWebSocket } from '../../servicios/websocket-notification.service'; // ← Nuevo servicio

// Interfaces - ACTUALIZADO para notificaciones reales
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
  providers: [WebSocketNotificationService],
  templateUrl: './principal-cliente.component.html',
  styleUrls: ['./principal-cliente.component.css']
})
export class PrincipalClienteComponent implements OnInit, OnDestroy, AfterViewInit {
  
  // Datos del usuario
  userName: string = 'Cliente SegurApp';
  userCity: string = 'Obteniendo ubicación...';
  userLocation: UserLocation | null = null;
  
  // Estados de la UI
  showUserMenu: boolean = false;
  showNotifications: boolean = false;
  isLoadingMap: boolean = true;
  isLoadingReportes: boolean = false; // ← Nuevo estado
  mapError: string = '';
  
  // Notificaciones - ACTUALIZADO para usar WebSocket
  notifications: Notification[] = [];
  notificationCount: number = 0;
  notificacionesReales: NotificacionWebSocket[] = []; // ← Nueva lista para notificaciones reales
  
  // Reportes para el mapa
  reportes: ReporteDTO[] = [];
  
  // ✨ NUEVAS PROPIEDADES PARA UBICACIÓN REAL
  ubicacionReal: UbicacionUsuario | null = null;
  ciudadDetectada: string = '';
  errorUbicacion: string = '';
  
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
    private reporteService: ReporteService,
    private webSocketService: WebSocketNotificationService, // ← Inyectar servicio WebSocket
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
    this.initializeWebSocketNotifications(); // ← Inicializar WebSocket
    
    // ✨ CAMBIO: Primero obtener ubicación real, luego cargar reportes
    this.detectarUbicacionReal();
  }

  ngAfterViewInit(): void {
    console.log('🔄 ngAfterViewInit - Preparando inicialización del mapa...');
    
    // Usar NgZone para optimizar la detección de cambios
    this.ngZone.runOutsideAngular(() => {
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
    this.webSocketService.desconectar(); // ← Desconectar WebSocket
    this.destroy$.next();
    this.destroy$.complete();
    this.mapaInicializado = false;
  }

  // ✨ NUEVO MÉTODO: Detectar ubicación real del usuario
  private detectarUbicacionReal(): void {
    console.log('📍 Detectando ubicación real del usuario...');
    this.userCity = 'Obteniendo ubicación...';
    this.cdr.detectChanges();

    this.reporteService.obtenerUbicacionCompleta()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ubicacion) => {
          console.log('✅ Ubicación real detectada:', ubicacion);
          
          this.ubicacionReal = ubicacion;
          this.ciudadDetectada = ubicacion.ciudad;
          this.userCity = `${ubicacion.ciudad}, Colombia`;
          
          // Actualizar userLocation para el mapa
          this.userLocation = {
            lat: ubicacion.latitud,
            lng: ubicacion.longitud,
            city: ubicacion.ciudad
          };
          
          // Centrar mapa si ya está inicializado
          if (this.mapaService.estaInicializado()) {
            this.mapaService.centrarMapa([ubicacion.longitud, ubicacion.latitud], 14);
          }
          
          // Cargar reportes de la ciudad detectada
          this.cargarReportesReales();
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error detectando ubicación:', error);
          this.errorUbicacion = 'No se pudo obtener la ubicación';
          this.userCity = 'Armenia, Colombia'; // ← CAMBIO: Armenia por defecto
          
          // Usar ubicación por defecto (Armenia)
          this.ubicacionReal = {
            latitud: 4.5339,  // ← Coordenadas de Armenia
            longitud: -75.6811,
            ciudad: 'ARMENIA',
            precision: 0
          };
          
          this.userLocation = {
            lat: 4.5339,   // ← Coordenadas de Armenia
            lng: -75.6811,
            city: 'ARMENIA'
          };
          
          // Cargar reportes de Armenia por defecto
          this.cargarReportesReales();
          this.cdr.detectChanges();
        }
      });
  }

  // ✨ NUEVO MÉTODO: Inicializar notificaciones WebSocket
  private initializeWebSocketNotifications(): void {
    console.log('🔔 Inicializando notificaciones WebSocket...');
    
    // Obtener ID del usuario autenticado para las notificaciones
    let idUsuario: string | undefined;
    try {
      const usuario = this.authService.getCurrentUser();
      idUsuario = usuario?.id;
    } catch (error) {
      console.warn('No se pudo obtener ID del usuario para notificaciones');
    }
    
    // Conectar al WebSocket
    this.webSocketService.conectar(idUsuario);
    
    // Suscribirse a nuevas notificaciones
    this.webSocketService.notificaciones$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notificacion) => {
          console.log('🔔 Nueva notificación recibida:', notificacion);
          this.procesarNuevaNotificacion(notificacion);
        },
        error: (error) => {
          console.error('❌ Error en notificaciones WebSocket:', error);
        }
      });
    
    // Actualizar contador de notificaciones periódicamente
    this.actualizarContadorNotificaciones();
  }

  // ✨ NUEVO MÉTODO: Procesar nueva notificación
  private procesarNuevaNotificacion(notificacion: NotificacionWebSocket): void {
    // Agregar a la lista de notificaciones reales
    this.notificacionesReales = this.webSocketService.obtenerNotificaciones();
    
    // Convertir a formato del componente para compatibilidad
    const notificacionConvertida: Notification = {
      id: parseInt(notificacion.id || Date.now().toString()),
      type: this.convertirTipoNotificacion(notificacion.tipo),
      title: notificacion.titulo,
      message: notificacion.mensaje,
      time: this.formatearTiempo(notificacion.fecha),
      read: notificacion.leida
    };
    
    // Agregar al inicio de la lista
    this.notifications.unshift(notificacionConvertida);
    
    // Mantener solo las últimas 20 notificaciones en la UI
    if (this.notifications.length > 20) {
      this.notifications = this.notifications.slice(0, 20);
    }
    
    // Actualizar contador
    this.actualizarContadorNotificaciones();
    
    // Trigger change detection
    this.cdr.detectChanges();
    
    // Opcional: Mostrar notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notificacion.titulo, {
        body: notificacion.mensaje,
        icon: '/assets/logo.png'
      });
    }
  }

  // ✨ NUEVO MÉTODO: Convertir tipo de notificación
  private convertirTipoNotificacion(tipo: string): 'info' | 'success' | 'warning' | 'error' {
    switch (tipo.toUpperCase()) {
      case 'SUCCESS': return 'success';
      case 'WARNING': return 'warning';
      case 'ERROR': return 'error';
      case 'INFO':
      case 'SYSTEM':
      default: return 'info';
    }
  }

  // ✨ NUEVO MÉTODO: Formatear tiempo relativo
  private formatearTiempo(fecha?: string): string {
    if (!fecha) return 'Ahora';
    
    const ahora = new Date();
    const fechaNotificacion = new Date(fecha);
    const diferencia = ahora.getTime() - fechaNotificacion.getTime();
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  }

  // ✨ ACTUALIZADO: Método para actualizar contador
  private actualizarContadorNotificaciones(): void {
    this.notificationCount = this.webSocketService.obtenerCantidadNoLeidas();
  }
  private verificarAutenticacion(): boolean {
    const token = localStorage.getItem('authToken') || 
                 localStorage.getItem('token') || 
                 localStorage.getItem('jwt_token') ||
                 sessionStorage.getItem('authToken') || 
                 sessionStorage.getItem('token') ||
                 sessionStorage.getItem('jwt_token');
    
    const estaAutenticado = !!token;
    console.log('🔐 Estado de autenticación:', estaAutenticado ? 'Autenticado' : 'No autenticado');
    
    if (!estaAutenticado) {
      console.warn('⚠️ Usuario no autenticado - los reportes no se cargarán');
      this.errorUbicacion = 'Debes iniciar sesión para ver los reportes de tu ciudad';
    }
    
    return estaAutenticado;
  }

  // ✨ ACTUALIZAR: Método para cargar reportes con verificación de auth
  private cargarReportesReales(): void {
    if (!this.ubicacionReal) {
      console.warn('⚠️ No hay ubicación para cargar reportes');
      return;
    }

    // ✨ VERIFICAR AUTENTICACIÓN ANTES DE CARGAR REPORTES
    if (!this.verificarAutenticacion()) {
      console.log('⚠️ Usuario no autenticado, usando datos mock');
      this.loadReportesMockData();
      return;
    }

    console.log('📊 Cargando reportes reales para:', this.ubicacionReal.ciudad);
    this.isLoadingReportes = true;
    this.cdr.detectChanges();

    this.reporteService.obtenerReportesPorCiudad(this.ubicacionReal.ciudad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reportes) => {
          console.log(`✅ Reportes reales cargados:`, reportes.length);
          
          // Convertir reportes del backend al formato que espera el mapa
          this.reportes = reportes.map(reporte => ({
            id: reporte.id,
            titulo: reporte.titulo,
            descripcion: reporte.descripcion,
            fecha: reporte.fecha,
            contadorImportante: reporte.contadorImportante,
            idUsuario: reporte.idUsuario,
            ubicacion: {
              latitud: reporte.ubicacion.latitud,
              longitud: reporte.ubicacion.longitud
            },
            fotos: reporte.fotos,
            estadoActual: reporte.estadoActual,
            ciudad: reporte.ciudad,
            comentarios: reporte.comentarios,
            esAnonimo: reporte.esAnonimo,
            nombreUsuario: reporte.nombreUsuario
          }));
          
          console.log(`🎯 Reportes convertidos para el mapa:`, this.reportes.length);
          
          // Si el mapa ya está listo, cargar los marcadores
          if (this.mapaService.estaInicializado()) {
            this.cargarReportesEnMapa();
          }
          
          this.isLoadingReportes = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error cargando reportes reales:', error);
          this.isLoadingReportes = false;
          
          // ✨ MANEJAR ERRORES DE AUTENTICACIÓN
          if (error.message && error.message.includes('sesión')) {
            this.errorUbicacion = 'Sesión expirada. Inicia sesión para ver reportes.';
            // Opcional: redirigir al login
            // this.router.navigate(['/login']);
            return;
          }
          
          // En caso de otros errores, usar datos mock como fallback
          console.log('🔄 Usando datos mock como fallback...');
          this.loadReportesMockData();
          this.cdr.detectChanges();
        }
      });
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
      
      // ✨ CAMBIO: Centrar en ubicación real si está disponible
      if (this.ubicacionReal) {
        console.log('🎯 Centrando mapa en ubicación real del usuario...');
        this.mapaService.centrarMapa([this.ubicacionReal.longitud, this.ubicacionReal.latitud], 14);
      }
      
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
        
        // Si no hay reportes, mostrar mensaje informativo
        if (this.ciudadDetectada) {
          console.log(`ℹ️ No se encontraron reportes en ${this.ciudadDetectada}`);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando reportes en el mapa:', error);
    }
  }

  /**
   * ✨ ACTUALIZADO: Cargar datos de ejemplo solo como fallback
   */
  private loadReportesMockData(): void {
    console.log('📊 Cargando datos mock como fallback...');
    
    this.reportes = [
      {
        id: '1',
        titulo: 'Semáforo dañado en Av. Circunvalar',
        descripcion: 'El semáforo de la intersección Circunvalar con Calle 15 no está funcionando correctamente, causando problemas de tráfico en horas pico.',
        fecha: new Date().toISOString(),
        contadorImportante: 3,
        idUsuario: 'user1',
        ubicacion: {
          latitud: this.ubicacionReal?.latitud || 4.5339, // ← Armenia
          longitud: this.ubicacionReal?.longitud || -75.6811
        },
        fotos: [],
        estadoActual: 'PENDIENTE',
        ciudad: this.ciudadDetectada || 'ARMENIA', // ← Armenia por defecto
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
          latitud: (this.ubicacionReal?.latitud || 4.5339) + 0.005, // ← Armenia
          longitud: (this.ubicacionReal?.longitud || -75.6811) + 0.004
        },
        fotos: [],
        estadoActual: 'EN_PROCESO',
        ciudad: this.ciudadDetectada || 'ARMENIA', // ← Armenia por defecto
        comentarios: [],
        esAnonimo: false,
        nombreUsuario: 'María García'
      }
    ];
    
    console.log(`📊 Cargados ${this.reportes.length} reportes mock`);
    
    // Cargar en el mapa si está disponible
    if (this.mapaService.estaInicializado()) {
      this.cargarReportesEnMapa();
    }
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
        message: 'Aumento de reportes en el sector. Mantente alerta.',
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
        console.log('👤 Usuario cargado:', this.userName);
      }
    } catch (error) {
      console.warn('Error cargando datos del usuario:', error);
      // Intentar obtener el nombre del token o localStorage
      this.tryGetUserNameFromStorage();
    }
  }

  // ✨ NUEVO MÉTODO: Intentar obtener nombre del usuario desde storage
  private tryGetUserNameFromStorage(): void {
    try {
      // Intentar obtener datos del usuario desde localStorage
      const userData = localStorage.getItem('userData') || 
                      localStorage.getItem('currentUser') ||
                      sessionStorage.getItem('userData') ||
                      sessionStorage.getItem('currentUser');
      
      if (userData) {
        const user = JSON.parse(userData);
        if (user.nombre) {
          this.userName = user.nombre;
          console.log('👤 Nombre de usuario obtenido desde storage:', this.userName);
        }
      }
    } catch (error) {
      console.warn('No se pudo obtener el nombre del usuario desde storage');
    }
  }

  private loadNotifications(): void {
    console.log('📬 Notificaciones cargadas:', this.notifications.length);
  }

  // ✨ ACTUALIZADO: Método para solicitar ubicación manualmente
  requestLocation(): void {
    console.log('📍 Solicitando permisos de ubicación manualmente...');
    this.detectarUbicacionReal();
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
    // Marcar notificaciones tradicionales como leídas
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
      }
    });
    
    // Marcar notificaciones WebSocket como leídas
    this.webSocketService.marcarTodasComoLeidas();
    
    this.notificationCount = 0;
  }

  // === MÉTODOS DEL MAPA ===
  centerMap(): void {
    console.log('🎯 Centrando mapa en ubicación del usuario...');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ No se puede centrar el mapa: mapa no inicializado');
      return;
    }
    
    // ✨ CAMBIO: Usar ubicación real si está disponible
    if (this.ubicacionReal) {
      this.mapaService.centrarMapa([this.ubicacionReal.longitud, this.ubicacionReal.latitud], 16);
    } else if (this.userLocation) {
      this.mapaService.centrarMapa([this.userLocation.lng, this.userLocation.lat], 16);
    } else {
      console.warn('⚠️ No se puede centrar el mapa: ubicación no disponible');
      // Usar ubicación por defecto (Armenia)
      this.mapaService.centrarMapa([-75.6811, 4.5339], 14); // ← Armenia
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

  // ✨ ACTUALIZADO: Método para refrescar reportes desde el backend
  async refreshReports(): Promise<void> {
    console.log('🔄 Actualizando reportes desde el backend...');
    
    if (!this.mapaService.estaInicializado()) {
      console.warn('⚠️ Mapa no inicializado para actualizar reportes');
      return;
    }
    
    this.isLoadingMap = true;
    this.cdr.detectChanges();
    
    try {
      // Limpiar marcadores existentes
      this.mapaService.limpiarMarcadores();
      
      // Recargar reportes reales desde el backend
      if (this.ubicacionReal) {
        await new Promise(resolve => {
          this.reporteService.obtenerReportesPorCiudad(this.ubicacionReal!.ciudad)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (reportes) => {
                console.log('✅ Reportes actualizados desde backend:', reportes.length);
                
                // Convertir reportes
                this.reportes = reportes.map(reporte => ({
                  id: reporte.id,
                  titulo: reporte.titulo,
                  descripcion: reporte.descripcion,
                  fecha: reporte.fecha,
                  contadorImportante: reporte.contadorImportante,
                  idUsuario: reporte.idUsuario,
                  ubicacion: {
                    latitud: reporte.ubicacion.latitud,
                    longitud: reporte.ubicacion.longitud
                  },
                  fotos: reporte.fotos,
                  estadoActual: reporte.estadoActual,
                  ciudad: reporte.ciudad,
                  comentarios: reporte.comentarios,
                  esAnonimo: reporte.esAnonimo,
                  nombreUsuario: reporte.nombreUsuario
                }));
                
                // Cargar en el mapa
                this.cargarReportesEnMapa();
                resolve(true);
              },
              error: (error) => {
                console.error('❌ Error actualizando reportes:', error);
                
                // ✨ MANEJAR ERRORES DE AUTENTICACIÓN
                if (error.message && error.message.includes('sesión')) {
                  console.warn('⚠️ Sesión expirada, no se pueden cargar reportes');
                  // Opcional: mostrar mensaje al usuario o redirigir
                }
                
                resolve(false);
              }
            });
        });
      }
      
      console.log('✅ Reportes actualizados exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando reportes:', error);
    } finally {
      this.isLoadingMap = false;
      this.cdr.detectChanges();
    }
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
    const infoMapa = this.mapaService.obtenerInfoMapa();
    console.log('🐛 Información del mapa:', infoMapa);
    console.log('🐛 Estado del componente:', {
      isLoadingMap: this.isLoadingMap,
      isLoadingReportes: this.isLoadingReportes,
      mapError: this.mapError,
      mapaInicializado: this.mapaInicializado,
      reportes: this.reportes.length,
      ubicacionReal: this.ubicacionReal,
      ciudadDetectada: this.ciudadDetectada
    });
    
    // Debug del servicio de reportes también
    this.reporteService.debugToken();
  }
}