import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../servicios/auth.service'; // Ajustar ruta según tu estructura

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
  isCheckingAuth = true; // Estado para verificar autenticación

  constructor(
    private router: Router,
    private authService: AuthService // Inyectar AuthService
  ) {}

  ngOnInit(): void {
    // PRIMERA PRIORIDAD: Verificar si hay sesión activa
    this.checkActiveSession();
    
    // Solo inicializar si no hay sesión activa
    setTimeout(() => {
      if (!this.authService.isAuthenticated()) {
        this.initializeWelcomeAnimation();
        this.preloadImages();
        this.getCurrentLocation();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    // Limpieza de recursos si es necesario
  }

  /**
   * Verificar si hay sesión activa y redirigir según rol
   */
  checkActiveSession(): void {
    console.log('Verificando sesión activa...');
    
    // Usar AuthService en lugar de localStorage directo
    if (this.authService.isAuthenticated()) {
      const usuario = this.authService.getCurrentUser();
      
      if (usuario) {
        console.log('Usuario autenticado detectado:', usuario);
        this.isCheckingAuth = false;
        
        // Redirigir según el rol del usuario
        this.redirectToUserDashboard(usuario.rol);
        return;
      }
    }

    // Si no hay sesión activa o el token expiró
    console.log('No hay sesión activa o token expirado');
    this.isCheckingAuth = false;
    
    // Limpiar cualquier dato corrupto
    if (this.authService.getToken() && !this.authService.isTokenValid()) {
      console.log('Token expirado, limpiando sesión...');
      this.authService.logout();
    }
  }

  /**
   * Redirigir al dashboard apropiado según el rol
   */
  private redirectToUserDashboard(rol: string): void {
    switch (rol.toUpperCase()) {
      case 'ADMINISTRADOR':
      case 'ADMIN':
        console.log('Redirigiendo a dashboard de administrador...');
        // Redirigir a ruta de admin cuando la tengas
        this.router.navigate(['/admin-dashboard']); // Cambiar cuando tengas la ruta
        break;
        
      case 'CLIENTE':
      case 'USER':
        console.log('Redirigiendo a dashboard de cliente...');
        this.router.navigate(['/principal-cliente']);
        break;
        
      default:
        console.log('Rol no reconocido:', rol, '- Redirigiendo a dashboard de cliente...');
        this.router.navigate(['/principal-cliente']);
        break;
    }
  }

  /**
   * Navegar a la página de registro
   */
  navigateToRegister(): void {
    if (this.isCheckingAuth) return; // Evitar navegación durante verificación
    
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
   * Navegar a la página de login
   */
  navigateToLogin(): void {
    if (this.isCheckingAuth) return; // Evitar navegación durante verificación
    
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
    if (this.isCheckingAuth) return;
    
    console.log('Mostrando acciones rápidas...');
    
    // Si el usuario ya está autenticado, redirigir a su dashboard
    if (this.authService.isAuthenticated()) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        this.redirectToUserDashboard(usuario.rol);
        return;
      }
    }
    
    // Si no está autenticado, mostrar opciones
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
      }
    ];

    console.log('Acciones disponibles:', actions);
    
    // Acción por defecto: ir a registro
    this.navigateToRegister();
  }

  /**
   * Verificar estado de autenticación (método público para el template)
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Obtener datos del usuario actual (método público para el template)
   */
  getCurrentUser(): any {
    return this.authService.getCurrentUser();
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    console.log('Cerrando sesión...');
    this.authService.logout();
    
    // Recargar el componente para mostrar el estado no autenticado
    this.isCheckingAuth = false;
    this.showWelcomeAnimation = false;
    this.initializeWelcomeAnimation();
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
    
    if (target.src.includes('logo.png')) {
      target.style.display = 'none';
    } else if (target.src.includes('mapa.png')) {
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
          
          this.personalizeByLocation(location);
        },
        (error) => {
          console.warn('Error obteniendo ubicación:', error.message);
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
  }
}