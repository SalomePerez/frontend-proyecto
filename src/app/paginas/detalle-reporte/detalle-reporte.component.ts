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
  
  reporte: Reporte | null = null;
  isLoading: boolean = true;
  reporteId: number | null = null;
  userName: string = 'Cliente SegurApp';
  
  // ✅ DATOS SINCRONIZADOS CON reportes-propios.component.ts
  private reportesData: Reporte[] = [
    {
      id: 1,
      titulo: 'Robo en mi cuadra',
      descripcion: 'Vi un robo a mano armada en la calle 45 con carrera 12. Los delincuentes se movilizaban en motocicleta negra, eran dos personas, una conducía y la otra amenazó con un arma de fuego a una señora que caminaba por la acera. Le quitaron el bolso y el celular. Todo ocurrió aproximadamente a las 8:30 PM. La señora gritó pidiendo ayuda pero cuando salimos ya se habían ido. Llamamos inmediatamente a la policía.',
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
      esPropio: true,
      detallesAdicionales: {
        telefono: '300-123-4567',
        email: 'usuario@email.com',
        testigos: ['Juan Pérez (Transeúnte)', 'María García (Propietaria de tienda)'],
        evidencias: ['Fotografía de la escena', 'Video de cámara de seguridad']
      }
    },
    {
      id: 4,
      titulo: 'Ruido excesivo del bar',
      descripcion: 'El bar de mi cuadra tiene música muy alta todas las noches después de las 11 PM, violando las normas de ruido establecidas por la alcaldía. Esto viene sucediendo desde hace aproximadamente 3 semanas. He intentado hablar con el dueño pero no ha dado resultado. La música se extiende hasta altas horas de la madrugada (2-3 AM) afectando el descanso de todos los vecinos, especialmente de los niños y personas mayores del sector.',
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
      esPropio: true,
      detallesAdicionales: {
        telefono: '300-111-2222',
        email: 'vecino@email.com',
        evidencias: ['Audio grabado', 'Fotografía del establecimiento']
      }
    },
    {
      id: 8,
      titulo: 'Hueco peligroso en la vía',
      descripcion: 'Hay un hueco muy grande en la carrera 15 que está causando accidentes de motocicletas y daños a vehículos. El hueco tiene aproximadamente 80 cm de diámetro y 30 cm de profundidad. Se formó después de las lluvias de la semana pasada. Ya he visto al menos 3 motociclistas que han tenido problemas al pasar por ahí, uno de ellos se cayó y se lastimó el brazo. Es urgente que se repare antes de que ocurra un accidente más grave.',
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
      esPropio: true,
      detallesAdicionales: {
        telefono: '300-987-6543',
        email: 'usuario3@email.com',
        evidencias: ['Fotografía del hueco', 'Video del incidente']
      }
    },
    {
      id: 12,
      titulo: 'Peligro: Cables eléctricos sueltos',
      descripcion: 'Cables de alta tensión colgando peligrosamente sobre la calle después de la tormenta de ayer. Los cables están aproximadamente a 3 metros del suelo, lo que representa un grave peligro para peatones y vehículos altos. Se pueden ver chispas ocasionales cuando el viento los mueve. La situación es muy peligrosa y requiere atención inmediata de la empresa de energía.',
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
      esPropio: true,
      detallesAdicionales: {
        telefono: '300-555-1234',
        email: 'usuario4@email.com',
        testigos: ['Carlos Rodríguez (Vecino)', 'Ana López (Transeúnte)'],
        evidencias: ['Fotografía de los cables', 'Reporte técnico de la empresa eléctrica']
      }
    },
    {
      id: 15,
      titulo: 'Intento de robo a mi vehículo',
      descripcion: 'Intentaron robar mi carro en el parqueadero del supermercado. Los ladrones huyeron cuando llegué. Encontré la ventana del conductor rota y evidencia de que intentaron forzar la ignición. El incidente ocurrió el sábado en la tarde, aproximadamente a las 4 PM. El centro comercial tiene cámaras de seguridad que podrían haber grabado el incidente. También hay testigos que vieron a dos sujetos sospechosos rondando los vehículos.',
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
      esPropio: true,
      detallesAdicionales: {
        telefono: '300-777-8888',
        email: 'usuario5@email.com',
        testigos: ['Pedro Martínez (Vigilante)', 'Laura Sánchez (Cliente)'],
        evidencias: ['Fotografía del vehículo dañado', 'Video de cámaras de seguridad']
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
          this.router.navigate(['/reportes-propios']); // ✅ Cambié la navegación de regreso
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
        this.router.navigate(['/reportes-propios']); // ✅ Cambié la navegación de regreso
        return;
      }
      
      this.isLoading = false;
    }, 1000);
  }

  // Métodos de navegación
  goBack(): void {
    this.router.navigate(['/reportes-propios']); // ✅ Cambié la navegación de regreso
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

  verDetalleReporte(reporteId: number): void {
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