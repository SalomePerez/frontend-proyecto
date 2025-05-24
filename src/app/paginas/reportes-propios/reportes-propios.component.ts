import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interface del reporte
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
  esPropio: boolean;
}

@Component({
  selector: 'app-reportes-propios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes-propios.component.html',
  styleUrls: ['./reportes-propios.component.css']
})
export class ReportesPropiosComponent implements OnInit, OnDestroy {
  
  // Datos del usuario
  userName: string = 'Cliente SegurApp';
  
  // Estados de la UI
  isLoading: boolean = true;
  selectedFilter: string = 'todos';
  selectedCategory: string = 'todas';
  searchTerm: string = '';
  
  // Datos de reportes
  reportesPropios: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];
  
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
    this.loadReportesPropios();
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

  private loadReportesPropios(): void {
    this.isLoading = true;
    
    // Simular carga de datos SOLO de reportes del usuario actual
    setTimeout(() => {
      this.reportesPropios = [
        {
          id: 1,
          titulo: 'Robo en mi cuadra',
          descripcion: 'Vi un robo a mano armada en la calle 45 con carrera 12. Los delincuentes se movilizaban en motocicleta negra.',
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
          comentariosAdmin: 'Se ha enviado patrulla al área. Caso bajo investigación.',
          esPropio: true
        },
        {
          id: 4,
          titulo: 'Ruido excesivo del bar',
          descripcion: 'El bar de mi cuadra tiene música muy alta todas las noches después de las 11 PM, violando las normas de ruido.',
          categoria: 'otros',
          estado: 'pendiente',
          prioridad: 'baja',
          fechaCreacion: '2024-01-16T22:30:00',
          fechaActualizacion: '2024-01-16T22:30:00',
          ubicacion: {
            direccion: 'Calle 85 # 15-20, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          },
          esPropio: true
        },
        {
          id: 8,
          titulo: 'Hueco peligroso en la vía',
          descripcion: 'Hay un hueco muy grande en la carrera 15 que está causando accidentes de motocicletas.',
          categoria: 'infraestructura',
          estado: 'pendiente',
          prioridad: 'media',
          fechaCreacion: '2024-01-17T08:15:00',
          fechaActualizacion: '2024-01-17T08:15:00',
          ubicacion: {
            direccion: 'Carrera 15 # 34-45, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          },
          esPropio: true
        },
        {
          id: 12,
          titulo: 'Peligro: Cables eléctricos sueltos',
          descripcion: 'Cables de alta tensión colgando peligrosamente sobre la calle después de la tormenta de ayer.',
          categoria: 'emergencia',
          estado: 'resuelto',
          prioridad: 'critica',
          fechaCreacion: '2024-01-10T15:45:00',
          fechaActualizacion: '2024-01-11T09:30:00',
          ubicacion: {
            direccion: 'Avenida 68 # 45-12, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          },
          comentariosAdmin: 'Cuadrilla de la empresa eléctrica reparó los cables. Peligro neutralizado.',
          esPropio: true
        },
        {
          id: 15,
          titulo: 'Intento de robo a mi vehículo',
          descripcion: 'Intentaron robar mi carro en el parqueadero del supermercado. Los ladrones huyeron cuando llegué.',
          categoria: 'seguridad',
          estado: 'rechazado',
          prioridad: 'alta',
          fechaCreacion: '2024-01-09T19:20:00',
          fechaActualizacion: '2024-01-12T11:15:00',
          ubicacion: {
            direccion: 'Centro Comercial Andino, Bogotá',
            lat: 4.6097,
            lng: -74.0817
          },
          comentariosAdmin: 'No se encontró evidencia suficiente para proceder. Se recomienda instalar cámaras.',
          esPropio: true
        }
      ];
      
      console.log('Mis reportes cargados:', this.reportesPropios.length);
      this.calcularEstadisticas();
      this.aplicarFiltros();
      this.isLoading = false;
    }, 1200);
  }

  private calcularEstadisticas(): void {
    this.estadisticas = {
      total: this.reportesPropios.length,
      pendientes: this.reportesPropios.filter(r => r.estado === 'pendiente').length,
      enProceso: this.reportesPropios.filter(r => r.estado === 'en_proceso').length,
      resueltos: this.reportesPropios.filter(r => r.estado === 'resuelto').length,
      rechazados: this.reportesPropios.filter(r => r.estado === 'rechazado').length
    };
  }

  // Métodos de filtrado
  onFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedFilter = target.value;
    this.aplicarFiltros();
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory = target.value;
    this.aplicarFiltros();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let reportesFiltrados = [...this.reportesPropios];

    // Filtro por estado
    if (this.selectedFilter !== 'todos') {
      reportesFiltrados = reportesFiltrados.filter(reporte => 
        reporte.estado === this.selectedFilter
      );
    }

    // Filtro por categoría
    if (this.selectedCategory !== 'todas') {
      reportesFiltrados = reportesFiltrados.filter(reporte => 
        reporte.categoria === this.selectedCategory
      );
    }

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const busqueda = this.searchTerm.toLowerCase();
      reportesFiltrados = reportesFiltrados.filter(reporte =>
        reporte.titulo.toLowerCase().includes(busqueda) ||
        reporte.descripcion.toLowerCase().includes(busqueda) ||
        reporte.ubicacion.direccion.toLowerCase().includes(busqueda)
      );
    }

    this.reportesFiltrados = reportesFiltrados;
  }

  // Métodos de navegación
  goBack(): void {
    this.router.navigate(['/principal-cliente']);
  }

  crearNuevoReporte(): void {
    this.router.navigate(['/crear-reporte']);
  }

  verDetalleReporte(reporteId: number): void {
    this.router.navigate(['/detalle-reporte'], { queryParams: { id: reporteId } });
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

  // Método para eliminar reporte (solo si está pendiente)
  eliminarReporte(reporteId: number): void {
    const reporte = this.reportesPropios.find(r => r.id === reporteId);
    if (reporte && reporte.estado === 'pendiente') {
      if (confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
        this.reportesPropios = this.reportesPropios.filter(r => r.id !== reporteId);
        this.calcularEstadisticas();
        this.aplicarFiltros();
      }
    } else {
      alert('Solo puedes eliminar reportes que estén pendientes.');
    }
  }
}