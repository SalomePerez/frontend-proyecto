import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

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

// Declaración para Google Maps
declare let google: any;

@Component({
  selector: 'app-principal-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './principal-cliente.component.html',
  styleUrls: ['./principal-cliente.component.css']
})
export class PrincipalClienteComponent implements OnInit, OnDestroy, AfterViewInit {
  
  // Datos del usuario (simulados)
  userName: string = 'Cliente SegurApp';
  userCity: string = 'Bogotá, Colombia';
  userLocation: UserLocation | null = null;
  
  // Estados de la UI
  showUserMenu: boolean = false;
  showNotifications: boolean = false;
  isLoadingMap: boolean = true;
  
  // Notificaciones
  notifications: Notification[] = [];
  notificationCount: number = 0;
  
  // Mapa
  map: any = null;
  mapMarkers: any[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(private router: Router) {
    this.initializeData();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadNotifications();
    this.simulateLocationDetection();
  }

  ngAfterViewInit(): void {
    // Esperar a que Google Maps esté disponible
    this.waitForGoogleMaps().then(() => {
      this.initializeMap();
    }).catch(() => {
      console.warn('Google Maps no disponible, usando mapa simulado');
      this.createSimulatedMapFallback();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;
      
      const checkGoogleMaps = () => {
        attempts++;
        if (typeof google !== 'undefined' && google.maps) {
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(checkGoogleMaps, 500);
        } else {
          reject('Google Maps no se cargó');
        }
      };
      
      checkGoogleMaps();
    });
  }

  private initializeData(): void {
    // Datos simulados para desarrollo
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
    // Verificar si localStorage está disponible
    if (typeof Storage !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.userName = `${user.nombre} ${user.apellido}` || 'Cliente SegurApp';
        } catch (error) {
          console.warn('Error parsing user data:', error);
        }
      }
    }
    
