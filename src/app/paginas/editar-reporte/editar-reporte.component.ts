import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  detallesAdicionales?: {
    telefono?: string;
    email?: string;
    testigos?: string[];
    evidencias?: string[];
  };
}

interface Categoria {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface Prioridad {
  value: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-editar-reporte',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-reporte.component.html',
  styleUrls: ['./editar-reporte.component.css']
})
export class EditarReporteComponent implements OnInit, OnDestroy {
  
  editarForm!: FormGroup;
  reporte: Reporte | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  reporteId: number | null = null;
  error: string | null = null;
  showSuccessNotification: boolean = false;
  currentTime: Date = new Date();
  
  categorias: Categoria[] = [
    { 
      value: 'emergencia', 
      label: 'Emergencia', 
      icon: 'bi bi-exclamation-triangle-fill',
      color: '#ef4444'
    },
    { 
      value: 'seguridad', 
      label: 'Seguridad', 
      icon: 'bi bi-shield-exclamation',
      color: '#f59e0b'
    },
    { 
      value: 'infraestructura', 
      label: 'Infraestructura', 
      icon: 'bi bi-tools',
      color: '#3b82f6'
    },
    { 
      value: 'otros', 
      label: 'Otros', 
      icon: 'bi bi-chat-dots',
      color: '#6b7280'
    }
  ];

  prioridades: Prioridad[] = [
    { value: 'baja', label: 'Baja', color: '#10b981' },
    { value: 'media', label: 'Media', color: '#f59e0b' },
    { value: 'alta', label: 'Alta', color: '#ef4444' },
    { value: 'critica', label: 'Crítica', color: '#7c2d12' }
  ];

  // Datos de ejemplo (igual que en detalle-reporte)
  private reportesData: Reporte[] = [
    {
      id: 1,
      titulo: 'Robo en mi cuadra',
      descripcion: 'Vi un robo a mano armada en la calle 45 con carrera 12. Los delincuentes se movilizaban en motocicleta negra, eran dos personas, una conducía y la otra amenazó con un arma de fuego a una señora que caminaba por la acera. Le quitaron el bolso y el celular. Todo ocurrió aproximadamente a las 8:30 PM. La señora gritó pidiendo ayuda pero cuando salimos ya se habían ido. Llamamos inmediatamente a la policía.',
      categoria: 'seguridad',
      estado: 'pendiente',
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
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
    // Actualizar la hora cada segundo
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.reporteId = params['id'] ? parseInt(params['id']) : null;
        if (this.reporteId) {
          this.loadReporte();
        } else {
          this.router.navigate(['/reportes-propios']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.editarForm = this.formBuilder.group({
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      categoria: ['', Validators.required],
      prioridad: ['', Validators.required],
      'ubicacion.direccion': ['', Validators.required],
      telefono: [''],
      email: ['', Validators.email]
    });
  }

  private loadReporte(): void {
    this.isLoading = true;
    this.error = null;
    
    // Simular carga desde servidor
    setTimeout(() => {
      this.reporte = this.reportesData.find(r => r.id === this.reporteId) || null;
      
      if (!this.reporte) {
        this.error = 'Reporte no encontrado';
        this.isLoading = false;
        return;
      }

      // Solo permitir editar si está pendiente
      if (this.reporte.estado !== 'pendiente') {
        this.error = 'Este reporte no puede ser editado porque ya ha sido procesado';
        this.isLoading = false;
        return;
      }

      // Llenar el formulario con los datos existentes
      this.editarForm.patchValue({
        titulo: this.reporte.titulo,
        descripcion: this.reporte.descripcion,
        categoria: this.reporte.categoria,
        prioridad: this.reporte.prioridad,
        'ubicacion.direccion': this.reporte.ubicacion.direccion,
        telefono: this.reporte.detallesAdicionales?.telefono || '',
        email: this.reporte.detallesAdicionales?.email || ''
      });
      
      this.isLoading = false;
    }, 1000);
  }

  onSubmit(): void {
    if (this.editarForm.valid && !this.isSaving) {
      this.isSaving = true;
      
      const formData = this.editarForm.value;
      
      // Simular guardado
      setTimeout(() => {
        console.log('Reporte actualizado:', formData);
        
        // Mostrar notificación de éxito
        this.showSuccessNotification = true;
        
        // Ocultar notificación después de 3 segundos y navegar
        setTimeout(() => {
          this.showSuccessNotification = false;
          this.router.navigate(['/detalle-reporte'], { 
            queryParams: { id: this.reporteId } 
          });
        }, 3000);
        
        this.isSaving = false;
      }, 2000);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.editarForm.controls).forEach(key => {
        this.editarForm.get(key)?.markAsTouched();
      });
    }
  }

  goBack(): void {
    if (this.reporteId) {
      this.router.navigate(['/detalle-reporte'], { 
        queryParams: { id: this.reporteId } 
      });
    } else {
      this.router.navigate(['/reportes-propios']);
    }
  }

  cancelarEdicion(): void {
    this.goBack();
  }

  // Método para obtener ubicación actual (simulado)
  obtenerUbicacionActual(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simular conversión de coordenadas a dirección
          const direccionSimulada = `Calle ${Math.floor(Math.random() * 100)} # ${Math.floor(Math.random() * 50)}-${Math.floor(Math.random() * 99)}, Bogotá`;
          this.editarForm.patchValue({
            'ubicacion.direccion': direccionSimulada
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('No se pudo obtener la ubicación actual');
        }
      );
    } else {
      alert('Geolocalización no soportada por este navegador');
    }
  }

  // Métodos de validación y utilidad
  isFieldInvalid(fieldName: string): boolean {
    const field = this.editarForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.editarForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return 'Este campo es obligatorio';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['email']) return 'Formato de email inválido';
    }
    return '';
  }

  getCategoriaSeleccionada(): Categoria | undefined {
    const categoriaValue = this.editarForm.get('categoria')?.value;
    return this.categorias.find(cat => cat.value === categoriaValue);
  }

  getPrioridadSeleccionada(): Prioridad | undefined {
    const prioridadValue = this.editarForm.get('prioridad')?.value;
    return this.prioridades.find(prio => prio.value === prioridadValue);
  }

  // Getter para el tiempo actual formateado
  get currentTimeFormatted(): string {
    return this.currentTime.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }
}