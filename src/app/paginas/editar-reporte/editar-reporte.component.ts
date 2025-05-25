import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✨ INTEGRACIÓN CON BACKEND
import { ReporteService, MiReporteDTO, EditarReporteDTO, CategoriaBackend } from '../../servicios/reporte.service';

// Interface local para el formulario
interface ReporteEdicion {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
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
  reporte: ReporteEdicion | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  reporteId: string | null = null; // ✨ CAMBIAR A STRING
  error: string | null = null;
  showSuccessNotification: boolean = false;
  currentTime: Date = new Date();
  
  // ✨ CATEGORÍAS DEL BACKEND
  categorias: Categoria[] = [];
  categoriasBackend: CategoriaBackend[] = [];

  prioridades: Prioridad[] = [
    { value: 'baja', label: 'Baja', color: '#10b981' },
    { value: 'media', label: 'Media', color: '#f59e0b' },
    { value: 'alta', label: 'Alta', color: '#ef4444' },
    { value: 'critica', label: 'Crítica', color: '#7c2d12' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private reporteService: ReporteService // ✨ INYECTAR SERVICIO
  ) {
    this.initForm();
    // Actualizar la hora cada segundo
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnInit(): void {
    // Cargar categorías primero
    this.loadCategorias();
    
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.reporteId = params['id'] || null;
        if (this.reporteId) {
          this.loadReporte();
        } else {
          this.error = 'No se especificó un ID de reporte válido';
          this.isLoading = false;
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

  // ✨ CARGAR CATEGORÍAS DEL BACKEND
  private loadCategorias(): void {
    console.log('📋 Cargando categorías del backend...');
    
    this.reporteService.getCategorias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categoriasBackend) => {
          console.log('✅ Categorías cargadas:', categoriasBackend);
          this.categoriasBackend = categoriasBackend;
          
          // Convertir a formato del frontend
          this.categorias = categoriasBackend.map(cat => ({
            value: cat.id,
            label: cat.nombre,
            icon: this.getIconoCategoria(cat.nombre),
            color: this.getColorCategoria(cat.nombre)
          }));
        },
        error: (error) => {
          console.error('❌ Error cargando categorías:', error);
          // Usar categorías por defecto si falla
          this.categorias = [
            { value: 'emergencia', label: 'Emergencia', icon: 'bi bi-exclamation-triangle-fill', color: '#ef4444' },
            { value: 'seguridad', label: 'Seguridad', icon: 'bi bi-shield-exclamation', color: '#f59e0b' },
            { value: 'infraestructura', label: 'Infraestructura', icon: 'bi bi-tools', color: '#3b82f6' },
            { value: 'otros', label: 'Otros', icon: 'bi bi-chat-dots', color: '#6b7280' }
          ];
        }
      });
  }

  // ✨ MÉTODO ACTUALIZADO PARA USAR BACKEND
  private loadReporte(): void {
    if (!this.reporteId) {
      this.error = 'ID de reporte no válido';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;
    
    console.log('📄 Cargando reporte para editar:', this.reporteId);
    
    this.reporteService.obtenerDetalleReporte(this.reporteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (miReporte) => {
          console.log('✅ Reporte cargado para edición:', miReporte);
          
          // Solo permitir editar si está pendiente
          if (miReporte.estado !== 'pendiente') {
            this.error = 'Este reporte no puede ser editado porque ya ha sido procesado';
            this.isLoading = false;
            return;
          }

          // Convertir a formato local
          this.reporte = this.convertirMiReporteAEdicion(miReporte);
          
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
        },
        error: (error) => {
          console.error('❌ Error cargando reporte para editar:', error);
          this.error = error.message || 'Error al cargar el reporte';
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

  // ✨ CONVERTIR MiReporteDTO A FORMATO DE EDICIÓN
  private convertirMiReporteAEdicion(miReporte: MiReporteDTO): ReporteEdicion {
    return {
      id: miReporte.id,
      titulo: miReporte.titulo,
      descripcion: miReporte.descripcion,
      categoria: miReporte.categoria,
      estado: ['pendiente', 'en_proceso', 'resuelto', 'rechazado', 'eliminado'].includes(miReporte.estado)
        ? miReporte.estado as 'pendiente' | 'en_proceso' | 'resuelto' | 'rechazado' | 'eliminado'
        : 'pendiente',
      prioridad: miReporte.prioridad,
      fechaCreacion: miReporte.fechaCreacion,
      fechaActualizacion: miReporte.fechaActualizacion,
      ubicacion: miReporte.ubicacion,
      imagenes: miReporte.imagenes,
      comentariosAdmin: miReporte.comentariosAdmin,
      detallesAdicionales: {
        telefono: undefined, // El backend no tiene estos campos por ahora
        email: undefined,
        testigos: [],
        evidencias: []
      }
    };
  }

  // ✨ MÉTODO ACTUALIZADO PARA ENVIAR EDICIÓN AL BACKEND
  onSubmit(): void {
    if (this.editarForm.valid && !this.isSaving && this.reporte) {
      this.isSaving = true;
      
      const formData = this.editarForm.value;
      
      // Buscar el ID de la categoría seleccionada
      const categoriaSeleccionada = this.categorias.find(cat => cat.value === formData.categoria);
      const idCategoria = categoriaSeleccionada?.value || formData.categoria;
      
      // Preparar datos para el backend
      const datosEdicion: EditarReporteDTO = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        idCategoria: idCategoria,
        ubicacion: {
          latitud: this.reporte.ubicacion.lat,
          longitud: this.reporte.ubicacion.lng
        }
        // fotos: mantenemos las existentes por ahora
      };
      
      console.log('💾 Enviando edición al backend:', datosEdicion);
      
      this.reporteService.editarReporte(this.reporte.id, datosEdicion)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (mensaje) => {
            console.log('✅ Reporte editado exitosamente:', mensaje);
            
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
          },
          error: (error) => {
            console.error('❌ Error editando reporte:', error);
            alert('Error al guardar los cambios: ' + error.message);
            this.isSaving = false;
          }
        });
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
    const confirmacion = confirm('¿Estás seguro de que quieres cancelar la edición? Se perderán los cambios no guardados.');
    if (confirmacion) {
      this.goBack();
    }
  }

  // Método para obtener ubicación actual (simulado)
  obtenerUbicacionActual(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simular conversión de coordenadas a dirección
          const direccionSimulada = `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`;
          this.editarForm.patchValue({
            'ubicacion.direccion': direccionSimulada
          });
          
          // Actualizar las coordenadas en el reporte
          if (this.reporte) {
            this.reporte.ubicacion.lat = position.coords.latitude;
            this.reporte.ubicacion.lng = position.coords.longitude;
          }
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

  // ✨ MÉTODOS AUXILIARES PARA CATEGORÍAS
  private getIconoCategoria(nombreCategoria: string): string {
    const nombre = nombreCategoria.toLowerCase();
    switch (nombre) {
      case 'emergencia':
        return 'bi bi-exclamation-triangle-fill';
      case 'seguridad':
        return 'bi bi-shield-exclamation';
      case 'infraestructura':
        return 'bi bi-tools';
      case 'otros':
      default:
        return 'bi bi-chat-dots';
    }
  }

  private getColorCategoria(nombreCategoria: string): string {
    const nombre = nombreCategoria.toLowerCase();
    switch (nombre) {
      case 'emergencia':
        return '#ef4444';
      case 'seguridad':
        return '#f59e0b';
      case 'infraestructura':
        return '#3b82f6';
      case 'otros':
      default:
        return '#6b7280';
    }
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