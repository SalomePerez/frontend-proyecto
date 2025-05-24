import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interface del reporte de la comunidad
interface ReporteSubido {
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
  autor: {
    nombre: string;
    avatar?: string;
    verificado: boolean;
  };
  estadisticas: {
    vistas: number;
    reacciones: number;
    comentarios: number;
  };
  detallesAdicionales?: {
    telefono?: string;
    email?: string;
    testigos?: string[];
    evidencias?: string[];
  };
  comentarios?: ComentarioComunidad[];
}

interface ComentarioComunidad {
  id: number;
  texto: string;
  autor: string;
  fechaCreacion: string;
  esAdmin: boolean;
  avatar?: string;
  reacciones: number;
}

@Component({
  selector: 'app-detalles-reportes-subidos',  // ← Cambiar a plural
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalles-reportes-subidos.component.html',  // ← Cambiar a plural
  styleUrls: ['./detalles-reportes-subidos.component.css']   // ← Cambiar a plural
})

export class DetalleReporteSubidosComponent implements OnInit, OnDestroy {
  
  reporte: ReporteSubido | null = null;
  isLoading: boolean = true;
  reporteId: number | null = null;
  userName: string = 'Cliente SegurApp';
  
  // ✅ DATOS DE REPORTES DE LA COMUNIDAD (diferentes a los propios)
  private reportesSubidosData: ReporteSubido[] = [
    {
      id: 2,
      titulo: 'Semáforo dañado causa accidentes',
      descripcion: 'El semáforo de la intersección de la Avenida Caracas con Calle 63 lleva 3 días sin funcionar. Esto está causando mucha congestión vehicular y ya han ocurrido varios accidentes menores. Los conductores no saben cuándo pueden pasar y se forman trancones terribles. Es muy peligroso para peatones también. Solicito que por favor reparen este semáforo urgentemente antes de que ocurra algo más grave.',
      categoria: 'infraestructura',
      estado: 'en_proceso',
      prioridad: 'alta',
      fechaCreacion: '2024-01-14T16:45:00',
      fechaActualizacion: '2024-01-15T09:30:00',
      ubicacion: {
        direccion: 'Av. Caracas con Calle 63, Bogotá',
        lat: 4.6486,
        lng: -74.0639
      },
      imagenes: ['assets/semaforo1.jpg', 'assets/semaforo2.jpg'],
      comentariosAdmin: 'Reporte recibido. Equipo técnico enviado para evaluación.',
      autor: {
        nombre: 'María González',
        avatar: 'assets/avatar1.jpg',
        verificado: true
      },
      estadisticas: {
        vistas: 245,
        reacciones: 12,
        comentarios: 8
      },
      detallesAdicionales: {
        telefono: '300-555-0123',
        evidencias: ['Fotografías del semáforo', 'Video del tráfico congestionado']
      }
    },
    {
      id: 3,
      titulo: 'Fuga de gas en edificio residencial',
      descripcion: 'Hay una fuerte fuga de gas en el edificio Torres del Parque, apartamento 402. El olor es muy fuerte en todo el pasillo del cuarto piso. Los vecinos estamos preocupados porque puede ser muy peligroso. Ya contactamos a la empresa de gas pero aún no han venido. El olor empezó desde ayer en la noche y cada vez es más fuerte. Necesitamos ayuda urgente.',
      categoria: 'emergencia',
      estado: 'resuelto',
      prioridad: 'critica',
      fechaCreacion: '2024-01-13T20:15:00',
      fechaActualizacion: '2024-01-14T08:45:00',
      ubicacion: {
        direccion: 'Torres del Parque, Carrera 5 # 26-92, Bogotá',
        lat: 4.6068,
        lng: -74.0725
      },
      comentariosAdmin: 'Emergencia atendida. Equipo de bomberos y empresa de gas resolvieron la fuga. Sin heridos.',
      autor: {
        nombre: 'Carlos Mendoza',
        avatar: 'assets/avatar2.jpg',
        verificado: false
      },
      estadisticas: {
        vistas: 189,
        reacciones: 23,
        comentarios: 5
      },
      detallesAdicionales: {
        telefono: '300-777-9999',
        email: 'carlos.mendoza@email.com',
        testigos: ['Ana Rodríguez (Apto 401)', 'Luis Silva (Apto 403)'],
        evidencias: ['Reporte técnico de la empresa de gas']
      }
    },
    {
      id: 5,
      titulo: 'Vandalismo en parque infantil',
      descripcion: 'Los juegos del parque infantil de la Zona Rosa han sido vandalizados. Rompieron los columpios, rayaron las estructuras con grafitis y tiraron basura por todas partes. Es muy triste ver cómo destrozan espacios que son para nuestros niños. El parque está completamente inhabitable. Necesitamos más vigilancia en la zona y que reparen los juegos lo antes posible.',
      categoria: 'seguridad',
      estado: 'pendiente',
      prioridad: 'media',
      fechaCreacion: '2024-01-16T11:20:00',
      fechaActualizacion: '2024-01-16T11:20:00',
      ubicacion: {
        direccion: 'Parque Zona Rosa, Calle 85 # 15-30, Bogotá',
        lat: 4.6765,
        lng: -74.0544
      },
      imagenes: ['assets/parque1.jpg', 'assets/parque2.jpg', 'assets/parque3.jpg'],
      autor: {
        nombre: 'Patricia Jiménez',
        avatar: 'assets/avatar3.jpg',
        verificado: true
      },
      estadisticas: {
        vistas: 156,
        reacciones: 18,
        comentarios: 12
      },
      detallesAdicionales: {
        email: 'patricia.jimenez@email.com',
        evidencias: ['Fotografías del vandalismo', 'Lista de juegos dañados']
      }
    },
    {
      id: 6,
      titulo: 'Construcción sin permisos genera ruido',
      descripcion: 'En el lote baldío de la Carrera 11 con Calle 94 están construyendo sin los permisos correspondientes. Empiezan a las 6 AM con máquinas muy ruidosas, violando las normas de ruido de la ciudad. Además, están bloqueando parte de la vía pública con materiales de construcción. Los vecinos no podemos descansar y el tráfico se ha vuelto caótico. Solicito que verifiquen si tienen permisos.',
      categoria: 'otros',
      estado: 'en_proceso',
      prioridad: 'media',
      fechaCreacion: '2024-01-15T14:30:00',
      fechaActualizacion: '2024-01-16T10:15:00',
      ubicacion: {
        direccion: 'Carrera 11 # 94-25, Bogotá',
        lat: 4.6823,
        lng: -74.0571
      },
      comentariosAdmin: 'Inspector enviado. Verificando permisos de construcción.',
      autor: {
        nombre: 'Roberto Vargas',
        avatar: 'assets/avatar4.jpg',
        verificado: false
      },
      estadisticas: {
        vistas: 201,
        reacciones: 9,
        comentarios: 6
      },
      detallesAdicionales: {
        telefono: '300-444-5555',
        evidencias: ['Audio del ruido matutino', 'Fotografías de materiales en vía pública']
      }
    },
    {
      id: 7,
      titulo: 'Alcantarilla desbordada contamina calle',
      descripcion: 'La alcantarilla de la Calle 72 con Carrera 13 se desbordó después de las lluvias de ayer. Hay agua contaminada por toda la calle y el olor es insoportable. Los peatones no pueden caminar por la acera y los carros salpican agua sucia a todos lados. Es un problema de salud pública grave. Necesitamos que limpien y reparen el sistema de alcantarillado urgentemente.',
      categoria: 'infraestructura',
      estado: 'pendiente',
      prioridad: 'alta',
      fechaCreacion: '2024-01-17T07:45:00',
      fechaActualizacion: '2024-01-17T07:45:00',
      ubicacion: {
        direccion: 'Calle 72 # 13-15, Bogotá',
        lat: 4.6654,
        lng: -74.0594
      },
      imagenes: ['assets/alcantarilla1.jpg'],
      autor: {
        nombre: 'Sandra López',
        avatar: 'assets/avatar5.jpg',
        verificado: true
      },
      estadisticas: {
        vistas: 98,
        reacciones: 15,
        comentarios: 3
      },
      detallesAdicionales: {
        email: 'sandra.lopez@email.com',
        evidencias: ['Fotografías del desbordamiento', 'Video del agua contaminada']
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
          this.router.navigate(['/mis-reportes']); // ✅ Navegación correcta a mis-reportes (comunidad)
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
      this.reporte = this.reportesSubidosData.find(r => r.id === this.reporteId) || null;
      
      if (!this.reporte) {
        console.error('Reporte de la comunidad no encontrado');
        this.router.navigate(['/mis-reportes']); // ✅ Navegación correcta
        return;
      }
      
      // Incrementar contador de vistas
      this.reporte.estadisticas.vistas++;
      
      this.isLoading = false;
    }, 1000);
  }

