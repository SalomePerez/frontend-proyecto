import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../servicios/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    // Verificar si está autenticado
    if (this.authService.isAuthenticated()) {
      
      // Verificar rol específico si se requiere
      const requiredRole = route.data?.['role'];
      if (requiredRole) {
        if (this.authService.hasRole(requiredRole)) {
          return true;
        } else {
          // Redirigir a página de acceso denegado o dashboard según rol
          this.redirectBasedOnRole();
          return false;
        }
      }
      
      return true;
    }

    // Si no está autenticado, redirigir al login
    console.log('Usuario no autenticado, redirigiendo al login');
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  /**
   * Redirigir basado en el rol del usuario actual
   */
  private redirectBasedOnRole(): void {
    const userRole = this.authService.getUserRole();
    
    switch (userRole?.toUpperCase()) {
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
}