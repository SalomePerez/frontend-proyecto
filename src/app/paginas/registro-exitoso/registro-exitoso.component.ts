import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-exitoso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registro-exitoso.component.html',
  styleUrls: ['./registro-exitoso.component.css']
})
export class RegistroExitosoComponent implements OnInit, OnDestroy {
  
  // Datos del usuario registrado
  userEmail: string = '';
  userName: string = '';
  
  // Estado de UI
  showCheckAnimation: boolean = false;
  countdown: number = 10;
  private countdownInterval: any;

  constructor(private router: Router) {
    this.loadRegistrationData();
  }

  ngOnInit(): void {
    // Mostrar animación de éxito
    setTimeout(() => {
      this.showCheckAnimation = true;
    }, 500);
    
    // Iniciar countdown para redirección automática
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private loadRegistrationData(): void {
    // Obtener datos del registro del localStorage o sessionStorage
    if (typeof Storage !== 'undefined') {
      const registrationData = sessionStorage.getItem('registrationData');
      if (registrationData) {
        try {
          const data = JSON.parse(registrationData);
          this.userEmail = data.email || '';
          this.userName = data.nombre || 'Usuario';
        } catch (error) {
          console.warn('Error parsing registration data:', error);
        }
      }
    }
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.irALogin();
      }
    }, 1000);
  }

  // Métodos de navegación
  irALogin(): void {
    // Limpiar datos temporales
    if (typeof Storage !== 'undefined') {
      sessionStorage.removeItem('registrationData');
    }
    this.router.navigate(['/login']);
  }

  irAActivarCuenta(): void {
    this.router.navigate(['/activar-cuenta']);
  }

  reenviarEmail(): void {
    // Simular reenvío de email
    alert('Se ha reenviado el email de activación a: ' + this.userEmail);
  }
}