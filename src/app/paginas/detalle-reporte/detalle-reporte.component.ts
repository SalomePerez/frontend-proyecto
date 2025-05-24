import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
  detallesAdicionales?: {
    telefono?: string;
    email?: string;
    testigos?: string[];
    evidencias?: string[];
  };
}

@Component({
  selector: 'app-detalle-reporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-reporte.component.html',
  styleUrls: ['./detalle-reporte.component.css']
})
export class DetalleReporteComponent implements OnInit, OnDestroy {
  
  reporte: Reporte | null = null;
  isLoading: boolean = true;
  reporteId: number | null = null;
  userName: string = 'Cliente SegurApp';
  
  // Datos simulados de reportes (en producción vendría de un servicio)
  private reportesData: Reporte[] = [
    {
      id: 1,
      titulo: 'Robo en la calle 45',
      descripcion: 'Se presentó un robo a mano armada en la calle 45 con carrera 12. Los delincuentes se movilizaban en motocicleta de color negro, eran dos personas con cascos integrales. Sustrajeron un celular y una billetera. El incidente ocurrió aproximadamente a las 10:30 AM cuando la víctima se dirigía a su trabajo.',
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
      imagenes: ['assets/reporte1.jpg', 'assets/reporte1-2.jpg'],
      comentariosAdmin: 'Se ha enviado patrulla al área. Caso bajo investigación. Se han revisado las cámaras de seguridad de la zona.',
      detallesAdicionales: {
        telefono: '300-123-4567',
        email: 'usuario@email.com',
        testigos: ['Juan Pérez (Transeúnte)', 'María García (Propietaria de tienda)'],
        evidencias: ['Fotografía de la escena', 'Video de cámara de seguridad']
      }
    },
    {
      id: 2,
      titulo: 'Semáforo dañado',
      descripcion: 'El semáforo de la intersección está completamente apagado, causando congestión vehicular y poniendo en riesgo la seguridad de los peatones y conductores.',
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
      comentariosAdmin: 'Semáforo reparado el 15/01/2024. Funcionando correctamente. Se realizó mantenimiento preventivo.',
      detallesAdicionales: {
        telefono: '300-987-6543',
        email: 'usuario2@email.com',
        evidencias: ['Fotografía del semáforo dañado', 'Reporte técnico']
      }
    },
    {
      id: 3,
      titulo: 'Accidente de tránsito',
      descripcion: 'Colisión entre dos vehículos particulares. Se requiere presencia de tránsito y ambulancia. Hay heridos leves.',
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
      comentariosAdmin: 'Atendido por servicios de emergencia. Vía despejada. Heridos trasladados al hospital.',
      detallesAdicionales: {
        telefono: '300-555-1234',
        email: 'testigo@email.com',
        testigos: ['Carlos Rodríguez (Conductor testigo)', 'Ana López (Peatón)'],
        evidencias: ['Fotografías del accidente', 'Parte policial', 'Reporte médico']
      }
    },
    {
      id: 4,
      titulo: 'Ruido excesivo',
      descripcion: 'Establecimiento comercial con música a alto volumen durante horas no permitidas, afectando el descanso de los residentes.',
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
      detallesAdicionales: {
        telefono: '300-111-2222',
        email: 'vecino@email.com',
        evidencias: ['Audio grabado', 'Fotografía del establecimiento']
      }
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loadUserData();
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.reporteId = params['id'] ? parseInt(params['id']) : null;
        if (this.reporteId) {
          this.loadReporteDetalle();
        } else {
          this.router.navigate(['/mis-reportes']);
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

  private loadReporteDetalle(): void {
    this.isLoading = true;
    
    // Simular carga desde servidor
    setTimeout(() => {
      this.reporte = this.reportesData.find(r => r.id === this.reporteId) || null;
      
      if (!this.reporte) {
        console.error('Reporte no encontrado');
        this.router.navigate(['/mis-reportes']);
        return;
      }
      
      this.isLoading = false;
    }, 1000);
  }

  // Métodos de navegación
  goBack(): void {
    this.router.navigate(['/mis-reportes']);
  }

  editarReporte(): void {
    if (this.reporte && this.reporte.estado === 'pendiente') {
      this.router.navigate(['/editar-reporte'], { 
        queryParams: { id: this.reporte.id } 
      });
    }
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
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
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

  // Método para abrir ubicación en Google Maps
  abrirUbicacion(): void {
    if (this.reporte) {
      const url = `https://www.google.com/maps?q=${this.reporte.ubicacion.lat},${this.reporte.ubicacion.lng}`;
      window.open(url, '_blank');
    }
  }

  // Método para descargar reporte como PDF (simulado)
  descargarReporte(): void {
    alert('Funcionalidad de descarga en desarrollo. El reporte se descargará como PDF.');
  }

  // Métodos auxiliares para verificar existencia de arrays
  hasTestigos(): boolean {
    return !!(this.reporte?.detallesAdicionales?.testigos && this.reporte.detallesAdicionales.testigos.length > 0);
  }

  hasEvidencias(): boolean {
    return !!(this.reporte?.detallesAdicionales?.evidencias && this.reporte.detallesAdicionales.evidencias.length > 0);
  }
}