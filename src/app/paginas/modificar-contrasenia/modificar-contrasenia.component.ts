import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioService, ApiError } from '../../servicios/usuario.service'; // Ajusta la ruta según tu estructura

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
    private route: ActivatedRoute,
    private usuarioService: UsuarioService // ← Inyección del servicio real
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
        
        console.log('Parámetros recibidos:', { email: this.email, codigo: this.codigo });
        
        // Si no hay parámetros, permitir acceso para testing, pero mostrar advertencia
        if (!this.email || !this.codigo) {
          console.warn('Acceso directo sin parámetros de recuperación');
          this.errorMessage = 'Sesión expirada o acceso directo. Para mayor seguridad, inicia el proceso desde recuperar contraseña.';
       
          setTimeout(() => {
            this.router.navigate(['/recuperar-contrasenia']);
          }, 5000);
          
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
        // Solo limpiar si no es el mensaje de advertencia inicial
        if (this.errorMessage !== 'Sesión expirada o acceso directo. Para mayor seguridad, inicia el proceso desde recuperar contraseña.') {
          this.clearMessages();
        }
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

  // Validador personalizado para contraseñas (actualizado según el backend)
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;

    // Mantengo la validación original de tu componente
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
    
    // Criterios de fortaleza (mantengo tu lógica original)
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

  // Métodos para mostrar/ocultar contraseñas (mantienen tu lógica)
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

    const nuevaPassword = this.modificarForm.get('password')?.value;

    // Si no tenemos email y código (acceso directo), usar valores de prueba
    const emailToUse = this.email || 'test@example.com';
    const codigoToUse = this.codigo || '123456';

    console.log('Enviando cambio de contraseña:', {
      email: emailToUse,
      codigo: codigoToUse,
      // No loggear la contraseña por seguridad
    });

    // Llamada REAL al servicio backend
    this.usuarioService.cambiarContrasenia(emailToUse, codigoToUse.toUpperCase(), nuevaPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleChangePasswordSuccess(response);
        },
        error: (error: ApiError) => {
          this.handleChangePasswordError(error);
        }
      });
  }

  private handleChangePasswordSuccess(response: any): void {
    this.isLoading = false;
    this.successMessage = response.mensaje || 'Contraseña cambiada exitosamente';
    
    // Deshabilitar el formulario para evitar reenvíos
    this.modificarForm.disable();
    
    // Redirigir al login después de 3 segundos
    setTimeout(() => {
      this.router.navigate(['/login'], {
        queryParams: { 
          message: 'Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña' 
        }
      });
    }, 3000);
  }

  private handleChangePasswordError(error: ApiError): void {
    this.isLoading = false;
    this.errorMessage = error.message;
    
    console.error('Error al cambiar contraseña:', error);
    
    // Si el código es inválido o expiró, sugerir nuevo proceso
    if (error.status === 400 || error.status === 404) {
      setTimeout(() => {
        if (confirm('¿El código pudo haber expirado. ¿Deseas solicitar un nuevo código de recuperación?')) {
          this.router.navigate(['/recuperar-contrasenia']);
        }
      }, 3000);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.modificarForm.controls).forEach(key => {
      const control = this.modificarForm.get(key);
      control?.markAsTouched();
    });
  }

  // Métodos para verificar requisitos de contraseña (mantienen tu lógica original)
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

  // Métodos para obtener clases y texto de fortaleza (mantienen tu lógica)
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

  // Getters para el template (mantienen tu lógica)
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

  // Métodos de navegación (mantienen tu lógica)
  goBackToRecovery(): void {
    this.router.navigate(['/recuperar-contrasenia']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}