import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✨ IMPORTAR SERVICIO Y INTERFACES ACTUALIZADOS
import { ReporteService, ReporteZonaDTO, EstadisticasZona, ComentarioDTO } from '../../servicios/reporte.service';

@Component({
  selector: 'app-reportes-zona',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-reportes.component.html', // Reusar el mismo template
  styleUrls: ['./mis-reportes.component.css']
})
export class MisReportesComponent implements OnInit, OnDestroy {
  
  // Datos del usuario
  userName: string = 'Usuario SegurApp';
  
  // Estados de la UI
  isLoading: boolean = true;
  selectedFilter: string = 'todos';
  selectedCategory: string = 'todas';
  searchTerm: string = '';
  
  // ✨ DATOS DE REPORTES DE ZONA
  reportes: ReporteZonaDTO[] = [];
  reportesFiltrados: ReporteZonaDTO[] = [];
  
  // ✨ ESTADÍSTICAS DE ZONA
  estadisticas = {
    total: 0,
    pendientes: 0,
    enProceso: 0,
    resueltos: 0,
    rechazados: 0
  };

  // ✨ ESTADO PARA COMENTARIOS
  mostrandoComentarios: { [reporteId: string]: boolean } = {};
  comentariosReporte: { [reporteId: string]: ComentarioDTO[] } = {};
  nuevoComentario: { [reporteId: string]: string } = {};
  enviandoComentario: { [reporteId: string]: boolean } = {};

