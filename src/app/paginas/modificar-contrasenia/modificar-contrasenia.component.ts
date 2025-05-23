import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Interfaces
export interface CambiarPasswordRequest {
  email: string;
  codigo: string;
  nuevaPassword: string;
}

export interface CambiarPasswordResponse {
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-modificar-contrasenia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './modificar-contrasenia.component.html',
  styleUrls: ['./modificar-contrasenia.component.css']
})
export class ModificarContraseniaComponent implements OnInit, OnDestroy {
  modificarForm!: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  
  // Mensajes
  errorMessage: string = '';
  successMessage: string = '';
  
  // Datos del formulario anterior
  email: string = '';
  codigo: string = '';
  
  // Control de fortaleza
  passwordStrength: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
    // private authService: AuthService // Descomentar cuando tengas el servicio
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.getQueryParams();
    this.setupFormValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.email = params['email'] || '';
        this.codigo = params['code'] || '';
        
        // Si no hay parámetros, permitir acceso directo para testing
        // En producción, podrías querer redirigir a recuperar-contrasenia
        if (!this.email || !this.codigo) {
          console.warn('Acceso directo sin parámetros de recuperación');
          // Comentado para permitir testing directo
          // this.router.navigate(['/recuperar-contrasenia']);
        }
      });
  }

  private initializeForm(): void {
    this.modificarForm = this.formBuilder.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordValidator
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private setupFormValueChanges(): void {
    // Limpiar mensajes al cambiar valores
    this.modificarForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearMessages();
      });

    // Actualizar fortaleza de contraseña
    this.modificarForm.get('password')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((password: string) => {
        this.updatePasswordStrength(password);
      });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Validador personalizado para contraseñas
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasMinLength;
    
    if (!passwordValid) {
      return { pattern: true };
    }
    
    return null;
  }

  // Validador para confirmar contraseña
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Limpiar el error si las contraseñas coinciden
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
    }

    return null;
  }

  private updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = '';
      return;
    }

    let score = 0;
    
    // Criterios de fortaleza
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++; // Caracteres especiales

    switch (score) {
      case 0:
      case 1:
        this.passwordStrength = 'weak';
        break;
      case 2:
        this.passwordStrength = 'fair';
        break;
      case 3:
        this.passwordStrength = 'good';
        break;
      case 4:
      case 5:
        this.passwordStrength = 'strong';
        break;
      default:
        this.passwordStrength = 'weak';
    }
  }

  // Métodos para mostrar/ocultar contraseñas
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.modificarForm.valid && !this.isLoading) {
      this.changePassword();
    } else {
      this.markFormGroupTouched();
    }
  }

  private changePassword(): void {
    this.isLoading = true;
    this.clearMessages();

    const requestData: CambiarPasswordRequest = {
      email: this.email,
      codigo: this.codigo,
      nuevaPassword: this.modificarForm.get('password')?.value
    };

    // Simular cambio de contraseña
    this.simulateChangePassword(requestData);

    // Implementación real:
    /*
    this.authService.cambiarPassword(requestData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CambiarPasswordResponse) => {
          this.handleChangePasswordSuccess(response);
        },
        error: (error) => {
          this.handleChangePasswordError(error);
        }
      });
    */
  }

  private simulateChangePassword(requestData: CambiarPasswordRequest): void {
    setTimeout(() => {
      // Simular éxito
      const mockResponse: CambiarPasswordResponse = {
        success: true,
        message: 'Contraseña cambiada exitosamente'
      };
      this.handleChangePasswordSuccess(mockResponse);
    }, 2000);
  }

  private handleChangePasswordSuccess(response: CambiarPasswordResponse): void {
    this.isLoading = false;
    this.successMessage = 'Contraseña cambiada exitosamente';
    
    // Redirigir al login después de 3 segundos
    setTimeout(() => {
      this.router.navigate(['/login'], {
        queryParams: { 
          message: 'Contraseña cambiada exitosamente. Inicia sesión con tu nueva contraseña' 
        }
      });
    }, 3000);
  }

  private handleChangePasswordError(error: any): void {
    this.isLoading = false;
    
    if (error.status === 400) {
      this.errorMessage = 'Código inválido o expirado';
    } else if (error.status === 404) {
      this.errorMessage = 'Usuario no encontrado';
    } else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. Verifica tu conexión a internet';
    } else {
      this.errorMessage = error.error?.message || 'Error al cambiar la contraseña';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.modificarForm.controls).forEach(key => {
      const control = this.modificarForm.get(key);
      control?.markAsTouched();
    });
  }

  // Métodos para verificar requisitos de contraseña
  hasMinLength(): boolean {
    const password = this.modificarForm.get('password')?.value;
    return password ? password.length >= 8 : false;
  }

  hasUppercase(): boolean {
    const password = this.modificarForm.get('password')?.value;
    return password ? /[A-Z]/.test(password) : false;
  }

  hasLowercase(): boolean {
    const password = this.modificarForm.get('password')?.value;
    return password ? /[a-z]/.test(password) : false;
  }

  hasNumber(): boolean {
    const password = this.modificarForm.get('password')?.value;
    return password ? /[0-9]/.test(password) : false;
  }

  hasSpecialChar(): boolean {
    const password = this.modificarForm.get('password')?.value;
    return password ? /[^A-Za-z0-9]/.test(password) : false;
  }

  // Métodos para obtener clases y texto de fortaleza
  getPasswordStrengthClass(): string {
    return this.passwordStrength;
  }

  getPasswordStrengthText(): string {
    switch (this.passwordStrength) {
      case 'weak':
        return 'Débil';
      case 'fair':
        return 'Regular';
      case 'good':
        return 'Buena';
      case 'strong':
        return 'Fuerte';
      default:
        return '';
    }
  }

  // Getters para el template
  get passwordControl() {
    return this.modificarForm.get('password');
  }

  get confirmPasswordControl() {
    return this.modificarForm.get('confirmPassword');
  }

  get isPasswordInvalid(): boolean {
    const password = this.passwordControl;
    return !!(password && password.invalid && password.touched);
  }

  get isConfirmPasswordInvalid(): boolean {
    const confirmPassword = this.confirmPasswordControl;
    return !!(confirmPassword && confirmPassword.invalid && confirmPassword.touched);
  }

  // Método para volver a recuperar contraseña
  goBackToRecovery(): void {
    this.router.navigate(['/recuperar-contrasenia']);
  }

  // Método para ir al login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}