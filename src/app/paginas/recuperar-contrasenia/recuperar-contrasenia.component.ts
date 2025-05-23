import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Interfaces
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
    private router: Router
    // private authService: AuthService // Descomentar cuando tengas el servicio
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
        Validators.pattern(/^\d{6}$/) // Exactamente 6 dígitos
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
    const requestData: RecuperarPasswordRequest = { email };

    // Simular llamada al servicio
    this.simulateSendCode(requestData);

    // Implementación real:
    /*
    this.authService.enviarCodigoRecuperacion(requestData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RecuperarPasswordResponse) => {
          this.handleSendCodeSuccess(response);
        },
        error: (error) => {
          this.handleSendCodeError(error);
        }
      });
    */
  }

  private simulateSendCode(requestData: RecuperarPasswordRequest): void {
    // Simulación para desarrollo
    setTimeout(() => {
      // Simular diferentes escenarios
      if (requestData.email === 'test@error.com') {
        this.handleSendCodeError({
          error: { message: 'Email no encontrado en el sistema' }
        });
      } else {
        const mockResponse: RecuperarPasswordResponse = {
          success: true,
          message: 'Código enviado exitosamente',
          codigoEnviado: true
        };
        this.handleSendCodeSuccess(mockResponse);
      }
    }, 2000);
  }

  private handleSendCodeSuccess(response: RecuperarPasswordResponse): void {
    this.isLoadingSendCode = false;
    this.emailEnviado = this.recuperarForm.get('email')?.value;
    
    // Mostrar campo de código y habilitar validación
    this.showCodeField = true;
    this.recuperarForm.get('codigo')?.setValidators([
      Validators.required,
      Validators.pattern(/^\d{6}$/)
    ]);
    this.recuperarForm.get('codigo')?.updateValueAndValidity();

    this.successMessage = 'Código enviado a tu correo electrónico';
    this.infoMessage = 'Revisa tu bandeja de entrada y spam';

    // Deshabilitar el campo de email
    this.recuperarForm.get('email')?.disable();
  }

  private handleSendCodeError(error: any): void {
    this.isLoadingSendCode = false;
    
    if (error.status === 404) {
      this.errorMessage = 'No se encontró una cuenta con este correo electrónico';
    } else if (error.status === 429) {
      this.errorMessage = 'Has excedido el límite de intentos. Intenta más tarde';
    } else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. Verifica tu conexión a internet';
    } else {
      this.errorMessage = error.error?.message || 'Error al enviar el código. Inténtalo de nuevo';
    }
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

    const verifyData: VerificarCodigoRequest = {
      email: this.emailEnviado,
      codigo: this.recuperarForm.get('codigo')?.value
    };

    // Simular verificación
    this.simulateVerifyCode(verifyData);

    // Implementación real:
    /*
    this.authService.verificarCodigoRecuperacion(verifyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleVerifySuccess(response);
        },
        error: (error) => {
          this.handleVerifyError(error);
        }
      });
    */
  }

  private simulateVerifyCode(verifyData: VerificarCodigoRequest): void {
    setTimeout(() => {
      if (verifyData.codigo === '123456') {
        this.handleVerifySuccess({
          success: true,
          message: 'Código verificado correctamente'
        });
      } else {
        this.handleVerifyError({
          error: { message: 'Código incorrecto' }
        });
      }
    }, 1500);
  }

  private handleVerifySuccess(response: any): void {
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

  private handleVerifyError(error: any): void {
    this.isLoadingVerify = false;
    
    if (error.status === 400) {
      this.errorMessage = 'Código incorrecto o expirado';
    } else if (error.status === 429) {
      this.errorMessage = 'Demasiados intentos fallidos. Solicita un nuevo código';
    } else {
      this.errorMessage = error.error?.message || 'Error al verificar el código';
    }
  }

  // Métodos auxiliares
  private markEmailAsTouched(): void {
    this.recuperarForm.get('email')?.markAsTouched();
  }

  private markCodeAsTouched(): void {
    this.recuperarForm.get('codigo')?.markAsTouched();
  }

  // Método para reenviar código
  onResendCode(): void {
    if (!this.isLoadingSendCode) {
      this.recuperarForm.get('codigo')?.reset();
      this.clearMessages();
      this.sendRecoveryCode();
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

  // Getters para el template
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