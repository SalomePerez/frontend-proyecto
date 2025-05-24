import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string;
  ciudad?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'userData';
  private readonly EXPIRY_KEY = 'tokenExpiry';

  // BehaviorSubject para manejar el estado de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);

  // Observables públicos
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Verificar sesión al inicializar el servicio
    this.checkInitialAuthState();
  }

  /**
   * Verificar estado inicial de autenticación
   */
  private checkInitialAuthState(): void {
    const token = this.getToken();
    const userData = this.getUserData();
    
    if (token && userData && this.isTokenValid()) {
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(userData);
    } else {
      this.clearSession();
    }
  }

  /**
   * Guardar datos de sesión después del login
   */
  saveSession(token: string, usuario: Usuario, expiresInMinutes: number = 60): void {
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + expiresInMinutes);

    // Guardar en localStorage
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    localStorage.setItem(this.EXPIRY_KEY, expiryTime.getTime().toString());

    // Actualizar BehaviorSubjects
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(usuario);
  }

  /**
   * Obtener token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtener datos del usuario del localStorage
   */
  getUserData(): Usuario | null {
    const userDataStr = localStorage.getItem(this.USER_KEY);
    if (userDataStr) {
      try {
        return JSON.parse(userDataStr) as Usuario;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Verificar si el token es válido (no expirado)
   */
  isTokenValid(): boolean {
    const expiryStr = localStorage.getItem(this.EXPIRY_KEY);
    if (!expiryStr) return false;

    const expiryTime = parseInt(expiryStr);
    const currentTime = new Date().getTime();
    
    return currentTime < expiryTime;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value && this.isTokenValid();
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtener rol del usuario actual
   */
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.rol : null;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole?.toUpperCase() === role.toUpperCase();
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.clearSession();
  }

  /**
   * Limpiar todos los datos de sesión
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
    
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Obtener headers de autorización para peticiones HTTP
   */
  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    return {};
  }

  /**
   * Renovar token (si tu backend lo soporta)
   */
  refreshToken(): Observable<any> {
    // Implementar si tu backend tiene endpoint de refresh token
    throw new Error('Refresh token not implemented');
  }

  /**
   * Verificar si la sesión expira pronto (últimos 5 minutos)
   */
  isSessionExpiringSoon(): boolean {
    const expiryStr = localStorage.getItem(this.EXPIRY_KEY);
    if (!expiryStr) return false;

    const expiryTime = parseInt(expiryStr);
    const currentTime = new Date().getTime();
    const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutos en millisegundos
    
    return (expiryTime - currentTime) < fiveMinutesInMs;
  }
}