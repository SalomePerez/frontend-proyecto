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
   * Navegar a la página de registro - RUTA CORREGIDA
   */
  navigateToRegister(): void {
    try {
      this.isLoading = true;
      console.log('Navegando a registro...');
      this.router.navigate(['/registro']);
    } catch (error) {
      console.error('Error navegando a registro:', error);
      this.isLoading = false;
    }
  }

  /**
   * Navegar a la página de login - RUTA CORREGIDA
   */
  navigateToLogin(): void {
    try {
      this.isLoading = true;
      console.log('Navegando a login...');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error navegando a login:', error);
      this.isLoading = false;
    }
  }

  /**
   * Mostrar acciones rápidas (botón flotante)
   */
  showQuickActions(): void {
    console.log('Mostrando acciones rápidas...');
    
    // Mostrar opciones disponibles
    const actions = [
      { 
        label: 'Ir a Registro', 
        action: () => this.navigateToRegister(),
        icon: 'fa-user-plus'
      },
      { 
        label: 'Ir a Login', 
        action: () => this.navigateToLogin(),
        icon: 'fa-sign-in-alt'
      },
      { 
        label: 'Ver Principal Cliente (Demo)', 
        action: () => this.navigateToPrincipalCliente(),
        icon: 'fa-home'
      }
    ];

    // Por ahora mostrar en consola, puedes implementar un modal después
    console.log('Acciones disponibles:', actions);
    
    // Acción por defecto: ir a registro
    this.navigateToRegister();
  }

  /**
   * Navegar al dashboard principal (para demo)
   */
  navigateToPrincipalCliente(): void {
    try {
      this.isLoading = true;
      console.log('Navegando al dashboard principal...');
      this.router.navigate(['/principal-cliente']);
    } catch (error) {
      console.error('Error navegando al dashboard:', error);
      this.isLoading = false;
    }
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
      img.onload = () => console.log(`Imagen precargada: ${imageSrc}`);
      img.onerror = () => console.warn(`Error precargando imagen: ${imageSrc}`);
    });
  }

  /**
   * Método para manejar errores de carga de imagen
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    console.warn('Error cargando imagen:', target.src);
    
    // Establecer imagen por defecto o placeholder
    if (target.src.includes('logo.png')) {
      // Si falla el logo, usar un ícono por defecto
      target.style.display = 'none';
    } else if (target.src.includes('mapa.png')) {
      // Si falla el mapa, usar un color de fondo
      target.style.backgroundColor = '#e5e7eb';
      target.alt = 'Mapa no disponible';
    }
  }

  /**
   * Método para detectar cuando la imagen se carga correctamente
   */
  onImageLoad(event: Event): void {
    const target = event.target as HTMLImageElement;
    console.log('Imagen cargada correctamente:', target.src);
    target.style.opacity = '1';
  }

  /**
   * Método para manejar clics en el mapa (si necesitas interactividad)
   */
  onMapClick(event: MouseEvent): void {
    console.log('Click en mapa:', event);
    // Implementar lógica de interacción con el mapa si es necesario
    // Por ejemplo, mostrar información de la ubicación clickeada
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
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Ubicación actual:', location);
          
          // Usar la ubicación para personalizar la experiencia
          this.personalizeByLocation(location);
        },
        (error) => {
          console.warn('Error obteniendo ubicación:', error.message);
          // Usar ubicación por defecto (ej: Bogotá)
          this.personalizeByLocation({ lat: 4.6097, lng: -74.0817 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      console.warn('Geolocalización no soportada');
    }
  }

  /**
   * Personalizar experiencia basada en ubicación
   */
  private personalizeByLocation(location: { lat: number, lng: number }): void {
    console.log('Personalizando experiencia para ubicación:', location);
    // Aquí puedes implementar lógica para mostrar información relevante
    // según la ubicación del usuario
  }

  /**
   * Verificar si hay sesión activa
   */
  checkActiveSession(): void {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      console.log('Sesión activa detectada');
      // Redirigir al dashboard apropiado
      try {
        const user = JSON.parse(userData);
        if (user.rol === 'cliente') {
          this.router.navigate(['/principal-cliente']);
        } else if (user.rol === 'admin') {
          this.router.navigate(['/inicio-admin']);
        }
      } catch (error) {
        console.error('Error parseando datos de usuario:', error);
        // Limpiar datos corruptos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }
}