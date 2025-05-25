import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✨ IMPORTAR SERVICIO Y INTERFACES
import { ReporteService, MiReporteDTO, EstadisticasReportes } from '../../servicios/reporte.service';

// Interface del reporte (mantener para compatibilidad local)
interface Reporte {
  id: string; // ✨ CAMBIAR A STRING para compatibilidad con backend
  titulo: string;
  descripcion: string;
  categoria: 'emergencia' | 'seguridad' | 'infraestructura' | 'otros';
  estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'rechazado' | 'eliminado';
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
  
  // ✨ MANEJO DE ERRORES
  errorMessage: string = '';
  hasError: boolean = false;
  
  // ✨ DATOS DE REPORTES (INTEGRADOS CON BACKEND)
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

  constructor(
    private router: Router,
    private reporteService: ReporteService // ✨ INYECTAR SERVICIO
  ) {
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

  // ✨ MÉTODO ACTUALIZADO PARA USAR EL BACKEND
  private loadReportesPropios(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    console.log('📋 Cargando mis reportes creados...');
    
    this.reporteService.obtenerMisReportes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (misReportes) => {
          console.log('✅ Mis reportes cargados exitosamente:', misReportes.length);
          
          // Convertir de MiReporteDTO a formato local del componente
          this.reportesPropios = misReportes.map(reporte => this.convertirMiReporteALocal(reporte));
          
          this.calcularEstadisticas();
          this.aplicarFiltros();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error cargando mis reportes:', error);
          this.hasError = true;
          this.errorMessage = error.message || 'Error al cargar tus reportes';
          this.isLoading = false;
          
          // Si es error de autenticación, redirigir al login
          if (error.message.includes('sesión ha expirado') || error.message.includes('iniciar sesión')) {
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          }
        }
      });
  }

  // ✨ CONVERTIR MiReporteDTO A FORMATO LOCAL
  private convertirMiReporteALocal(miReporte: MiReporteDTO): Reporte {
    return {
      id: miReporte.id,
      titulo: miReporte.titulo,
      descripcion: miReporte.descripcion,
      categoria: miReporte.categoria as 'emergencia' | 'seguridad' | 'infraestructura' | 'otros',
      estado: ['pendiente', 'en_proceso', 'resuelto', 'rechazado', 'eliminado'].includes(miReporte.estado)
        ? miReporte.estado as 'pendiente' | 'en_proceso' | 'resuelto' | 'rechazado' | 'eliminado'
        : 'pendiente',
      prioridad: miReporte.prioridad,
      fechaCreacion: miReporte.fechaCreacion,
      fechaActualizacion: miReporte.fechaActualizacion,
      ubicacion: miReporte.ubicacion,
      imagenes: miReporte.imagenes,
      comentariosAdmin: miReporte.comentariosAdmin,
      esPropio: true // Siempre true ya que son mis reportes
    };
  }

  // ✨ REFRESCAR REPORTES
  refrescarReportes(): void {
    console.log('🔄 Refrescando mis reportes...');
    this.loadReportesPropios();
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

  // Métodos de filtrado (mantener existentes)
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

  // ✅ MÉTODO CLAVE: Navegar al detalle usando el componente existente
  verDetalleReporte(reporteId: string): void { // ✨ CAMBIAR TIPO A STRING
    this.router.navigate(['/detalle-reporte'], { queryParams: { id: reporteId } });
  }

  // ✨ MÉTODO ACTUALIZADO PARA EDITAR CON BACKEND
  editarReporte(reporteId: string): void { // ✨ CAMBIAR TIPO A STRING
    console.log('🔧 Editando reporte ID:', reporteId);
    
    const reporte = this.reportesPropios.find(r => r.id === reporteId);
    if (!reporte) {
      console.error('Reporte no encontrado');
      return;
    }

    if (reporte.estado !== 'pendiente') {
      alert('Solo puedes editar reportes en estado pendiente');
      return;
    }

    this.router.navigate(['/editar-reporte'], { queryParams: { id: reporteId } });
  }

  // ✨ MÉTODO ACTUALIZADO PARA ELIMINAR CON BACKEND
  eliminarReporte(reporteId: string): void { // ✨ CAMBIAR TIPO A STRING
    const reporte = this.reportesPropios.find(r => r.id === reporteId);
    if (!reporte) {
      console.error('Reporte no encontrado');
      return;
    }

    if (reporte.estado !== 'pendiente') {
      alert('Solo puedes eliminar reportes que estén pendientes.');
      return;
    }

    const confirmacion = confirm(`¿Estás seguro de que quieres eliminar el reporte "${reporte.titulo}"?`);
    if (!confirmacion) {
      return;
    }

    console.log('🗑️ Eliminando reporte:', reporteId);
    
    this.reporteService.eliminarReporte(reporteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Reporte eliminado exitosamente');
          alert('Reporte eliminado exitosamente');
          this.refrescarReportes(); // Recargar la lista
        },
        error: (error) => {
          console.error('❌ Error eliminando reporte:', error);
          alert('Error al eliminar el reporte: ' + error.message);
        }
      });
  }

  // ✨ MÉTODO PARA MARCAR COMO RESUELTO
  marcarComoResuelto(reporteId: string): void {
    const reporte = this.reportesPropios.find(r => r.id === reporteId);
    if (!reporte) {
      console.error('Reporte no encontrado');
      return;
    }

    if (reporte.estado !== 'en_proceso') {
      alert('Solo puedes marcar como resuelto reportes que estén en proceso');
      return;
    }

    const confirmacion = confirm(`¿Confirmas que el reporte "${reporte.titulo}" ha sido resuelto?`);
    if (!confirmacion) {
      return;
    }

    // Implementar la llamada al servicio cuando esté disponible
    // this.reporteService.cambiarEstadoReporte(reporteId, 'resuelto')...
    
    console.log('✅ Marcando reporte como resuelto:', reporteId);
    alert('Funcionalidad de marcar como resuelto se implementará próximamente');
  }

  // Métodos de utilidad (mantener existentes)
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
      case 'eliminado': // ✨ AGREGAR ELIMINADO
        return 'estado-eliminado';
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
      case 'eliminado': // ✨ AGREGAR ELIMINADO
        return 'Eliminado';
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
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha no disponible';
    }
  }

  getTiempoTranscurrido(fecha: string): string {
    try {
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
    } catch (error) {
      console.error('Error calculando tiempo transcurrido:', error);
      return 'Tiempo no disponible';
    }
  }
}