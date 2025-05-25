import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MapaService, ReporteDTO } from '../../servicios/mapa.service';
import { AuthService } from '../../servicios/auth.service';

// Interfaces específicas para la gestión admin
interface FiltrosReporte {
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
  ciudad: string;
  busqueda: string;
  ordenarPor: string;
  direccion: 'asc' | 'desc';
}

interface AccionReporte {
  id: string;
  accion: 'verificar' | 'rechazar' | 'eliminar' | 'en_proceso';
  motivo?: string;
  comentario?: string;
}

interface ConfirmacionModal {
  mostrar: boolean;
  titulo: string;
  mensaje: string;
  accion: AccionReporte | null;
  reporte: ReporteDTO | null;
}

@Component({
  selector: 'app-gestion-reportes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-reportes-admin.component.html',
  styleUrls: ['./gestion-reportes-admin.component.css']
})
export class GestionReportesAdminComponent implements OnInit, OnDestroy {
  
  // Estado principal
  reportes: ReporteDTO[] = [];
  reportesFiltrados: ReporteDTO[] = [];
  isLoading: boolean = true;
  error: string = '';
  
  // Filtros y búsqueda
  filtros: FiltrosReporte = {
    estado: 'TODOS',
    fechaDesde: '',
    fechaHasta: '',
    ciudad: 'TODAS',
    busqueda: '',
    ordenarPor: 'fecha',
    direccion: 'desc'
  };

  // Paginación
  paginaActual: number = 1;
  reportesPorPagina: number = 10;
  totalPaginas: number = 0;
  
  // Modal de confirmación
  modalConfirmacion: ConfirmacionModal = {
    mostrar: false,
    titulo: '',
    mensaje: '',
    accion: null,
    reporte: null
  };

  // Estados y opciones
  estadosDisponibles = [
    { valor: 'TODOS', etiqueta: 'Todos los reportes' },
    { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
    { valor: 'EN_PROCESO', etiqueta: 'En Proceso' },
    { valor: 'VERIFICADO', etiqueta: 'Verificados' },
    { valor: 'RECHAZADO', etiqueta: 'Rechazados' }
  ];

  ciudadesDisponibles = [
    { valor: 'TODAS', etiqueta: 'Todas las ciudades' },
    { valor: 'PEREIRA', etiqueta: 'Pereira' },
    { valor: 'DOSQUEBRADAS', etiqueta: 'Dosquebradas' },
    { valor: 'LA_VIRGINIA', etiqueta: 'La Virginia' }
  ];

  opcionesOrden = [
    { valor: 'fecha', etiqueta: 'Fecha' },
    { valor: 'titulo', etiqueta: 'Título' },
    { valor: 'estado', etiqueta: 'Estado' },
    { valor: 'prioridad', etiqueta: 'Importancia' }
  ];

  // Reporte seleccionado para acciones
  reporteSeleccionado: ReporteDTO | null = null;
  motivoRechazo: string = '';
  comentarioAdmin: string = '';
  
  // Estados de procesamiento
  procesandoAccion: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private mapaService: MapaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🏗️ Inicializando GestionReportesAdminComponent...');
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Cargando gestión de reportes admin...');
    
    // Verificar permisos de administrador
    if (!this.verificarPermisoAdmin()) {
      console.error('❌ Usuario sin permisos de administrador');
      this.router.navigate(['/home']);
      return;
    }
    
    this.inicializarFiltros();
    this.cargarReportes();
  }

