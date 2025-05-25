import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  colorClass: string;
}

interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-principal-administrador',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './principal-administrador.component.html',
  styleUrls: ['./principal-administrador.component.css']
})
export class PrincipalAdministradorComponent implements OnInit {

  // Variables para el estado de la interfaz
  activeComponent: string = 'reportes';
  showNotifications: boolean = false;
  showProfileMenu: boolean = false;
  nombreUsuario: string = 'Administrador';
  notificationCount: number = 3;

  // Menú de navegación
  menuItems: MenuItem[] = [
    {
      id: 'reportes',
      label: 'Reportes',
      icon: 'fas fa-file-alt',
      colorClass: 'reportes'
    },
    {
      id: 'categorias',
      label: 'Gestionar Categorías',
      icon: 'fas fa-folder-open',
      colorClass: 'categorias'
    },
    {
      id: 'informes',
      label: 'Informes',
      icon: 'fas fa-chart-bar',
      colorClass: 'informes'
    },
    {
      id: 'salir',
      label: 'Salir',
      icon: 'fas fa-sign-out-alt',
      colorClass: 'salir'
    }
  ];

  // Notificaciones de ejemplo
  notifications: Notification[] = [
    {
      id: 1,
      message: 'Nuevo reporte pendiente de revisión',
      time: 'Hace 5 minutos',
      read: false
    },
    {
      id: 2,
      message: 'Informe mensual generado',
      time: 'Hace 1 hora',
      read: false
    },
    {
      id: 3,
      message: 'Nueva categoría agregada',
      time: 'Hace 2 horas',
      read: false
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Inicialización del componente
    this.loadUserData();
    this.loadNotifications();
    this.setActiveComponentFromRoute();
  }

  // Detectar la ruta actual para establecer el componente activo
  setActiveComponentFromRoute(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/admin/reportes')) {
      this.activeComponent = 'reportes';
    } else if (currentUrl.includes('/admin/categorias')) {
      this.activeComponent = 'categorias';
    } else if (currentUrl.includes('/admin/informes')) {
      this.activeComponent = 'informes';
    } else if (currentUrl.includes('/admin/perfil')) {
      this.activeComponent = 'perfil';
    }
  }

  // Cargar datos del usuario
  loadUserData(): void {
    // Aquí puedes cargar los datos del usuario desde un servicio
    // Por ejemplo: this.userService.getCurrentUser().subscribe(user => {...});
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      this.nombreUsuario = user.nombre || 'Administrador';
    }
  }

  // Cargar notificaciones
  loadNotifications(): void {
    // Aquí puedes cargar las notificaciones desde un servicio
    // Por ejemplo: this.notificationService.getNotifications().subscribe(notifications => {...});
    this.updateNotificationCount();
  }

  // Actualizar contador de notificaciones
  updateNotificationCount(): void {
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  // Manejar clicks en el menú
  handleMenuClick(itemId: string): void {
    if (itemId === 'salir') {
      this.logout();
      return;
    }
    
    this.activeComponent = itemId;
    this.navigateTo(itemId);
    this.closeAllDropdowns();
  }

  // Navegar a una ruta específica
  navigateTo(route: string): void {
    this.router.navigate(['/admin', route]);
    this.activeComponent = route;
    this.closeAllDropdowns();
  }

  // Toggle notificaciones
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false; // Cerrar el otro dropdown
  }

  // Toggle menú de perfil
  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false; // Cerrar el otro dropdown
  }

  // Cerrar todos los dropdowns
  closeAllDropdowns(): void {
    this.showNotifications = false;
    this.showProfileMenu = false;
  }

  // Abrir configuración
  openSettings(): void {
    console.log('Abriendo configuración...');
    this.closeAllDropdowns();
    // Aquí puedes implementar la lógica para abrir configuración
    // Por ejemplo: this.router.navigate(['/admin/configuracion']);
  }

  // Cerrar sesión
  logout(): void {
    const confirmLogout = confirm('¿Estás seguro de que deseas cerrar sesión?');
    
    if (confirmLogout) {
      // Limpiar datos de sesión
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      sessionStorage.clear();
      
      // Redirigir al login
      this.router.navigate(['/login']);
      
      console.log('Sesión cerrada exitosamente');
    }
  }

  // Marcar notificación como leída
  markNotificationAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.updateNotificationCount();
    }
  }

  // Marcar todas las notificaciones como leídas
  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.updateNotificationCount();
  }

  // Escuchar clicks en el documento para cerrar dropdowns
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const isNotificationClick = target.closest('.notification-container');
    const isProfileClick = target.closest('.profile-container');
    
    if (!isNotificationClick && !isProfileClick) {
      this.closeAllDropdowns();
    }
  }

  // Navegar a "Mis Reportes" (funcionalidad del header)
  navigateToMisReportes(): void {
    // Aquí puedes decidir si quieres navegar a una página específica
    // o mostrar los reportes del admin en el panel actual
    console.log('Navegando a Mis Reportes...');
    // this.router.navigate(['/admin/reportes']);
  }
}