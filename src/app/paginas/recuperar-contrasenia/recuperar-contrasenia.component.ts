import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioService, ApiError } from '../../servicios/usuario.service'; // Ajusta la ruta según tu estructura

// Interfaces locales (puedes mantenerlas o usar las del servicio)
export interface RecuperarPasswordRequest {
  email: string;
}

export interface VerificarCodigoRequest {
  email: string;
  codigo: string;
}

export interface RecuperarPasswordResponse {
  success: boolean;
  message: string;
  codigoEnviado?: boolean;
}

@Component({
  selector: 'app-recuperar-contrasenia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './recuperar-contrasenia.component.html',
  styleUrls: ['./recuperar-contrasenia.component.css']
})
export class RecuperarContraseniaComponent implements OnInit, OnDestroy {
  recuperarForm!: FormGroup;
  showCodeField: boolean = false;
  isLoadingSendCode: boolean = false;
  isLoadingVerify: boolean = false;
  
  // Mensajes
  errorMessage: string = '';
  successMessage: string = '';
  infoMessage: string = '';
  
  // Control del flujo
  emailEnviado: string = '';
  codigoVerificado: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService // ← Inyección del servicio real
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupFormValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.recuperarForm = this.formBuilder.group({
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      codigo: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-z0-9]{6}$/) // Exactamente 6 caracteres alfanuméricos
      ]]
    });

    // Inicialmente el código no es requerido
    this.recuperarForm.get('codigo')?.clearValidators();
    this.recuperarForm.get('codigo')?.updateValueAndValidity();
  }

  private setupFormValueChanges(): void {
    this.recuperarForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearMessages();
      });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';
  }

  onSubmit(): void {
    if (this.recuperarForm.get('email')?.valid && !this.isLoadingSendCode) {
      this.sendRecoveryCode();
    } else {
      this.markEmailAsTouched();
    }
  }

  private sendRecoveryCode(): void {
    this.isLoadingSendCode = true;
    this.clearMessages();

    const email = this.recuperarForm.get('email')?.value.trim();

    console.log('Enviando código de recuperación para:', email);

    // Llamada REAL al servicio backend
    this.usuarioService.enviarCodigoRecuperacion(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleSendCodeSuccess(response, email);
        },
        error: (error: ApiError) => {
          this.handleSendCodeError(error);
        }
      });
  }

  private handleSendCodeSuccess(response: any, email: string): void {
    this.isLoadingSendCode = false;
    this.emailEnviado = email;
    
    // Mostrar campo de código y habilitar validación
    this.showCodeField = true;
    this.recuperarForm.get('codigo')?.setValidators([
      Validators.required,
      Validators.pattern(/^[A-Za-z0-9]{6}$/) // 6 caracteres alfanuméricos
    ]);
    this.recuperarForm.get('codigo')?.updateValueAndValidity();

    // Mostrar mensajes de éxito del backend
    this.successMessage = response.mensaje || 'Código enviado a tu correo electrónico';
    this.infoMessage = 'Revisa tu bandeja de entrada y spam';

    // Deshabilitar el campo de email
    this.recuperarForm.get('email')?.disable();
  }

  private handleSendCodeError(error: ApiError): void {
    this.isLoadingSendCode = false;
    this.errorMessage = error.message;
    
    console.error('Error al enviar código:', error);
  }

  onVerifyCode(): void {
    if (this.recuperarForm.get('codigo')?.valid && !this.isLoadingVerify) {
      this.verifyCode();
    } else {
      this.markCodeAsTouched();
    }
  }

  private verifyCode(): void {
    this.isLoadingVerify = true;
    this.clearMessages();

    // Para la verificación del código, simplemente validamos localmente y redirigimos
    // El backend validará el código cuando se cambie la contraseña
    const codigo = this.recuperarForm.get('codigo')?.value;
    
    console.log('Validando código localmente:', codigo);
    
    // Validación básica local (6 caracteres alfanuméricos)
    if (codigo && codigo.length === 6 && /^[A-Za-z0-9]{6}$/.test(codigo)) {
      this.handleVerifySuccess();
    } else {
      this.handleVerifyError({ message: 'Código inválido. Debe tener 6 caracteres alfanuméricos.' } as ApiError);
    }
  }

  private handleVerifySuccess(): void {
    this.isLoadingVerify = false;
    this.codigoVerificado = true;
    this.successMessage = 'Código verificado correctamente';
    
    // Redirigir a la página de cambiar contraseña después de 2 segundos
    setTimeout(() => {
      this.router.navigate(['/modificar-contrasenia'], {
        queryParams: { 
          email: this.emailEnviado,
          code: this.recuperarForm.get('codigo')?.value 
        }
      });
    }, 2000);
  }

  private handleVerifyError(error: ApiError): void {
    this.isLoadingVerify = false;
    this.errorMessage = error.message;
  }

  // Métodos auxiliares
  private markEmailAsTouched(): void {
    this.recuperarForm.get('email')?.markAsTouched();
  }

  private markCodeAsTouched(): void {
    this.recuperarForm.get('codigo')?.markAsTouched();
  }

  // Método para reenviar código (actualizado para usar el servicio real)
  onResendCode(): void {
    if (!this.isLoadingSendCode && this.emailEnviado) {
      this.recuperarForm.get('codigo')?.reset();
      this.clearMessages();
      
      console.log('Reenviando código para:', this.emailEnviado);
      
      // Usar el servicio real para reenviar código
      this.usuarioService.enviarCodigoRecuperacion(this.emailEnviado)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = 'Código reenviado correctamente';
            this.infoMessage = 'Revisa tu bandeja de entrada y spam';
          },
          error: (error: ApiError) => {
            this.errorMessage = error.message;
          }
        });
    }
  }

  // Método para cambiar email
  onChangeEmail(): void {
    this.showCodeField = false;
    this.codigoVerificado = false;
    this.emailEnviado = '';
    this.recuperarForm.get('email')?.enable();
    this.recuperarForm.get('codigo')?.reset();
    this.recuperarForm.get('codigo')?.clearValidators();
    this.recuperarForm.get('codigo')?.updateValueAndValidity();
    this.clearMessages();
  }

  // Getters para el template (mantienen tu lógica original)
  get emailControl() {
    return this.recuperarForm.get('email');
  }

  get codigoControl() {
    return this.recuperarForm.get('codigo');
  }

  get isEmailInvalid(): boolean {
    const email = this.emailControl;
    return !!(email && email.invalid && email.touched);
  }

  get isCodigoInvalid(): boolean {
    const codigo = this.codigoControl;
    return !!(codigo && codigo.invalid && codigo.touched);
  }
}