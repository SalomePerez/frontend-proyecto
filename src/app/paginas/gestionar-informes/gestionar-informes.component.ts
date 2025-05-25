import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MapaService, ReporteDTO } from '../../servicios/mapa.service';
import { AuthService } from '../../servicios/auth.service';

// Interfaces para gestión de informes
interface FiltrosInforme {
  categoria: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
  ciudad: string;
  tipoInforme: string;
  incluirGraficos: boolean;
  incluirMapas: boolean;
  incluirEstadisticas: boolean;
}

interface ConfigInforme {
  titulo: string;
  descripcion: string;
  autor: string;
  fechaCreacion: string;
  filtros: FiltrosInforme;
  reportesIncluidos: ReporteDTO[];
  estadisticas: EstadisticasInforme;
}

interface EstadisticasInforme {
  totalReportes: number;
  reportesPorEstado: { [key: string]: number };
  reportesPorCategoria: { [key: string]: number };
  reportesPorCiudad: { [key: string]: number };
  promedioResolucion: number;
  reportesMasImportantes: ReporteDTO[];
}

interface InformeGuardado {
  id: string;
  titulo: string;
  fechaCreacion: string;
  autor: string;
  totalReportes: number;
  estado: 'BORRADOR' | 'GENERADO' | 'PUBLICADO';
}

@Component({
  selector: 'app-gestionar-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-informes.component.html',
  styleUrls: ['./gestionar-informes.component.css']
})
export class GestionarInformesComponent implements OnInit, OnDestroy {
  
  // Estado principal
  reportes: ReporteDTO[] = [];
  reportesFiltrados: ReporteDTO[] = [];
  informesGuardados: InformeGuardado[] = [];
  
  // Estados de la UI
  isLoading: boolean = true;
  isGeneratingReport: boolean = false;
  error: string = '';
  vistaActual: 'lista' | 'crear' | 'preview' = 'lista';
  
  // Configuración del informe actual
  configInforme: ConfigInforme = {
    titulo: '',
    descripcion: '',
    autor: '',
    fechaCreacion: new Date().toISOString(),
    filtros: {
      categoria: 'TODAS',
      estado: 'TODOS',
      fechaDesde: '',
      fechaHasta: '',
      ciudad: 'TODAS',
      tipoInforme: 'COMPLETO',
      incluirGraficos: true,
      incluirMapas: true,
      incluirEstadisticas: true
    },
    reportesIncluidos: [],
    estadisticas: {
      totalReportes: 0,
      reportesPorEstado: {},
      reportesPorCategoria: {},
      reportesPorCiudad: {},
      promedioResolucion: 0,
      reportesMasImportantes: []
    }
  };

  // Opciones para filtros
  categoriasDisponibles = [
    { valor: 'TODAS', etiqueta: 'Todas las categorías' },
    { valor: 'SEGURIDAD', etiqueta: 'Seguridad Ciudadana' },
    { valor: 'INFRAESTRUCTURA', etiqueta: 'Infraestructura' },
    { valor: 'SERVICIOS', etiqueta: 'Servicios Públicos' },
    { valor: 'MEDIO_AMBIENTE', etiqueta: 'Medio Ambiente' },
    { valor: 'TRANSPORTE', etiqueta: 'Transporte' },
    { valor: 'OTROS', etiqueta: 'Otros' }
  ];

