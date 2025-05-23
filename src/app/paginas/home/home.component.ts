// home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  
  // Propiedades del componente
  isLoading = false;
  showWelcomeAnimation = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Inicializar animaciones de bienvenida
    this.initializeWelcomeAnimation();
    
    // Precargar imágenes si es necesario
    this.preloadImages();
  }

  ngOnDestroy(): void {
    // Limpieza de recursos si es necesario
  }

  /**
   * Navegar a la página de registro
   */
  navigateToRegister(): void {
    try {
      this.isLoading = true;
      this.router.navigate(['/auth/register']);
    } catch (error) {
      console.error('Error navegando a registro:', error);
      this.isLoading = false;
    }
  }

  /**
   * Navegar a la página de login
   */
  navigateToLogin(): void {
    try {
      this.isLoading = true;
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error navegando a login:', error);
      this.isLoading = false;
    }
  }

  /**
   * Mostrar acciones rápidas (botón flotante)
   */
  showQuickActions(): void {
    // Implementar lógica para mostrar menú de acciones rápidas
    // Por ejemplo: reportar incidente rápido, llamada de emergencia, etc.
    console.log('Mostrando acciones rápidas...');
    
    // Ejemplo de implementación futura:
    // this.dialog.open(QuickActionsComponent);
    // O mostrar un menú contextual
    this.showQuickActionsMenu();
  }

  /**
   * Inicializar animaciones de bienvenida
   */
  private initializeWelcomeAnimation(): void {
    setTimeout(() => {
      this.showWelcomeAnimation = true;
    }, 500);
  }

  /**
   * Precargar imágenes para mejor rendimiento
   */
  private preloadImages(): void {
    const imagesToPreload = [
      'assets/mapa.png',
      'assets/logo.png'
    ];

    imagesToPreload.forEach(imageSrc => {
      const img = new Image();
      img.src = imageSrc;
    });
  }

  /**
   * Mostrar menú de acciones rápidas
   */
  private showQuickActionsMenu(): void {
    // Implementación temporal - puedes expandir esto
    const actions = [
      { label: 'Reportar Incidente', action: () => this.reportIncident() },
      { label: 'Llamada de Emergencia', action: () => this.emergencyCall() },
      { label: 'Ver Alertas', action: () => this.viewAlerts() }
    ];

    // Por ahora solo log, pero puedes implementar un modal o dropdown
    console.log('Acciones disponibles:', actions);
    
    // Ejemplo de navegación a reporte rápido
    // this.router.navigate(['/quick-report']);
  }

  /**
   * Reportar incidente rápido
   */
  private reportIncident(): void {
    console.log('Iniciando reporte de incidente...');
    // Navegar a formulario de reporte o modal
    // this.router.navigate(['/report/incident']);
  }

  /**
   * Llamada de emergencia
   */
  private emergencyCall(): void {
    console.log('Iniciando llamada de emergencia...');
    // Implementar lógica de llamada de emergencia
    // window.location.href = 'tel:911';
  }

  /**
   * Ver alertas
   */
  private viewAlerts(): void {
    console.log('Mostrando alertas...');
    // Navegar a página de alertas
    // this.router.navigate(['/alerts']);
  }

  /**
   * Método para manejar errores de carga de imagen
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    console.warn('Error cargando imagen:', target.src);
    
    // Puedes establecer una imagen por defecto
    // target.src = 'assets/placeholder.png';
  }

  /**
   * Método para detectar cuando la imagen se carga correctamente
   */
  onImageLoad(event: Event): void {
    const target = event.target as HTMLImageElement;
    console.log('Imagen cargada correctamente:', target.src);
  }

  /**
   * Método para manejar clics en el mapa (si necesitas interactividad)
   */
  onMapClick(event: MouseEvent): void {
    console.log('Click en mapa:', event);
    // Implementar lógica de interacción con el mapa si es necesario
  }

  /**
   * Método para verificar si el usuario está en móvil
   */
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Método para obtener información de geolocalización
   */
  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Ubicación actual:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Usar la ubicación para personalizar la experiencia
        },
        (error) => {
          console.warn('Error obteniendo ubicación:', error);
        }
      );
    } else {
      console.warn('Geolocalización no soportada');
    }
  }
}