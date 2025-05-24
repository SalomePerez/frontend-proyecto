import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

// Interfaces
interface Reporte {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: 'emergencia' | 'seguridad' | 'infraestructura' | 'otros';
  estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'rechazado';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  fechaCreacion: string;
  fechaActualizacion: string;
  ubicacion: {
    direccion: string;
    lat: number;
    lng: number;
  };
  imagenes?: string[];
  comentariosAdmin?: string;
}

@Component({
  selector: 'app-mis-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-reportes.component.html',
  styleUrls: ['./mis-reportes.component.css']
})
export class MisReportesComponent implements OnInit, OnDestroy {
  
  // Datos del usuario
  userName: string = 'Cliente SegurApp';
  
  // Estados de la UI
  isLoading: boolean = true;
  selectedFilter: string = 'todos';
  selectedCategory: string = 'todas';
  searchTerm: string = '';
  
  
  // Datos de reportes
  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];

  verDetalles(reporteId: number): void {
  this.router.navigate(['/detalle-reporte-subidos'], { queryParams: { id: reporteId } });
}
  
  
  // Estadísticas
  estadisticas = {
    total: 0,
    pendientes: 0,
    enProceso: 0,
    resueltos: 0,
    rechazados: 0
  };

  private destroy$ = new Subject<void>();

  constructor(private router: Router) {
    this.loadUserData();
  }

  ngOnInit(): void {
    this.loadReportes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
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
  }

  private loadReportes(): void {
    this.isLoading = true;
    
    // Simular carga de datos desde el servidor
    setTimeout(() => {
      this.reportes = [
        {
          id: 1,
          titulo: 'Robo en la calle 45',
          descripcion: 'Se presentó un robo a mano armada en la calle 45 con carrera 12. Los delincuentes se movilizaban en motocicleta.',
          categoria: 'seguridad',
          estado: 'en_proceso',
          prioridad: 'alta',
          fechaCreacion: '2024-01-15T10:30:00',
          fechaActualizacion: '2024-01-16T14:20:00',
          ubicacion: {
            direccion: 'Calle 45 # 12-34, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          },
          imagenes: ['assets/reporte1.jpg'],
          comentariosAdmin: 'Se ha enviado patrulla al área. Caso bajo investigación.'
        },
        {
          id: 2,
          titulo: 'Semáforo dañado',
          descripcion: 'El semáforo de la intersección está completamente apagado, causando congestión vehicular.',
          categoria: 'infraestructura',
          estado: 'resuelto',
          prioridad: 'media',
          fechaCreacion: '2024-01-14T08:15:00',
          fechaActualizacion: '2024-01-15T16:45:00',
          ubicacion: {
            direccion: 'Carrera 15 con Calle 72, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          },
          comentariosAdmin: 'Semáforo reparado el 15/01/2024. Funcionando correctamente.'
        },
        {
          id: 3,
          titulo: 'Accidente de tránsito',
          descripcion: 'Colisión entre dos vehículos particulares. Se requiere presencia de tránsito y ambulancia.',
          categoria: 'emergencia',
          estado: 'resuelto',
          prioridad: 'critica',
          fechaCreacion: '2024-01-13T16:22:00',
          fechaActualizacion: '2024-01-13T17:30:00',
          ubicacion: {
            direccion: 'Autopista Norte Km 5, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          },
          comentariosAdmin: 'Atendido por servicios de emergencia. Vía despejada.'
        },
        {
          id: 4,
          titulo: 'Ruido excesivo',
          descripcion: 'Establecimiento comercial con música a alto volumen durante horas no permitidas.',
          categoria: 'otros',
          estado: 'pendiente',
          prioridad: 'baja',
          fechaCreacion: '2024-01-16T22:30:00',
          fechaActualizacion: '2024-01-16T22:30:00',
          ubicacion: {
            direccion: 'Calle 85 # 15-20, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          }
        },
        {
          id: 5,
          titulo: 'Fuga de agua',
          descripcion: 'Gran fuga de agua en la tubería principal de la calle, causando inundación.',
          categoria: 'infraestructura',
          estado: 'rechazado',
          prioridad: 'alta',
          fechaCreacion: '2024-01-12T12:00:00',
          fechaActualizacion: '2024-01-14T10:15:00',
          ubicacion: {
            direccion: 'Calle 30 # 25-10, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          },
          comentariosAdmin: 'Reporte duplicado. Ya existe un reporte similar en proceso.'
        },
        {
          id: 6,
          titulo: 'Intento de robo de vehículo',
          descripcion: 'Intento de hurto de automóvil en parqueadero público. Los delincuentes huyeron al ser descubiertos.',
          categoria: 'seguridad',
          estado: 'pendiente',
          prioridad: 'alta',
          fechaCreacion: '2024-01-17T06:45:00',
          fechaActualizacion: '2024-01-17T06:45:00',
          ubicacion: {
            direccion: 'Centro Comercial Plaza Central, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          }
        },
        {
          id: 7,
          titulo: 'Incendio en casa',
          descripcion: 'Principio de incendio en vivienda unifamiliar. Bomberos y ambulancia en camino.',
          categoria: 'emergencia',
          estado: 'en_proceso',
          prioridad: 'critica',
          fechaCreacion: '2024-01-17T11:20:00',
          fechaActualizacion: '2024-01-17T11:25:00',
          ubicacion: {
            direccion: 'Barrio Los Rosales, Calle 95 # 8-14, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          },
          comentariosAdmin: 'Bomberos en el lugar. Evacuación en proceso.'
        }
      ];
      
      console.log('Reportes cargados:', this.reportes.length); // Debug
      this.calcularEstadisticas();
      this.aplicarFiltros(); // Aplicar filtros después de cargar
      this.isLoading = false;
    }, 1500);
  }

  private calcularEstadisticas(): void {
    this.estadisticas = {
      total: this.reportes.length,
      pendientes: this.reportes.filter(r => r.estado === 'pendiente').length,
      enProceso: this.reportes.filter(r => r.estado === 'en_proceso').length,
      resueltos: this.reportes.filter(r => r.estado === 'resuelto').length,
      rechazados: this.reportes.filter(r => r.estado === 'rechazado').length
    };
  }

  // Métodos de filtrado
  onFilterChange(event: any): void {
    this.selectedFilter = event.target.value;
    console.log('Filtro cambiado a:', this.selectedFilter); // Debug
    this.aplicarFiltros();
  }

  onCategoryChange(event: any): void {
    this.selectedCategory = event.target.value;
    console.log('Categoría cambiada a:', this.selectedCategory); // Debug
    this.aplicarFiltros();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    console.log('Búsqueda:', this.searchTerm); // Debug
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let reportesFiltrados = [...this.reportes];
    console.log('Aplicando filtros - Reportes originales:', reportesFiltrados.length); // Debug

    // Filtro por estado
    if (this.selectedFilter !== 'todos') {
      reportesFiltrados = reportesFiltrados.filter(reporte => 
        reporte.estado === this.selectedFilter
      );
      console.log('Después de filtro por estado:', reportesFiltrados.length); // Debug
    }

    // Filtro por categoría
    if (this.selectedCategory !== 'todas') {
      reportesFiltrados = reportesFiltrados.filter(reporte => 
        reporte.categoria === this.selectedCategory
      );
      console.log('Después de filtro por categoría:', reportesFiltrados.length); // Debug
    }

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const busqueda = this.searchTerm.toLowerCase();
      reportesFiltrados = reportesFiltrados.filter(reporte =>
        reporte.titulo.toLowerCase().includes(busqueda) ||
        reporte.descripcion.toLowerCase().includes(busqueda) ||
        reporte.ubicacion.direccion.toLowerCase().includes(busqueda)
      );
      console.log('Después de filtro por búsqueda:', reportesFiltrados.length); // Debug
    }

    this.reportesFiltrados = reportesFiltrados;
    console.log('Reportes filtrados finales:', this.reportesFiltrados.length); // Debug
  }

  // Métodos de navegación
  goBack(): void {
    this.router.navigate(['/principal-cliente']);
  }

  crearNuevoReporte(): void {
    this.router.navigate(['/crear-reporte']);
  }

  verDetalleReporte(reporteId: number): void {
    this.router.navigate(['/detalle-reporte-subidos'], { queryParams: { id: reporteId } }); // ✅ Correcto
  }

  editarReporte(reporteId: number): void {
    this.router.navigate(['/editar-reporte'], { queryParams: { id: reporteId } });
  }

  // Métodos de utilidad
  getCategoriaIcon(categoria: string): string {
    switch (categoria) {
      case 'emergencia':
        return 'bi bi-exclamation-triangle-fill';
      case 'seguridad':
        return 'bi bi-shield-exclamation';
      case 'infraestructura':
        return 'bi bi-tools';
      case 'otros':
        return 'bi bi-chat-dots';
      default:
        return 'bi bi-file-text';
    }
  }

  getCategoriaColor(categoria: string): string {
    switch (categoria) {
      case 'emergencia':
        return '#ef4444';
      case 'seguridad':
        return '#f59e0b';
      case 'infraestructura':
        return '#3b82f6';
      case 'otros':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'estado-pendiente';
      case 'en_proceso':
        return 'estado-proceso';
      case 'resuelto':
        return 'estado-resuelto';
      case 'rechazado':
        return 'estado-rechazado';
      default:
        return 'estado-pendiente';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'resuelto':
        return 'Resuelto';
      case 'rechazado':
        return 'Rechazado';
      default:
        return 'Desconocido';
    }
  }

  getPrioridadClass(prioridad: string): string {
    switch (prioridad) {
      case 'baja':
        return 'prioridad-baja';
      case 'media':
        return 'prioridad-media';
      case 'alta':
        return 'prioridad-alta';
      case 'critica':
        return 'prioridad-critica';
      default:
        return 'prioridad-baja';
    }
  }

  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Método para obtener tiempo transcurrido
  getTiempoTranscurrido(fecha: string): string {
    const ahora = new Date();
    const fechaReporte = new Date(fecha);
    const diferencia = ahora.getTime() - fechaReporte.getTime();
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias > 0) {
      return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
      return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
      return 'Hace un momento';
    }
  }
}