  // Métodos de navegación
  goBack(): void {
    this.router.navigate(['/mis-reportes']); // ✅ Navegación correcta a mis-reportes (comunidad)
  }

  // Métodos de utilidad (iguales que el componente original)
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

  // Método para reaccionar al reporte
  reaccionarReporte(): void {
    if (this.reporte) {
      this.reporte.estadisticas.reacciones++;
      // Aquí iría la lógica para enviar la reacción al servidor
      console.log('Reacción enviada');
    }
  }

  // Método para compartir reporte
  compartirReporte(): void {
    if (this.reporte && navigator.share) {
      navigator.share({
        title: this.reporte.titulo,
        text: this.reporte.descripcion.substring(0, 100) + '...',
        url: window.location.href
      }).catch(err => console.log('Error compartiendo:', err));
    } else {
      // Fallback: copiar URL al portapapeles
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Enlace copiado al portapapeles');
      });
    }
  }

  // Métodos auxiliares para verificar existencia de arrays
  hasTestigos(): boolean {
    return !!(this.reporte?.detallesAdicionales?.testigos && this.reporte.detallesAdicionales.testigos.length > 0);
  }

  hasEvidencias(): boolean {
    return !!(this.reporte?.detallesAdicionales?.evidencias && this.reporte.detallesAdicionales.evidencias.length > 0);
  }

  hasImagenes(): boolean {
    return !!(this.reporte?.imagenes && this.reporte.imagenes.length > 0);
  }
}