    // Ubicación simulada (luego se reemplazará con ubicación real)
    this.userLocation = {
      lat: 4.6097,
      lng: -74.0817,
      city: 'Bogotá, Colombia'
    };
    this.userCity = 'Bogotá, Colombia';
  }

  private loadNotifications(): void {
    // En producción, cargar desde el servicio
    // this.notificationService.getNotifications().subscribe(...)
    console.log('Notificaciones cargadas:', this.notifications.length);
  }

  private simulateLocationDetection(): void {
    // Simular detección de ubicación
    setTimeout(() => {
      if (!this.userLocation) {
        // Ubicación por defecto (Armenia, Quindío)
        this.userLocation = {
          lat: 4.533889,
          lng: -75.681111,
          city: 'Armenia'
        };
      }
    }, 2000);
  }

  private initializeMap(): void {
    this.isLoadingMap = true;
    
    setTimeout(() => {
      const mapElement = document.getElementById('google-map');
      if (mapElement && this.userLocation) {
        if (typeof google !== 'undefined' && google.maps) {
          this.createRealGoogleMap(mapElement);
        } else {
          this.createSimulatedMap(mapElement);
        }
      }
      this.isLoadingMap = false;
    }, 1000);
  }

  private createRealGoogleMap(element: HTMLElement): void {
    try {
      const mapOptions = {
        center: { lat: this.userLocation!.lat, lng: this.userLocation!.lng },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        // ESTILOS PARA HACER EL MAPA MÁS CLARO Y LIMPIO
        styles: [
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#444444' }]
          },
          {
            featureType: 'landscape',
            elementType: 'all',
            stylers: [{ color: '#f2f2f2' }]
          },
          {
            featureType: 'poi',
            elementType: 'all',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'road',
            elementType: 'all',
            stylers: [{ saturation: -100 }, { lightness: 45 }]
          },
          {
            featureType: 'road.highway',
            elementType: 'all',
            stylers: [{ visibility: 'simplified' }]
          },
          {
            featureType: 'road.arterial',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'all',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'water',
            elementType: 'all',
            stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
          }
        ],
        // CONFIGURACIONES ADICIONALES PARA LIMPIAR EL MAPA
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true,
        // CONFIGURACIÓN ESPECÍFICA PARA DESARROLLO
        restriction: {
          latLngBounds: {
            north: 12.5,
            south: -4.5,
            west: -82,
            east: -66
          },
          strictBounds: false
        }
      };

      this.map = new google.maps.Map(element, mapOptions);

      // Añadir marcador de usuario con mejor estilo
      const userMarker = new google.maps.Marker({
        position: { lat: this.userLocation!.lat, lng: this.userLocation!.lng },
        map: this.map,
        title: 'Tu ubicación',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285f4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        animation: google.maps.Animation.DROP
      });

      // Añadir algunos marcadores de ejemplo para reportes
      this.addSampleReportMarkers();

      console.log('Google Maps inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando Google Maps:', error);
      this.createSimulatedMap(element);
    }
  }

  // Método para añadir marcadores de ejemplo
  private addSampleReportMarkers(): void {
    if (!this.map || !this.userLocation) return;

    const sampleReports = [
      {
        lat: this.userLocation.lat + 0.001,
        lng: this.userLocation.lng + 0.001,
        type: 'emergency',
        title: 'Emergencia reportada',
        description: 'Accidente de tránsito'
      },
      {
        lat: this.userLocation.lat - 0.002,
        lng: this.userLocation.lng + 0.003,
        type: 'security',
        title: 'Problema de seguridad',
        description: 'Robo reportado'
      },
      {
        lat: this.userLocation.lat + 0.003,
        lng: this.userLocation.lng - 0.001,
        type: 'infrastructure',
        title: 'Problema de infraestructura',
        description: 'Semáforo dañado'
      },
      {
        lat: this.userLocation.lat - 0.001,
        lng: this.userLocation.lng - 0.002,
        type: 'other',
        title: 'Otro tipo de reporte',
        description: 'Ruido excesivo'
      }
    ];

    sampleReports.forEach(report => {
      const marker = new google.maps.Marker({
        position: { lat: report.lat, lng: report.lng },
        map: this.map,
        title: report.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: this.getMarkerColor(report.type),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Añadir info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">${report.title}</h4>
            <p style="margin: 0; color: #666;">${report.description}</p>
            <small style="color: #999;">Hace 2 horas</small>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
      });

      this.mapMarkers.push(marker);
    });
  }

  // Método para obtener colores de marcadores según el tipo
  private getMarkerColor(type: string): string {
    switch (type) {
      case 'emergency':
        return '#ef4444'; // Rojo
      case 'security':
        return '#f59e0b'; // Naranja
      case 'infrastructure':
        return '#3b82f6'; // Azul
      default:
        return '#6b7280'; // Gris
    }
  }

  private createSimulatedMap(element: HTMLElement): void {
    // Crear un mapa simulado para desarrollo
    element.innerHTML = `
      <div style="
        width: 100%; 
        height: 100%; 
        background: linear-gradient(45deg, #e6f3e6 25%, transparent 25%), 
                    linear-gradient(-45deg, #e6f3e6 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #e6f3e6 75%), 
                    linear-gradient(-45deg, transparent 75%, #e6f3e6 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4a5568;
        font-size: 1.2rem;
        font-weight: 600;
      ">
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-align: center;
        ">
          <i class="bi bi-geo-alt-fill" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem; display: block;"></i>
          <div>Mapa de ${this.userCity}</div>
          <div style="font-size: 0.9rem; color: #6b7280; margin-top: 0.5rem;">
            Vista simulada para desarrollo
          </div>
        </div>
      </div>
    `;
    
    console.log('Mapa simulado creado para:', this.userCity);
  }

  private createSimulatedMapFallback(): void {
    this.isLoadingMap = false;
    setTimeout(() => {
      const mapElement = document.getElementById('google-map');
      if (mapElement) {
        this.createSimulatedMap(mapElement);
      }
    }, 100);
  }

  // Métodos de navegación
  goToReportes(): void {
    this.router.navigate(['/mis-reportes']);
  }

  goToReportar(): void {
    this.router.navigate(['/crear-reporte']);
  }

  goToMisReportes(): void {
    this.router.navigate(['/mis-reportes']);
  }

  goToProfile(): void {
    this.closeAllMenus();
    this.router.navigate(['/perfil-cliente']);
  }

  goToSettings(): void {
    this.closeAllMenus();
    // Implementar navegación a configuración
    console.log('Navegando a configuración...');
  }

  // Métodos de UI
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
      // Marcar notificaciones como leídas
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

  // Métodos del mapa
  centerMap(): void {
    console.log('Centrando mapa en ubicación del usuario...');
    if (this.map && this.userLocation) {
      try {
        this.map.setCenter({ lat: this.userLocation.lat, lng: this.userLocation.lng });
        this.map.setZoom(16);
      } catch (error) {
        console.warn('Error centrando mapa:', error);
      }
    }
  }

  toggleMapType(): void {
    console.log('Cambiando tipo de vista del mapa...');
    if (this.map && typeof google !== 'undefined') {
      try {
        const currentType = this.map.getMapTypeId();
        const newType = currentType === google.maps.MapTypeId.ROADMAP 
          ? google.maps.MapTypeId.SATELLITE 
          : google.maps.MapTypeId.ROADMAP;
        this.map.setMapTypeId(newType);
      } catch (error) {
        console.warn('Error cambiando tipo de mapa:', error);
      }
    }
  }

  refreshReports(): void {
    console.log('Actualizando reportes en el mapa...');
    // Limpiar marcadores existentes
    this.mapMarkers.forEach(marker => {
      marker.setMap(null);
    });
    this.mapMarkers = [];
    
    // Volver a cargar marcadores
    if (this.map) {
      this.addSampleReportMarkers();
    }
  }

  requestLocation(): void {
    console.log('Solicitando permisos de ubicación...');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: 'Ubicación actual'
          };
          this.initializeMap();
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          // Usar ubicación por defecto
          this.userLocation = {
            lat: 4.533889,
            lng: -75.681111,
            city: 'Armenia'
          };
          this.initializeMap();
        }
      );
    }
  }

  // Métodos de utilidad
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info':
        return 'bi bi-info-circle';
      case 'success':
        return 'bi bi-check-circle';
      case 'warning':
        return 'bi bi-exclamation-triangle';
      case 'error':
        return 'bi bi-x-circle';
      default:
        return 'bi bi-bell';
    }
  }

  logout(): void {
    // Limpiar datos del usuario
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Navegar al login
    this.router.navigate(['/login']);
    console.log('Usuario desconectado');
  }

  // Métodos para desarrollo/testing
  addTestNotification(): void {
    const testNotification: Notification = {
      id: Date.now(),
      type: 'info',
      title: 'Notificación de prueba',
      message: 'Esta es una notificación de prueba para verificar el funcionamiento.',
      time: 'Ahora',
      read: false
    };
    
    this.notifications.unshift(testNotification);
    this.notificationCount++;
  }
}