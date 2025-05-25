// src/app/servicios/websocket-notification.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

// Interfaces básicas para notificaciones
export interface NotificacionWebSocket {
  id?: string;
  mensaje: string;
  fecha?: string;
  tipo: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';
  leida: boolean;
  reporteId?: string;
  idUsuario?: string;
  titulo: string;
}

export interface EstadoConexion {
  conectado: boolean;
  reconectando: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketNotificationService implements OnDestroy {
  
  // Subjects para manejar notificaciones
  private notificacionesSubject = new Subject<NotificacionWebSocket>();
  private estadoConexionSubject = new BehaviorSubject<EstadoConexion>({
    conectado: false,
    reconectando: false
  });
  
  // Observables públicos
  public notificaciones$ = this.notificacionesSubject.asObservable();
  public estadoConexion$ = this.estadoConexionSubject.asObservable();
  
  // Lista de notificaciones en memoria
  private notificacionesLista: NotificacionWebSocket[] = [];
  
  // WebSocket nativo (implementación básica)
  private websocket: WebSocket | null = null;
  private readonly WS_URL = 'wss://proyecto-avanzada.onrender.com/ws'; // Ajustar según tu backend
  
  constructor() {
    console.log('🔔 Inicializando WebSocketNotificationService...');
    this.initializeMockNotifications();
  }

  /**
   * Inicializar notificaciones de ejemplo hasta que el WebSocket esté listo  
   */
  private initializeMockNotifications(): void {
    // Agregar notificaciones de ejemplo
    setTimeout(() => {
      this.agregarNotificacion({
        id: '1',
        titulo: 'Nuevo reporte cercano',
        mensaje: 'Se ha reportado un incidente de seguridad cerca de tu ubicación.',
        tipo: 'INFO',
        leida: false,
        fecha: new Date().toISOString()
      });
    }, 2000);

    setTimeout(() => {
      this.agregarNotificacion({
        id: '2',
        titulo: 'Reporte actualizado',
        mensaje: 'El estado de tu reporte ha cambiado a "En proceso".',
        tipo: 'SUCCESS',
        leida: false,
        fecha: new Date().toISOString()
      });
    }, 5000);
  }

  /**
   * Conectar al WebSocket (implementación básica)
   */
  public conectar(idUsuario?: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket ya está conectado');
      return;
    }

    console.log('🔌 Conectando a WebSocket:', this.WS_URL);
    
    this.estadoConexionSubject.next({
      conectado: false,
      reconectando: true
    });

    try {
      this.websocket = new WebSocket(this.WS_URL);
      
      this.websocket.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.estadoConexionSubject.next({
          conectado: true,
          reconectando: false
        });
      };

      this.websocket.onmessage = (event) => {
        try {
          const notificacion: NotificacionWebSocket = JSON.parse(event.data);
          console.log('📨 Notificación recibida:', notificacion);
          this.agregarNotificacion(notificacion);
        } catch (error) {
          console.error('❌ Error parseando notificación:', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        this.estadoConexionSubject.next({
          conectado: false,
          reconectando: false,
          error: 'Error de conexión'
        });
      };

      this.websocket.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        this.estadoConexionSubject.next({
          conectado: false,
          reconectando: false
        });
        
        // Reconectar después de 5 segundos
        setTimeout(() => {
          if (idUsuario) {
            this.conectar(idUsuario);
          }
        }, 5000);
      };

    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
      this.estadoConexionSubject.next({
        conectado: false,
        reconectando: false,
        error: 'Error de conexión'
      });
    }
  }

  /**
   * Desconectar WebSocket
   */
  public desconectar(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Agregar notificación a la lista y emitir evento
   */
  private agregarNotificacion(notificacion: NotificacionWebSocket): void {
    // Agregar ID si no tiene
    if (!notificacion.id) {
      notificacion.id = Date.now().toString();
    }
    
    // Agregar fecha si no tiene
    if (!notificacion.fecha) {
      notificacion.fecha = new Date().toISOString();
    }

    // Agregar a la lista
    this.notificacionesLista.unshift(notificacion);
    
    // Mantener solo las últimas 50 notificaciones
    if (this.notificacionesLista.length > 50) {
      this.notificacionesLista = this.notificacionesLista.slice(0, 50);
    }

    // Emitir la nueva notificación
    this.notificacionesSubject.next(notificacion);
  }

  /**
   * Obtener todas las notificaciones
   */
  public obtenerNotificaciones(): NotificacionWebSocket[] {
    return [...this.notificacionesLista];
  }

  /**
   * Obtener cantidad de notificaciones no leídas
   */
  public obtenerCantidadNoLeidas(): number {
    return this.notificacionesLista.filter(n => !n.leida).length;
  }

  /**
   * Marcar notificación como leída
   */
  public marcarComoLeida(idNotificacion: string): void {
    const notificacion = this.notificacionesLista.find(n => n.id === idNotificacion);
    if (notificacion) {
      notificacion.leida = true;
      console.log('✅ Notificación marcada como leída:', idNotificacion);
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  public marcarTodasComoLeidas(): void {
    this.notificacionesLista.forEach(n => n.leida = true);
    console.log('✅ Todas las notificaciones marcadas como leídas');
  }

  /**
   * Limpiar todas las notificaciones
   */
  public limpiarNotificaciones(): void {
    this.notificacionesLista = [];
    console.log('🗑️ Notificaciones limpiadas');
  }

  /**
   * Simular nueva notificación (para testing)
   */
  public simularNotificacion(): void {
    const tipos: Array<'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'> = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'];
    const tipoAleatorio = tipos[Math.floor(Math.random() * tipos.length)];
    
    const mensajes = {
      INFO: 'Nuevo reporte en tu área',
      SUCCESS: 'Tu reporte fue aprobado',
      WARNING: 'Alerta de seguridad en tu zona',
      ERROR: 'Error procesando tu reporte'
    };

    this.agregarNotificacion({
      titulo: `Notificación ${tipoAleatorio}`,
      mensaje: mensajes[tipoAleatorio],
      tipo: tipoAleatorio,
      leida: false,
      fecha: new Date().toISOString()
    });
  }

  ngOnDestroy(): void {
    this.desconectar();
  }
}