  ngOnDestroy(): void {
    console.log('💀 ngOnDestroy - Limpiando recursos gestión reportes...');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Verificar permisos de administrador
   */
  private verificarPermisoAdmin(): boolean {
    try {
      const usuario = this.authService.getCurrentUser();
      if (!usuario) {
        console.warn('⚠️ Usuario no autenticado');
        return false;
      }

      const esAdmin = usuario.rol === 'ADMIN' || usuario.rol === 'ADMINISTRADOR';
      
      if (!esAdmin) {
        console.warn('⚠️ Usuario sin permisos de administrador:', usuario.rol);
        return false;
      }

      console.log('✅ Permisos de administrador verificados:', usuario.nombre);
      return true;
    } catch (error) {
      console.error('❌ Error verificando permisos:', error);
      return false;
    }
  }

  /**
   * Inicializar filtros con valores por defecto
   */
  private inicializarFiltros(): void {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    this.filtros.fechaHasta = hoy.toISOString().split('T')[0];
    this.filtros.fechaDesde = hace30Dias.toISOString().split('T')[0];
  }

  /**
   * Cargar reportes (mock data)
   */
  async cargarReportes(): Promise<void> {
    console.log('📊 Cargando reportes para gestión admin...');
    
    this.isLoading = true;
    this.error = '';
    
    try {
      // Simular carga desde API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.reportes = [
        {
          id: '1',
          titulo: 'Semáforo dañado en Av. Circunvalar',
          descripcion: 'El semáforo de la intersección Circunvalar con Calle 15 no está funcionando correctamente, causando problemas de tráfico en horas pico.',
          fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 3,
          idUsuario: 'user1',
          ubicacion: { latitud: 4.8143, longitud: -75.6946 },
          fotos: [],
          estadoActual: 'PENDIENTE',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: false,
          nombreUsuario: 'Juan Pérez'
        },
        {
          id: '2',
          titulo: 'Robo a mano armada',
          descripcion: 'Se reportó un robo a mano armada en esta zona durante la madrugada. Las autoridades ya fueron notificadas.',
          fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 8,
          idUsuario: 'user2',
          ubicacion: { latitud: 4.8093, longitud: -75.6906 },
          fotos: [],
          estadoActual: 'EN_PROCESO',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: false,
          nombreUsuario: 'María García'
        },
        {
          id: '3',
          titulo: 'Hueco profundo en Carrera 15',
          descripcion: 'Hueco profundo en la carrera 15 con calle 18 que puede causar accidentes a los vehículos, especialmente motocicletas.',
          fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 1,
          idUsuario: 'user3',
          ubicacion: { latitud: 4.8113, longitud: -75.6976 },
          fotos: [],
          estadoActual: 'VERIFICADO',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: true
        },
        {
          id: '4',
          titulo: 'Ruido excesivo - Construcción',
          descripcion: 'Construcción con ruido excesivo en horarios no permitidos (después de las 6 PM), afecta el descanso de los vecinos del sector.',
          fecha: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 5,
          idUsuario: 'user4',
          ubicacion: { latitud: 4.8163, longitud: -75.6856 },
          fotos: [],
          estadoActual: 'RECHAZADO',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: false,
          nombreUsuario: 'Carlos López'
        },
        {
          id: '5',
          titulo: 'Alumbrado público deficiente',
          descripcion: 'Varias luminarias del sector están fundidas, generando inseguridad durante las horas nocturnas.',
          fecha: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 2,
          idUsuario: 'user5',
          ubicacion: { latitud: 4.8053, longitud: -75.6926 },
          fotos: [],
          estadoActual: 'PENDIENTE',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: false,
          nombreUsuario: 'Ana Rodríguez'
        },
        {
          id: '6',
          titulo: 'Vandalismo en parque público',
          descripcion: 'Daños a mobiliario urbano y grafitis en el parque central del barrio.',
          fecha: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 4,
          idUsuario: 'user6',
          ubicacion: { latitud: 4.8073, longitud: -75.6866 },
          fotos: [],
          estadoActual: 'EN_PROCESO',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: false,
          nombreUsuario: 'Pedro Martínez'
        },
        {
          id: '7',
          titulo: 'Bache peligroso en vía principal',
          descripcion: 'Bache de gran tamaño en la vía principal que puede causar accidentes vehiculares.',
          fecha: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 6,
          idUsuario: 'user7',
          ubicacion: { latitud: 4.8103, longitud: -75.6876 },
          fotos: [],
          estadoActual: 'PENDIENTE',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: false,
          nombreUsuario: 'Luis González'
        }
      ];
      
      this.aplicarFiltros();
      console.log(`✅ ${this.reportes.length} reportes cargados exitosamente`);
      
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      this.error = 'Error al cargar los reportes. Por favor, intenta nuevamente.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Aplicar filtros a los reportes
   */
  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros:', this.filtros);
    
    let reportesFiltrados = [...this.reportes];
    
    // Filtro por estado
    if (this.filtros.estado && this.filtros.estado !== 'TODOS') {
      reportesFiltrados = reportesFiltrados.filter(r => r.estadoActual === this.filtros.estado);
    }
    
    // Filtro por ciudad
    if (this.filtros.ciudad && this.filtros.ciudad !== 'TODAS') {
      reportesFiltrados = reportesFiltrados.filter(r => r.ciudad === this.filtros.ciudad);
    }
    
    // Filtro por fechas
    if (this.filtros.fechaDesde) {
      const fechaDesde = new Date(this.filtros.fechaDesde);
      reportesFiltrados = reportesFiltrados.filter(r => new Date(r.fecha) >= fechaDesde);
    }
    
    if (this.filtros.fechaHasta) {
      const fechaHasta = new Date(this.filtros.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      reportesFiltrados = reportesFiltrados.filter(r => new Date(r.fecha) <= fechaHasta);
    }
    
    // Filtro por búsqueda
    if (this.filtros.busqueda) {
      const busqueda = this.filtros.busqueda.toLowerCase();
      reportesFiltrados = reportesFiltrados.filter(r => 
        r.titulo.toLowerCase().includes(busqueda) ||
        r.descripcion.toLowerCase().includes(busqueda) ||
        (r.nombreUsuario && r.nombreUsuario.toLowerCase().includes(busqueda))
      );
    }
    
    // Ordenamiento
    reportesFiltrados.sort((a, b) => {
      let valorA, valorB;
      
      switch (this.filtros.ordenarPor) {
        case 'fecha':
          valorA = new Date(a.fecha).getTime();
          valorB = new Date(b.fecha).getTime();
          break;
        case 'titulo':
          valorA = a.titulo.toLowerCase();
          valorB = b.titulo.toLowerCase();
          break;
        case 'estado':
          valorA = a.estadoActual;
          valorB = b.estadoActual;
          break;
        case 'prioridad':
          valorA = a.contadorImportante;
          valorB = b.contadorImportante;
          break;
        default:
          valorA = new Date(a.fecha).getTime();
          valorB = new Date(b.fecha).getTime();
      }
      
      if (this.filtros.direccion === 'asc') {
        return valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
      } else {
        return valorA > valorB ? -1 : valorA < valorB ? 1 : 0;
      }
    });
    
    this.reportesFiltrados = reportesFiltrados;
    this.calcularPaginacion();
    
    console.log(`📊 Filtros aplicados: ${this.reportesFiltrados.length} reportes encontrados`);
  }

  /**
   * Calcular paginación
   */
  private calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.reportesFiltrados.length / this.reportesPorPagina);
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = 1;
    }
  }

  /**
   * Obtener reportes de la página actual
   */
  get reportesPaginaActual(): ReporteDTO[] {
    const inicio = (this.paginaActual - 1) * this.reportesPorPagina;
    const fin = inicio + this.reportesPorPagina;
    return this.reportesFiltrados.slice(inicio, fin);
  }

  // === MÉTODOS DE ACCIONES SOBRE REPORTES ===

  /**
   * Verificar reporte
   */
  verificarReporte(reporte: ReporteDTO): void {
    console.log('✅ Iniciando verificación del reporte:', reporte.id);
    
    this.modalConfirmacion = {
      mostrar: true,
      titulo: 'Verificar Reporte',
      mensaje: `¿Estás seguro de que deseas marcar este reporte como VERIFICADO?<br><br><strong>${reporte.titulo}</strong>`,
      accion: { id: reporte.id, accion: 'verificar' },
      reporte
    };
  }

  /**
   * Rechazar reporte
   */
  rechazarReporte(reporte: ReporteDTO): void {
    console.log('❌ Iniciando rechazo del reporte:', reporte.id);
    
    this.reporteSeleccionado = reporte;
    this.motivoRechazo = '';
    
    this.modalConfirmacion = {
      mostrar: true,
      titulo: 'Rechazar Reporte',
      mensaje: `¿Estás seguro de que deseas RECHAZAR este reporte?<br><br><strong>${reporte.titulo}</strong><br><br>Debes proporcionar un motivo del rechazo.`,
      accion: { id: reporte.id, accion: 'rechazar' },
      reporte
    };
  }

  /**
   * Eliminar reporte
   */
  eliminarReporte(reporte: ReporteDTO): void {
    console.log('🗑️ Iniciando eliminación del reporte:', reporte.id);
    
    this.reporteSeleccionado = reporte;
    this.comentarioAdmin = '';
    
    this.modalConfirmacion = {
      mostrar: true,
      titulo: 'Eliminar Reporte',
      mensaje: `<div class="text-red-600"><strong>⚠️ ATENCIÓN:</strong> Esta acción NO se puede deshacer.</div><br>¿Estás seguro de que deseas ELIMINAR permanentemente este reporte?<br><br><strong>${reporte.titulo}</strong>`,
      accion: { id: reporte.id, accion: 'eliminar' },
      reporte
    };
  }

  /**
   * Marcar reporte como en proceso
   */
  marcarEnProceso(reporte: ReporteDTO): void {
    console.log('⚙️ Marcando reporte en proceso:', reporte.id);
    
    this.modalConfirmacion = {
      mostrar: true,
      titulo: 'Marcar En Proceso',
      mensaje: `¿Deseas marcar este reporte como EN PROCESO?<br><br><strong>${reporte.titulo}</strong>`,
      accion: { id: reporte.id, accion: 'en_proceso' },
      reporte
    };
  }

  /**
   * Confirmar acción sobre reporte
   */
  async confirmarAccion(): Promise<void> {
    if (!this.modalConfirmacion.accion || !this.modalConfirmacion.reporte) {
      console.error('❌ No hay acción o reporte para confirmar');
      return;
    }

    const { accion, reporte } = this.modalConfirmacion;
    
    // Validaciones específicas
    if (accion.accion === 'rechazar' && !this.motivoRechazo.trim()) {
      alert('Debes proporcionar un motivo para rechazar el reporte.');
      return;
    }
    
    console.log(`🔄 Ejecutando acción ${accion.accion} sobre reporte ${accion.id}`);
    
    this.procesandoAccion = true;
    
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Actualizar estado del reporte en la lista
      const reporteIndex = this.reportes.findIndex(r => r.id === accion.id);
      if (reporteIndex !== -1) {
        switch (accion.accion) {
          case 'verificar':
            this.reportes[reporteIndex].estadoActual = 'VERIFICADO';
            break;
          case 'rechazar':
            this.reportes[reporteIndex].estadoActual = 'RECHAZADO';
            // Aquí podrías agregar el motivo a los comentarios
            break;
          case 'en_proceso':
            this.reportes[reporteIndex].estadoActual = 'EN_PROCESO';
            break;
          case 'eliminar':
            // Eliminar reporte de la lista
            this.reportes.splice(reporteIndex, 1);
            break;
        }
      }
      
      // Reaplicar filtros
      this.aplicarFiltros();
      
      console.log(`✅ Acción ${accion.accion} ejecutada exitosamente`);
      
      // Mostrar mensaje de éxito
      this.mostrarMensajeExito(accion.accion);
      
    } catch (error) {
      console.error(`❌ Error ejecutando acción ${accion.accion}:`, error);
      alert('Error al procesar la acción. Por favor, intenta nuevamente.');
    } finally {
      this.procesandoAccion = false;
      this.cerrarModal();
      this.cdr.detectChanges();
    }
  }

  /**
   * Mostrar mensaje de éxito
   */
  private mostrarMensajeExito(accion: string): void {
    const mensajes = {
      verificar: '✅ Reporte verificado exitosamente',
      rechazar: '❌ Reporte rechazado exitosamente',
      eliminar: '🗑️ Reporte eliminado exitosamente',
      en_proceso: '⚙️ Reporte marcado como en proceso'
    };
    
    // Aquí podrías implementar un toast o notificación
    alert(mensajes[accion as keyof typeof mensajes] || 'Acción ejecutada exitosamente');
  }

  /**
   * Cerrar modal de confirmación
   */
  cerrarModal(): void {
    this.modalConfirmacion = {
      mostrar: false,
      titulo: '',
      mensaje: '',
      accion: null,
      reporte: null
    };
    
    this.reporteSeleccionado = null;
    this.motivoRechazo = '';
    this.comentarioAdmin = '';
  }

  // === MÉTODOS DE NAVEGACIÓN Y UTILIDADES ===

  /**
   * Ver detalles del reporte
   */
  verDetallesReporte(reporte: ReporteDTO): void {
    console.log('👁️ Viendo detalles del reporte:', reporte.id);
    // Aquí podrías navegar a una página de detalles
    // this.router.navigate(['/admin/reporte-detalle', reporte.id]);
  }

  /**
   * Cambiar página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      console.log(`📄 Cambiando a página ${pagina}`);
    }
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    console.log('🧹 Limpiando filtros');
    
    this.filtros = {
      estado: 'TODOS',
      fechaDesde: '',
      fechaHasta: '',
      ciudad: 'TODAS',
      busqueda: '',
      ordenarPor: 'fecha',
      direccion: 'desc'
    };
    
    this.inicializarFiltros();
    this.aplicarFiltros();
  }

  /**
   * Volver al dashboard admin
   */
  volverAlDashboard(): void {
    console.log('🏠 Volviendo al dashboard admin');
    this.router.navigate(['/principal-admin']);
  }

  /**
   * Obtener clase CSS para el estado
   */
  getEstadoClass(estado: string): string {
    const clases = {
      'PENDIENTE': 'estado-pendiente',
      'EN_PROCESO': 'estado-en-proceso',
      'VERIFICADO': 'estado-verificado',
      'RECHAZADO': 'estado-rechazado'
    };
    
    return clases[estado as keyof typeof clases] || 'estado-default';
  }

  /**
   * Obtener etiqueta amigable del estado
   */
  getEstadoEtiqueta(estado: string): string {
    const etiquetas = {
      'PENDIENTE': 'Pendiente',
      'EN_PROCESO': 'En Proceso',
      'VERIFICADO': 'Verificado',
      'RECHAZADO': 'Rechazado'
    };
    
    return etiquetas[estado as keyof typeof etiquetas] || estado;
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener tiempo transcurrido
   */
  getTiempoTranscurrido(fecha: string): string {
    const ahora = new Date();
    const fechaReporte = new Date(fecha);
    const diffMs = ahora.getTime() - fechaReporte.getTime();
    
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);
    
    if (diffDias > 0) {
      return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    } else if (diffHoras > 0) {
      return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    } else {
      const diffMinutos = Math.floor(diffMs / (1000 * 60));
      return `Hace ${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`;
    }
  }

  /**
   * Obtener nivel de prioridad
   */
  getNivelPrioridad(contador: number): { clase: string, etiqueta: string } {
    if (contador >= 5) {
      return { clase: 'prioridad-alta', etiqueta: 'Alta' };
    } else if (contador >= 2) {
      return { clase: 'prioridad-media', etiqueta: 'Media' };
    } else {
      return { clase: 'prioridad-baja', etiqueta: 'Baja' };
    }
  }
}