  // ✨ MANEJO DE ERRORES
  errorMessage: string = '';
  hasError: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private reporteService: ReporteService // ✨ SERVICIO INYECTADO
  ) {
    this.loadUserData();
  }

  ngOnInit(): void {
    this.loadReportesZona();
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
          this.userName = `${user.nombre} ${user.apellido}` || 'Usuario SegurApp';
        } catch (error) {
          console.warn('Error parsing user data:', error);
        }
      }
    }
  }

  // ✨ CARGAR REPORTES DE LA ZONA
  private loadReportesZona(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    console.log('🌍 Cargando reportes de la zona...');
    
    this.reporteService.obtenerReportesZona()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reportesBackend) => {
          console.log('✅ Reportes de zona cargados:', reportesBackend.length);
          
          // Convertir reportes del backend al formato del frontend
          this.reportes = reportesBackend.map(reporte => 
            this.reporteService.convertirReporteZonaAFrontend(reporte)
          );
          
          this.calcularEstadisticas();
          this.aplicarFiltros();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error cargando reportes de zona:', error);
          this.hasError = true;
          this.errorMessage = error.message || 'Error al cargar los reportes de la zona';
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

  // ✨ CALCULAR ESTADÍSTICAS DE ZONA
  private calcularEstadisticas(): void {
    const stats = this.reporteService.calcularEstadisticasZona(this.reportes);
    this.estadisticas = {
      total: stats.total,
      pendientes: stats.pendientes,
      enProceso: stats.enProceso,
      resueltos: stats.resueltos,
      rechazados: stats.rechazados
    };
    console.log('📊 Estadísticas de zona calculadas:', this.estadisticas);
  }

  // ✨ REFRESCAR REPORTES DE LA ZONA
  refrescarReportes(): void {
    console.log('🔄 Refrescando reportes de la zona...');
    this.loadReportesZona();
  }

  // MÉTODOS DE FILTRADO (mantener los existentes)
  onFilterChange(event: any): void {
    this.selectedFilter = event.target.value;
    console.log('Filtro cambiado a:', this.selectedFilter);
    this.aplicarFiltros();
  }

  onCategoryChange(event: any): void {
    this.selectedCategory = event.target.value;
    console.log('Categoría cambiada a:', this.selectedCategory);
    this.aplicarFiltros();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    console.log('Búsqueda:', this.searchTerm);
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let reportesFiltrados = [...this.reportes];
    console.log('Aplicando filtros - Reportes originales:', reportesFiltrados.length);

    // Filtro por estado
    if (this.selectedFilter !== 'todos') {
      reportesFiltrados = reportesFiltrados.filter(reporte => 
        reporte.estado === this.selectedFilter
      );
      console.log('Después de filtro por estado:', reportesFiltrados.length);
    }

    // Filtro por categoría
    if (this.selectedCategory !== 'todas') {
      reportesFiltrados = reportesFiltrados.filter(reporte => 
        reporte.categoria === this.selectedCategory
      );
      console.log('Después de filtro por categoría:', reportesFiltrados.length);
    }

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const busqueda = this.searchTerm.toLowerCase();
      reportesFiltrados = reportesFiltrados.filter(reporte =>
        reporte.titulo.toLowerCase().includes(busqueda) ||
        reporte.descripcion.toLowerCase().includes(busqueda) ||
        reporte.ubicacion.direccion.toLowerCase().includes(busqueda) ||
        reporte.nombreUsuario.toLowerCase().includes(busqueda)
      );
      console.log('Después de filtro por búsqueda:', reportesFiltrados.length);
    }

    this.reportesFiltrados = reportesFiltrados;
    console.log('Reportes filtrados finales:', this.reportesFiltrados.length);
  }

  // ✨ MÉTODOS PARA COMENTARIOS

  /**
   * Alternar la visualización de comentarios
   */
  toggleComentarios(reporteId: string): void {
    console.log('💬 Alternando comentarios para reporte:', reporteId);
    
    const estaVisible = this.mostrandoComentarios[reporteId];
    this.mostrandoComentarios[reporteId] = !estaVisible;
    
    // Si se está mostrando por primera vez, cargar comentarios
    if (!estaVisible && !this.comentariosReporte[reporteId]) {
      this.cargarComentarios(reporteId);
    }
  }

  /**
   * Cargar comentarios de un reporte
   */
  private cargarComentarios(reporteId: string): void {
    console.log('📥 Cargando comentarios para reporte:', reporteId);
    
    this.reporteService.obtenerComentariosReporte(reporteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comentarios) => {
          console.log('✅ Comentarios cargados:', comentarios.length);
          this.comentariosReporte[reporteId] = comentarios;
        },
        error: (error) => {
          console.error('❌ Error cargando comentarios:', error);
          alert('Error al cargar los comentarios: ' + error.message);
        }
      });
  }

  /**
   * Agregar nuevo comentario
   */
  agregarComentario(reporteId: string): void {
    const contenido = this.nuevoComentario[reporteId]?.trim();
    
    if (!contenido) {
      alert('Por favor escribe un comentario');
      return;
    }

    console.log('📝 Agregando comentario al reporte:', reporteId);
    
    this.enviandoComentario[reporteId] = true;
    
    this.reporteService.agregarComentarioReporte(reporteId, contenido)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Comentario agregado exitosamente');
          this.nuevoComentario[reporteId] = ''; // Limpiar campo
          this.cargarComentarios(reporteId); // Recargar comentarios
          this.enviandoComentario[reporteId] = false;
        },
        error: (error) => {
          console.error('❌ Error agregando comentario:', error);
          alert('Error al agregar comentario: ' + error.message);
          this.enviandoComentario[reporteId] = false;
        }
      });
  }

  /**
   * Verificar si se pueden mostrar comentarios para un reporte
   */
  puedeComentarReporte(reporte: ReporteZonaDTO): boolean {
    // Se puede comentar si:
    // - No es un reporte propio
    // - El reporte no está eliminado
    // - El reporte no está rechazado
    return !reporte.esPropio && 
           reporte.estado !== 'eliminado' && 
           reporte.estado !== 'rechazado';
  }

  /**
   * Obtener número de comentarios para mostrar
   */
  getNumeroComentarios(reporteId: string): number {
    return this.comentariosReporte[reporteId]?.length || 0;
  }

  // MÉTODOS DE NAVEGACIÓN
  goBack(): void {
    this.router.navigate(['/principal-cliente']);
  }

  crearNuevoReporte(): void {
    this.router.navigate(['/crear-reporte']);
  }

  verDetalles(reporteId: string): void {
    this.router.navigate(['/detalles-reportes-subidos', reporteId]);
  }

  // ✨ EDITAR SOLO SI ES REPORTE PROPIO
  editarReporte(reporteId: string): void {
    const reporte = this.reportes.find(r => r.id === reporteId);
    if (!reporte) {
      console.error('Reporte no encontrado');
      return;
    }

    if (!reporte.esPropio) {
      alert('Solo puedes editar tus propios reportes');
      return;
    }

    if (reporte.estado !== 'pendiente') {
      alert('Solo puedes editar reportes en estado pendiente');
      return;
    }

    this.router.navigate(['/editar-reporte'], { queryParams: { id: reporteId } });
  }

  // ✨ MARCAR COMO IMPORTANTE (PARA CUALQUIER REPORTE)
  marcarComoImportante(reporteId: string): void {
    console.log('⭐ Marcando reporte como importante:', reporteId);
    
    this.reporteService.marcarComoImportante(reporteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Reporte marcado como importante');
          // Actualizar contador localmente
          const reporte = this.reportes.find(r => r.id === reporteId);
          if (reporte) {
            reporte.contadorImportante = (reporte.contadorImportante || 0) + 1;
          }
        },
        error: (error) => {
          console.error('❌ Error marcando como importante:', error);
          alert('Error al marcar como importante: ' + error.message);
        }
      });
  }

  // MÉTODOS DE UTILIDAD (mantener los existentes)
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
      case 'eliminado':
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
      case 'eliminado':
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