import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-registro-exitoso',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './registro-exitoso.component.html',
  styleUrls: ['./registro-exitoso.component.css']
})
export class RegistroExitosoComponent implements OnInit, OnDestroy {
  
  // Datos del usuario
  userEmail: string = '';
  userName: string = '';
  
  // Estados del componente
  showCountdown: boolean = true;
  countdown: number = 5;
  private countdownInterval: any;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getUserData();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCountdown();
  }

  private getUserData(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.userEmail = params['email'] || '';
        this.userName = params['nombre'] || 'Usuario';
        
        console.log('Datos del registro recibidos:', { 
          email: this.userEmail, 
          nombre: this.userName 
        });
      });
  }

  private startCountdown(): void {
    if (!this.showCountdown) return;

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        this.goToActivateAccount();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Navegar a activar cuenta (método principal para countdown)
   */
  goToActivateAccount(): void {
    console.log('=== REDIRECCIÓN AUTOMÁTICA ===');
    this.clearCountdown();
    
    // Usar el mismo método que el botón manual
    this.activateAccountNow();
  }

  /**
   * Método para el botón "Activar Cuenta" (acción manual)
   */
  activateAccountNow(): void {
    console.log('=== BOTÓN ACTIVAR CUENTA CLICKEADO ===');
    console.log('Email del usuario:', this.userEmail);
    
    // Detener cualquier countdown
    this.clearCountdown();
    this.showCountdown = false;
    
    try {
      // Navegar a activar cuenta
      this.router.navigate(['/activar-cuenta'], {
        queryParams: { 
          email: this.userEmail,
          fromRegistration: 'true'
        }
      }).then(success => {
        if (success) {
          console.log('✅ Navegación exitosa a /activar-cuenta');
        } else {
          console.error('❌ Fallo en la navegación');
        }
      }).catch(error => {
        console.error('❌ Error en navegación:', error);
        this.handleNavigationError(error);
      });
      
    } catch (error) {
      console.error('❌ Error ejecutando navegación:', error);
      this.handleNavigationError(error);
    }
  }

  /**
   * Cancelar la redirección automática
   */
  cancelCountdown(): void {
    console.log('Countdown cancelado por el usuario');
    this.showCountdown = false;
    this.clearCountdown();
  }

  /**
   * Método para manejar errores de navegación
   */
  private handleNavigationError(error: any): void {
    console.error('Error de navegación:', error);
    
    // Fallback: intentar ir a activar cuenta sin parámetros
    this.router.navigate(['/activar-cuenta']).catch(fallbackError => {
      console.error('Error en fallback de navegación:', fallbackError);
      // Último recurso: ir a la activacion de cuenta
      this.router.navigate(['/activar-cuenta']);
    });
  }

  /**
   * Método para testing - llenar con datos de prueba
   */
  fillTestData(): void {
    this.userEmail = 'test@segurapp.com';
    this.userName = 'Usuario de Prueba';
  }

  /**
   * Verificar si hay datos de usuario válidos
   */
  get hasUserData(): boolean {
    return !!(this.userEmail && this.userEmail.trim().length > 0);
  }

  /**
   * Obtener mensaje personalizado según el usuario
   */
  get personalizedMessage(): string {
    if (this.userName) {
      return `¡Hola ${this.userName}! Tu cuenta ha sido creada exitosamente.`;
    }
    return 'Tu cuenta ha sido creada exitosamente.';
  }

  /**
   * Método para volver al registro (si hay algún error)
   */
  goBackToRegister(): void {
    this.clearCountdown();
    this.router.navigate(['/registro']);
  }

  /**
   * Método para ir al home (opción adicional)
   */
  goToHome(): void {
    this.clearCountdown();
    this.router.navigate(['/home']);
  }
}