  estadosDisponibles = [
    { valor: 'TODOS', etiqueta: 'Todos los estados' },
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

  tiposInforme = [
    { valor: 'COMPLETO', etiqueta: 'Informe Completo' },
    { valor: 'EJECUTIVO', etiqueta: 'Resumen Ejecutivo' },
    { valor: 'ESTADISTICO', etiqueta: 'Análisis Estadístico' },
    { valor: 'GEOGRAFICO', etiqueta: 'Análisis Geográfico' }
  ];

  // Exponer Object para uso en template
  Object = Object;
  
  // Método para obtener fecha actual en template
  getCurrentDate(): string {
    return new Date().toISOString();
  }

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private mapaService: MapaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🏗️ Inicializando GestionarInformesComponent...');
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Cargando gestión de informes...');
    
    // Verificar permisos de administrador
    if (!this.verificarPermisoAdmin()) {
      console.error('❌ Usuario sin permisos de administrador');
      this.router.navigate(['/home']);
      return;
    }
    
    this.inicializarConfiguracion();
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    console.log('💀 ngOnDestroy - Limpiando recursos gestión informes...');
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
   * Inicializar configuración por defecto
   */
  private inicializarConfiguracion(): void {
    const usuario = this.authService.getCurrentUser();
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    this.configInforme.autor = usuario?.nombre || 'Administrador';
    this.configInforme.filtros.fechaHasta = hoy.toISOString().split('T')[0];
    this.configInforme.filtros.fechaDesde = hace30Dias.toISOString().split('T')[0];
    this.configInforme.titulo = `Informe de Reportes - ${this.formatearFecha(hoy.toISOString())}`;
  }

  /**
   * Cargar datos iniciales
   */
  async cargarDatos(): Promise<void> {
    console.log('📊 Cargando datos para informes...');
    
    this.isLoading = true;
    this.error = '';
    
    try {
      // Simular carga desde API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Cargar reportes (mock data)
      this.reportes = [
        {
          id: '1',
          titulo: 'Semáforo dañado en Av. Circunvalar',
          descripcion: 'El semáforo de la intersección Circunvalar con Calle 15 no está funcionando correctamente.',
          fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 3,
          idUsuario: 'user1',
          ubicacion: { latitud: 4.8143, longitud: -75.6946 },
          fotos: [],
          estadoActual: 'PENDIENTE',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: false,
          nombreUsuario: 'Juan Pérez',
        },
        {
          id: '2',
          titulo: 'Robo a mano armada',
          descripcion: 'Se reportó un robo a mano armada en esta zona durante la madrugada.',
          fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 8,
          idUsuario: 'user2',
          ubicacion: { latitud: 4.8093, longitud: -75.6906 },
          fotos: [],
          estadoActual: 'EN_PROCESO',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: false,
          nombreUsuario: 'María García',
        },
        {
          id: '3',
          titulo: 'Hueco profundo en Carrera 15',
          descripcion: 'Hueco profundo que puede causar accidentes vehiculares.',
          fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 1,
          idUsuario: 'user3',
          ubicacion: { latitud: 4.8113, longitud: -75.6976 },
          fotos: [],
          estadoActual: 'VERIFICADO',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: true,
        },
        {
          id: '4',
          titulo: 'Alumbrado público deficiente',
          descripcion: 'Varias luminarias del sector están fundidas.',
          fecha: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          contadorImportante: 2,
          idUsuario: 'user5',
          ubicacion: { latitud: 4.8053, longitud: -75.6926 },
          fotos: [],
          estadoActual: 'PENDIENTE',
          ciudad: 'PEREIRA',
          comentarios: [],
          esAnonimo: false,
          nombreUsuario: 'Ana Rodríguez',
        }
      ];
      
      // Cargar informes guardados (mock data)
      this.informesGuardados = [
        {
          id: '1',
          titulo: 'Informe Mensual - Octubre 2024',
          fechaCreacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          autor: 'Administrador',
          totalReportes: 25,
          estado: 'PUBLICADO'
        },
        {
          id: '2',
          titulo: 'Análisis Seguridad Centro',
          fechaCreacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          autor: 'Administrador',
          totalReportes: 12,
          estado: 'GENERADO'
        }
      ];
      
      this.aplicarFiltros();
      console.log(`✅ Datos cargados: ${this.reportes.length} reportes, ${this.informesGuardados.length} informes`);
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      this.error = 'Error al cargar los datos. Por favor, intenta nuevamente.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Aplicar filtros a los reportes
   */
  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros al informe:', this.configInforme.filtros);
    
    let reportesFiltrados = [...this.reportes];
    const filtros = this.configInforme.filtros;
    
    // Filtro por categoría
    if (filtros.categoria && filtros.categoria !== 'TODAS') {
      reportesFiltrados = reportesFiltrados.filter(r => 
        (r as any).categoria === filtros.categoria
      );
    }
    
    // Filtro por estado
    if (filtros.estado && filtros.estado !== 'TODOS') {
      reportesFiltrados = reportesFiltrados.filter(r => r.estadoActual === filtros.estado);
    }
    
    // Filtro por ciudad
    if (filtros.ciudad && filtros.ciudad !== 'TODAS') {
      reportesFiltrados = reportesFiltrados.filter(r => r.ciudad === filtros.ciudad);
    }
    
    // Filtro por fechas
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde);
      reportesFiltrados = reportesFiltrados.filter(r => new Date(r.fecha) >= fechaDesde);
    }
    
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      reportesFiltrados = reportesFiltrados.filter(r => new Date(r.fecha) <= fechaHasta);
    }
    
    this.reportesFiltrados = reportesFiltrados;
    this.configInforme.reportesIncluidos = reportesFiltrados;
    this.calcularEstadisticas();
    
