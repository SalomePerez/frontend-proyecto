import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-modificar-contrasenia-exitoso',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './modificar-contrasenia-exitoso.component.html',
  styleUrls: ['./modificar-contrasenia-exitoso.component.css']
})
export class ModificarContraseniaExitosoComponent implements OnInit, OnDestroy {
  showCountdown: boolean = true;
  countdown: number = 5;
  private countdownInterval: any;
  private destroy$ = new Subject<void>();

  // Datos opcionales del usuario
  userEmail: string = '';
  
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getQueryParams();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCountdown();
  }

  private getQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.userEmail = params['email'] || '';
        
        // Si viene desde el flujo de recuperación, activar countdown
        if (params['auto'] === 'true') {
          this.showCountdown = true;
        } else {
          // Si accede directamente, no mostrar countdown
          this.showCountdown = false;
        }
      });
  }

  private startCountdown(): void {
    if (!this.showCountdown) return;

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        this.goToLogin();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  goToLogin(): void {
    this.clearCountdown();
    
    // Navegar al login con mensaje opcional
    if (this.userEmail) {
      this.router.navigate(['/login'], {
        queryParams: { 
          message: 'Contraseña restablecida exitosamente',
          email: this.userEmail 
        }
      });
    } else {
      this.router.navigate(['/login'], {
        queryParams: { 
          message: 'Contraseña restablecida exitosamente' 
        }
      });
    }
  }

  // Método para cancelar el countdown automático
  cancelCountdown(): void {
    this.showCountdown = false;
    this.clearCountdown();
  }

  // Método para reiniciar el proceso (opcional)
  resetPassword(): void {
    this.router.navigate(['/recuperar-contrasenia']);
  }
}