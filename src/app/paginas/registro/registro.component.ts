import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Interfaces para el registro
export interface RegistroRequest {
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  email: string;
  password: string;
}

export interface RegistroResponse {
  success: boolean;
  message: string;
  userId?: string;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  registroForm!: FormGroup;
  
  // Estados del componente
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Estados para mostrar/ocultar contraseñas
  mostrarPassword = false;
  mostrarConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) { 
    this.crearFormulario();
  }

  public registrar() {
    if (this.registroForm.valid && !this.isLoading) {
      this.performRegister();
    } else {
      this.markFormGroupTouched();
    }
  }

  private performRegister(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const registroData: RegistroRequest = {
      nombre: this.registroForm.get('nombre')?.value.trim(),
      telefono: this.registroForm.get('telefono')?.value.trim(),
      ciudad: this.registroForm.get('ciudad')?.value.trim(),
      direccion: this.registroForm.get('direccion')?.value.trim(),
      email: this.registroForm.get('email')?.value.trim(),
      password: this.registroForm.get('password')?.value
    };

    console.log('Datos de registro:', registroData);

    // Simular llamada al servicio (reemplaza con tu servicio real)
    this.simulateRegister(registroData);

    // Implementación real con tu servicio:
    /*
    this.authService.register(registroData)
      .subscribe({
        next: (response: RegistroResponse) => {
          this.handleRegisterSuccess(response);
        },
        error: (error) => {
          this.handleRegisterError(error);
        }
      });
    */
  }

  private simulateRegister(registroData: RegistroRequest): void {
    // Simulación para desarrollo (remover en producción)
    setTimeout(() => {
      // Simular diferentes escenarios
      if (registroData.email === 'error@test.com') {
        this.handleRegisterError({
          error: { message: 'Este email ya está registrado' }
        });
      } else {
        const mockResponse: RegistroResponse = {
          success: true,
          message: 'Usuario registrado exitosamente',
          userId: 'user-' + Date.now()
        };
        this.handleRegisterSuccess(mockResponse);
      }
    }, 2000);
  }

  private handleRegisterSuccess(response: RegistroResponse): void {
    this.isLoading = false;
    console.log('Registro exitoso:', response);
    
    // Redirigir a la página de registro exitoso
    this.router.navigate(['/registro-exitoso'], {
      queryParams: { 
        email: this.registroForm.get('email')?.value,
        nombre: this.registroForm.get('nombre')?.value
      }
    });
  }

  private handleRegisterError(error: any): void {
    this.isLoading = false;
    
    // Manejar diferentes tipos de errores
    if (error.status === 400) {
      this.errorMessage = 'Datos inválidos. Verifica la información ingresada.';
    } else if (error.status === 409) {
      this.errorMessage = 'Este email ya está registrado. Usa otro email.';
    } else if (error.status === 0) {
      this.errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    } else {
      this.errorMessage = error.error?.message || 'Error inesperado. Inténtalo de nuevo.';
    }

    console.error('Error en registro:', error);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registroForm.controls).forEach(key => {
      const control = this.registroForm.get(key);
      control?.markAsTouched();
    });
  }

  public passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmarPassword = formGroup.get('confirmarPassword')?.value;

    // Si las contraseñas no coinciden, devuelve un error, de lo contrario, null
    return password == confirmarPassword ? null : { passwordsMismatch: true };
  }

  private crearFormulario() {
    this.registroForm = this.formBuilder.group({     
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      ciudad: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],     
      password: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(6)]],
      confirmarPassword: ['', [Validators.required]]
    },
      { validators: this.passwordsMatchValidator }
    );
  }

  // Métodos para mostrar/ocultar contraseñas
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  toggleConfirmPassword(): void {
    this.mostrarConfirmPassword = !this.mostrarConfirmPassword;
  }

  // Getters para el template
  get nombreControl() {
    return this.registroForm.get('nombre');
  }

  get telefonoControl() {
    return this.registroForm.get('telefono');
  }

  get emailControl() {
    return this.registroForm.get('email');
  }

  get passwordControl() {
    return this.registroForm.get('password');
  }

  get confirmarPasswordControl() {
    return this.registroForm.get('confirmarPassword');
  }

  // Método para ir al login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}