    console.log(`📊 Filtros aplicados: ${this.reportesFiltrados.length} reportes incluidos`);
  }

  /**
   * Calcular estadísticas del informe
   */
  private calcularEstadisticas(): void {
    const reportes = this.configInforme.reportesIncluidos;
    
    // Estadísticas por estado
    const reportesPorEstado: { [key: string]: number } = {};
    reportes.forEach(r => {
      reportesPorEstado[r.estadoActual] = (reportesPorEstado[r.estadoActual] || 0) + 1;
    });
    
    // Estadísticas por categoría
    const reportesPorCategoria: { [key: string]: number } = {};
    reportes.forEach(r => {
      const categoria = (r as any).categoria || 'SIN_CATEGORIA';
      reportesPorCategoria[categoria] = (reportesPorCategoria[categoria] || 0) + 1;
    });
    
    // Estadísticas por ciudad
    const reportesPorCiudad: { [key: string]: number } = {};
    reportes.forEach(r => {
      reportesPorCiudad[r.ciudad] = (reportesPorCiudad[r.ciudad] || 0) + 1;
    });
    
    // Reportes más importantes
    const reportesMasImportantes = [...reportes]
      .sort((a, b) => b.contadorImportante - a.contadorImportante)
      .slice(0, 5);
    
    this.configInforme.estadisticas = {
      totalReportes: reportes.length,
      reportesPorEstado,
      reportesPorCategoria,
      reportesPorCiudad,
      promedioResolucion: this.calcularPromedioResolucion(reportes),
      reportesMasImportantes
    };
  }

  /**
   * Calcular promedio de resolución (mock)
   */
  private calcularPromedioResolucion(reportes: ReporteDTO[]): number {
    const reportesResueltos = reportes.filter(r => r.estadoActual === 'VERIFICADO');
    if (reportesResueltos.length === 0) return 0;
    
    // Simulación de cálculo de días promedio
    return Math.round(Math.random() * 10 + 2); // Entre 2 y 12 días
  }

  // === MÉTODOS DE NAVEGACIÓN ===

  /**
   * Cambiar vista actual
   */
  cambiarVista(vista: 'lista' | 'crear' | 'preview'): void {
    console.log(`🔄 Cambiando vista a: ${vista}`);
    this.vistaActual = vista;
    
    if (vista === 'crear') {
      this.aplicarFiltros();
    }
  }

  /**
   * Volver al dashboard
   */
  volverAlDashboard(): void {
    console.log('🏠 Volviendo al dashboard admin');
    this.router.navigate(['/principal-admin']);
  }

  // === MÉTODOS DE GESTIÓN DE INFORMES ===

  /**
   * Crear nuevo informe
   */
  nuevoInforme(): void {
    console.log('📝 Iniciando creación de nuevo informe');
    this.inicializarConfiguracion();
    this.cambiarVista('crear');
  }

  /**
   * Generar preview del informe
   */
  generarPreview(): void {
    console.log('👁️ Generando preview del informe');
    
    if (!this.validarConfiguracion()) {
      return;
    }
    
    this.aplicarFiltros();
    this.cambiarVista('preview');
  }

  /**
   * Validar configuración del informe
   */
  private validarConfiguracion(): boolean {
    if (!this.configInforme.titulo.trim()) {
      alert('Por favor, ingresa un título para el informe.');
      return false;
    }
    
    if (!this.configInforme.descripcion.trim()) {
      alert('Por favor, ingresa una descripción para el informe.');
      return false;
    }
    
    if (this.configInforme.reportesIncluidos.length === 0) {
      alert('No hay reportes que cumplan con los filtros seleccionados.');
      return false;
    }
    
    return true;
  }

  /**
   * Generar PDF del informe
   */
  async generarPDF(): Promise<void> {
    console.log('📄 Generando PDF del informe...');
    
    if (!this.validarConfiguracion()) {
      return;
    }
    
    this.isGeneratingReport = true;
    
    try {
      // Simular generación de PDF
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // En producción, aquí llamarías a un servicio para generar el PDF
      this.descargarPDF();
      
      console.log('✅ PDF generado exitosamente');
      alert('Informe PDF generado exitosamente y descargado.');
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      this.isGeneratingReport = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Simular descarga de PDF
   */
  private descargarPDF(): void {
    const contenidoPDF = this.generarContenidoPDF();
    const blob = new Blob([contenidoPDF], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.configInforme.titulo.replace(/\s+/g, '_')}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generar contenido del PDF (simulado)
   */
  private generarContenidoPDF(): string {
    const config = this.configInforme;
    const stats = config.estadisticas;
    
    return `
INFORME DE REPORTES CIUDADANOS
===============================

Título: ${config.titulo}
Descripción: ${config.descripcion}
Autor: ${config.autor}
Fecha de Creación: ${this.formatearFecha(config.fechaCreacion)}

FILTROS APLICADOS
-----------------
- Categoría: ${config.filtros.categoria}
- Estado: ${config.filtros.estado}
- Ciudad: ${config.filtros.ciudad}
- Fecha Desde: ${config.filtros.fechaDesde}
- Fecha Hasta: ${config.filtros.fechaHasta}
- Tipo de Informe: ${config.filtros.tipoInforme}

ESTADÍSTICAS GENERALES
----------------------
Total de Reportes: ${stats.totalReportes}
Promedio de Resolución: ${stats.promedioResolucion} días

Reportes por Estado:
${Object.entries(stats.reportesPorEstado).map(([estado, count]) => 
  `- ${estado}: ${count}`).join('\n')}

Reportes por Categoría:
${Object.entries(stats.reportesPorCategoria).map(([categoria, count]) => 
  `- ${categoria}: ${count}`).join('\n')}

REPORTES MÁS IMPORTANTES
------------------------
${stats.reportesMasImportantes.map((r, i) => 
  `${i + 1}. ${r.titulo} (Importancia: ${r.contadorImportante})`).join('\n')}

DETALLE DE REPORTES
-------------------
${config.reportesIncluidos.map((r, i) => 
  `${i + 1}. ${r.titulo}
   - Estado: ${r.estadoActual}
   - Fecha: ${this.formatearFecha(r.fecha)}
   - Ciudad: ${r.ciudad}
   - Importancia: ${r.contadorImportante}
   - Descripción: ${r.descripcion}
   ---`).join('\n')}

Informe generado por SegurApp
Fecha de generación: ${this.formatearFecha(new Date().toISOString())}
    `;
  }

  /**
   * Guardar informe como borrador
   */
  async guardarBorrador(): Promise<void> {
    console.log('💾 Guardando informe como borrador...');
    
    if (!this.configInforme.titulo.trim()) {
      alert('Por favor, ingresa un título para el informe.');
      return;
    }
    
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const nuevoBorrador: InformeGuardado = {
        id: Date.now().toString(),
        titulo: this.configInforme.titulo,
        fechaCreacion: new Date().toISOString(),
        autor: this.configInforme.autor,
        totalReportes: this.configInforme.reportesIncluidos.length,
        estado: 'BORRADOR'
      };
      
      this.informesGuardados.unshift(nuevoBorrador);
      
      console.log('✅ Borrador guardado exitosamente');
      alert('Informe guardado como borrador exitosamente.');
      
    } catch (error) {
      console.error('❌ Error guardando borrador:', error);
      alert('Error al guardar el borrador. Por favor, intenta nuevamente.');
    }
  }

  /**
   * Eliminar informe guardado
   */
  async eliminarInforme(informeId: string): Promise<void> {
    if (!confirm('¿Estás seguro de que deseas eliminar este informe?')) {
      return;
    }
    
    console.log(`🗑️ Eliminando informe: ${informeId}`);
    
    try {
      // Simular eliminación
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.informesGuardados = this.informesGuardados.filter(i => i.id !== informeId);
      
      console.log('✅ Informe eliminado exitosamente');
      
    } catch (error) {
      console.error('❌ Error eliminando informe:', error);
      alert('Error al eliminar el informe. Por favor, intenta nuevamente.');
    }
  }

  // === MÉTODOS DE UTILIDAD ===

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener clase CSS para el estado del informe
   */
  getEstadoInformeClass(estado: string): string {
    const clases = {
      'BORRADOR': 'estado-borrador',
      'GENERADO': 'estado-generado',
      'PUBLICADO': 'estado-publicado'
    };
    
    return clases[estado as keyof typeof clases] || 'estado-default';
  }

  /**
   * Obtener etiqueta del estado del informe
   */
  getEstadoInformeEtiqueta(estado: string): string {
    const etiquetas = {
      'BORRADOR': 'Borrador',
      'GENERADO': 'Generado',
      'PUBLICADO': 'Publicado'
    };
    
    return etiquetas[estado as keyof typeof etiquetas] || estado;
  }

  /**
   * Obtener clase CSS para el estado del reporte
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
   * Obtener porcentaje para gráficos
   */
  getPorcentaje(valor: number, total: number): number {
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }
}