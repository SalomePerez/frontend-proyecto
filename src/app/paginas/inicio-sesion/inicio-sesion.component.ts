import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Interfaces (ajusta la ruta según tu estructura)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
  message: string;
}

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css']
})
export class InicioSesionComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
    // private authService: AuthService // Descomenta cuando tengas el servicio
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Verificar si el usuario ya está autenticado
    this.checkAuthStatus();
    
    // Limpiar mensajes de error cuando el usuario empiece a escribir
    this.setupFormValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });
  }

  private setupFormValueChanges(): void {
    this.loginForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.errorMessage) {
          this.errorMessage = '';
        }
      });
  }

  private checkAuthStatus(): void {
    // Implementar verificación de autenticación
    // if (this.authService.isLoggedIn()) {
    //   this.router.navigate(['/dashboard']);
    // }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.performLogin();
    } else {
      this.markFormGroupTouched();
    }
  }

  private performLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      email: this.loginForm.get('email')?.value.trim(),
      password: this.loginForm.get('password')?.value
    };

    // Simular llamada al servicio (reemplaza con tu servicio real)
    this.simulateLogin(loginData);

    // Implementación real con tu servicio:
    /*
    this.authService.login(loginData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LoginResponse) => {
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          this.handleLoginError(error);
        }
      });
    */
  }

  private simulateLogin(loginData: LoginRequest): void {
    // Simulación de login para desarrollo (remover en producción)
    setTimeout(() => {
      if (loginData.email === 'admin@segurapp.com' && loginData.password === '123456') {
        const mockResponse: LoginResponse = {
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: loginData.email,
            nombre: 'Administrador',
            apellido: 'SegurApp',
            rol: 'ADMIN'
          },
          message: 'Login exitoso'
        };
        this.handleLoginSuccess(mockResponse);
      } else {
        this.handleLoginError({
          error: {
            message: 'Credenciales incorrectas'
          }
        });
      }
    }, 2000);
  }

  private handleLoginSuccess(response: LoginResponse): void {
    this.isLoading = false;
    
    // Guardar token y datos del usuario
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    // Mostrar mensaje de éxito (opcional)
    console.log('Login exitoso:', response.message);

    // Redireccionar al dashboard o página principal
    this.router.navigate(['/dashboard']);
  }

  private handleLoginError(error: any): void {
    this.isLoading = false;
    
    // Manejar diferentes tipos de errores
    if (error.status === 401) {
      this.errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
    } else if (error.status === 404) {
      this.errorMessage = 'Usuario no encontrado.';
    } else if (error.status === 423) {
      this.errorMessage = 'Tu cuenta ha sido bloqueada. Contacta al administrador.';
    } else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    } else {
      this.errorMessage = error.error?.message || 'Error inesperado. Inténtalo de nuevo.';
    }

    console.error('Error en login:', error);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    
    // Implementar lógica de recuperar contraseña
    // this.router.navigate(['/recuperar-password']);
    
    // Por ahora, mostrar alerta
    alert('Funcionalidad de recuperar contraseña en desarrollo');
  }

  // Métodos de utilidad para el template
  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  get isEmailInvalid(): boolean {
    const email = this.emailControl;
    return !!(email && email.invalid && email.touched);
  }

  get isPasswordInvalid(): boolean {
    const password = this.passwordControl;
    return !!(password && password.invalid && password.touched);
  }

  // Método para testing (remover en producción)
  fillTestCredentials(): void {
    this.loginForm.patchValue({
      email: 'admin@segurapp.com',
      password: '123456'
    });
  }
}