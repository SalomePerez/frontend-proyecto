import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuarioService, LoginDTO, LoginApiResponse } from '../../servicios/usuario.service'; // Ajustar ruta según tu estructura
import { AuthService } from '../../servicios/auth.service'; // Ajustar ruta según tu estructura

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css']
})
export class InicioSesionComponent implements OnInit {
  loginForm!: FormGroup;
  
  // Estados del componente
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router
  ) {
    this.crearFormulario();
  }

  ngOnInit() {
    // Opcional: Si hay token guardado, redirigir automáticamente
    this.verificarSesionExistente();
  }

  private crearFormulario() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Verificar si ya hay una sesión activa
   */
  private verificarSesionExistente(): void {
    // Si ya está autenticado, redirigir según el rol
    if (this.authService.isAuthenticated()) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        console.log('Usuario ya autenticado:', usuario);
        this.redirigirSegunRol(usuario.rol);
        return;
      }
    }

    // Si el token expiró o no es válido, limpiar la sesión
    if (this.authService.getToken() && !this.authService.isTokenValid()) {
      console.log('Token expirado, limpiando sesión');
      this.authService.logout();
    }
  }

  /**
   * Manejar envío del formulario
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginDTO = {
      correo: this.loginForm.get('email')?.value.trim(),  // ← Cambio: mapear "email" a "correo"
      password: this.loginForm.get('password')?.value
    };

    console.log('Intentando login:', { correo: loginData.correo });

    this.usuarioService.login(loginData)
      .subscribe({
        next: (response) => {
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          this.handleLoginError(error);
        }
      });
  }

  /**
   * Manejar login exitoso
   */
  private handleLoginSuccess(response: LoginApiResponse): void {
    this.isLoading = false;
    
    if (!response.error && response.mensaje) {
      console.log('Login exitoso:', response);
      
      const { token } = response.mensaje;
      
      // Decodificar el token JWT para obtener información del usuario
      const userData = this.decodeJWT(token);
      
      if (userData) {
        // Guardar sesión usando AuthService (60 minutos de duración)
        this.authService.saveSession(token, userData, 60);
        
        // Redirigir según el rol del usuario
        this.redirigirSegunRol(userData.rol);
      } else {
        this.errorMessage = 'Error al procesar los datos del usuario';
      }
      
    } else {
      this.errorMessage = response.mensaje as any || 'Error en el inicio de sesión';
    }
  }

  /**
   * Decodificar JWT para obtener datos del usuario
   */
  private decodeJWT(token: string): any {
    try {
      // Dividir el token en sus partes
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT inválido');
      }

      // Decodificar el payload (segunda parte)
      const payload = parts[1];
      const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const parsedPayload = JSON.parse(decodedPayload);

      console.log('Payload decodificado:', parsedPayload);

      // Mapear los datos del JWT a la interfaz Usuario
      return {
        id: parsedPayload.sub,
        nombre: parsedPayload.nombre || 'Usuario', // Si no viene en el token
        email: parsedPayload.email,
        rol: parsedPayload.rol?.replace('ROLE_', '') || 'CLIENTE' // Remover prefijo ROLE_
      };
    } catch (error) {
      console.error('Error decodificando JWT:', error);
      return null;
    }
  }

  /**
   * Manejar error de login
   */
  private handleLoginError(error: any): void {
    this.isLoading = false;
    this.errorMessage = error.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
    console.error('Error en login:', error);
  }

  /**
   * Redirigir según el rol del usuario
   */
  private redirigirSegunRol(rol: string): void {
    switch (rol.toUpperCase()) {
      case 'ADMINISTRADOR':
        this.router.navigate(['/inicio-admin']);
        break;
      case 'CLIENTE':
        this.router.navigate(['/inicio-cliente']);
        break;
      default:
        this.router.navigate(['/home']);
        break;
    }
  }

  /**
   * Marcar todos los controles como touched para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Alternar visibilidad de la contraseña
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Manejar olvido de contraseña
   */
  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/recuperar-contrasenia']);
  }

  /**
   * Limpiar mensaje de error
   */
  clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Ir a registro
   */
  goToRegister(): void {
    this.router.navigate(['/registro']);
  }
}