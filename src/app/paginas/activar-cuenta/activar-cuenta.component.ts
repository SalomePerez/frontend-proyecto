import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuarioService, VerificacionResponse } from '../../servicios/usuario.service'; // Ajustar ruta según tu estructura

@Component({
  selector: 'app-activar-cuenta',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './activar-cuenta.component.html',
  styleUrls: ['./activar-cuenta.component.css']
})
export class ActivarCuentaComponent implements OnInit {
  activarForm!: FormGroup;
  
  // Estados del componente
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  cuentaActivada = false;

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.crearFormulario();
  }

  ngOnInit() {
    // Si viene email como query param del registro
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.activarForm.patchValue({
          email: params['email']
        });
      }
    });
  }

  private crearFormulario() {
    this.activarForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      codigo: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  /**
   * Verificar código de activación
   */
  verificarCodigo() {
    if (this.activarForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.activarForm.get('email')?.value.trim();
    const codigo = this.activarForm.get('codigo')?.value.trim();

    console.log('Verificando código:', { email, codigo });

    this.usuarioService.verificarCodigoActivacion(email, codigo)
      .subscribe({
        next: (response) => {
          this.handleVerificacionExitosa(response);
        },
        error: (error) => {
          this.handleErrorVerificacion(error);
        }
      });
  }

  private handleVerificacionExitosa(response: VerificacionResponse): void {
    this.isLoading = false;
    
    if (!response.error) {
      this.cuentaActivada = true;
      this.successMessage = response.mensaje || 'Cuenta activada correctamente';
      console.log('Cuenta activada exitosamente:', response);
      
      // Opcional: Redirigir automáticamente después de unos segundos
      setTimeout(() => {
        this.irALogin();
      }, 3000);
    } else {
      this.errorMessage = response.mensaje || 'Error en la activación';
    }
  }

  private handleErrorVerificacion(error: any): void {
    this.isLoading = false;
    this.errorMessage = error.message || 'Código inválido o expirado. Inténtalo de nuevo.';
    console.error('Error en verificación:', error);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.activarForm.controls).forEach(key => {
      const control = this.activarForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para el template
  get emailControl() {
    return this.activarForm.get('email');
  }

  get codigoControl() {
    return this.activarForm.get('codigo');
  }

  /**
   * Navegar a login
   */
  irALogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Limpiar mensajes de error
   */
  limpiarError(): void {
    this.errorMessage = '';
  }
}