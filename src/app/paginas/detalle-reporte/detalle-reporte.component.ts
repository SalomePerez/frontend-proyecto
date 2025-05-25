import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✨ INTEGRACIÓN CON BACKEND
import { ReporteService, MiReporteDTO } from '../../servicios/reporte.service';

// Interface local para compatibilidad con el template
interface ReporteLocal {
  id: string; // ✨ CAMBIAR A STRING
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
  esPropio?: boolean;
  comentarios?: Comentario[];
  detallesAdicionales?: {
    telefono?: string;
    email?: string;
    testigos?: string[];
    evidencias?: string[];
  };
}

interface Comentario {
  id: number;
  texto: string;
  autor: string;
  fechaCreacion: string;
  esAdmin: boolean;
  esPropio: boolean;
  avatar?: string;
}

@Component({
  selector: 'app-detalle-reporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-reporte.component.html',
  styleUrls: ['./detalle-reporte.component.css']
})
export class DetalleReporteComponent implements OnInit, OnDestroy {
  
  reporte: ReporteLocal | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  reporteId: string | null = null; // ✨ CAMBIAR A STRING
  userName: string = 'Cliente SegurApp';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reporteService: ReporteService // ✨ INYECTAR SERVICIO
  ) {
    this.loadUserData();
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.reporteId = params['id'] || null;
        if (this.reporteId) {
          this.loadReporteDetalle();
        } else {
          this.hasError = true;
          this.errorMessage = 'No se especificó un ID de reporte válido';
          this.isLoading = false;
        }
      });
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

  // ✨ MÉTODO ACTUALIZADO PARA USAR BACKEND
  private loadReporteDetalle(): void {
    if (!this.reporteId) {
      this.hasError = true;
      this.errorMessage = 'ID de reporte no válido';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    console.log('📄 Cargando detalles del reporte:', this.reporteId);
    
    this.reporteService.obtenerDetalleReporte(this.reporteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (miReporte) => {
          console.log('✅ Detalles del reporte cargados:', miReporte);
          
          // Convertir MiReporteDTO a formato local
          this.reporte = this.convertirMiReporteALocal(miReporte);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error cargando detalles del reporte:', error);
          this.hasError = true;
          this.errorMessage = error.message || 'Error al cargar los detalles del reporte';
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
  private convertirMiReporteALocal(miReporte: MiReporteDTO): ReporteLocal {
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
      esPropio: true, // Siempre true ya que es mi reporte
      detallesAdicionales: {
        // Estos campos no vienen del backend directamente, podrías agregarlos si es necesario
        telefono: undefined,
        email: undefined,
        testigos: [],
        evidencias: []
      }
    };
  }

  // Métodos de navegación
  goBack(): void {
    this.router.navigate(['/reportes-propios']);
  }

  editarReporte(): void {
    if (this.reporte && this.reporte.estado === 'pendiente') {
      this.router.navigate(['/editar-reporte'], { 
        queryParams: { id: this.reporte.id } 
      });
    } else {
      alert('Solo puedes editar reportes que estén en estado pendiente');
    }
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

  getPrioridadTexto(prioridad: string): string {
    switch (prioridad) {
      case 'baja':
        return 'Baja';
      case 'media':
        return 'Media';
      case 'alta':
        return 'Alta';
      case 'critica':
        return 'Crítica';
      default:
        return 'Baja';
    }
  }

  formatFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
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

  verDetalleReporte(reporteId: string): void {
    this.router.navigate(['/detalle-reporte'], { queryParams: { id: reporteId } });
  }

  // Método para abrir ubicación en Google Maps
  abrirUbicacion(): void {
    if (this.reporte) {
      const url = `https://www.google.com/maps?q=${this.reporte.ubicacion.lat},${this.reporte.ubicacion.lng}`;
      window.open(url, '_blank');
    }
  }

  // Método para descargar reporte como PDF (simulado)
  descargarReporte(): void {
    console.log('📄 Descargando reporte:', this.reporteId);
    alert('Funcionalidad de descarga en desarrollo. El reporte se descargará como PDF.');
  }

  // Métodos auxiliares para verificar existencia de arrays
  hasTestigos(): boolean {
    return !!(this.reporte?.detallesAdicionales?.testigos && this.reporte.detallesAdicionales.testigos.length > 0);
  }

  hasEvidencias(): boolean {
    return !!(this.reporte?.detallesAdicionales?.evidencias && this.reporte.detallesAdicionales.evidencias.length > 0);
  }

  verImagenCompleta(imagen: string): void {
  // Por ejemplo, abrir la imagen en una nueva pestaña
  window.open(imagen, '_blank');
}
}