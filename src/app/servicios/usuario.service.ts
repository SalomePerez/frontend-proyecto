import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

// Interfaces que coinciden con tu API
export interface RegistroRequest {
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  email: string;
  password: string;
}

// Estructura del MensajeDTO de tu backend
export interface MensajeDTO<T> {
  error: boolean;
  mensaje: T;
}

export interface RegistroResponse extends MensajeDTO<string> {
  // La respuesta será: { error: false, respuesta: "Su registro ha sido exitoso" }
}

// Interface para el código de verificación
export interface CodigoDTO {
  codigo: string;
}

export interface VerificacionResponse extends MensajeDTO<string> {
  // La respuesta será: { error: false, respuesta: "Cuenta activada correctamente" }
}

// Interfaces para Login - CORREGIDAS
export interface LoginDTO {
  correo: string;  // ← Cambio de "email" a "correo"
  password: string;
}

export interface LoginResponse {
  token: string;
  // Nota: Tu backend solo devuelve token, no usuario
}

export interface LoginApiResponse extends MensajeDTO<LoginResponse> {
  // La respuesta será: { error: false, mensaje: { token: "..." } }
}

export interface ApiError {
  message: string;
  status?: number;
  error?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly API_URL = 'https://proyecto-avanzada.onrender.com/api/usuarios';
  private readonly AUTH_URL = 'https://proyecto-avanzada.onrender.com/api/auth';
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  /**
   * Registra un nuevo usuario
   * @param userData Datos del usuario a registrar
   * @returns Observable con la respuesta del servidor
   */
  registrarUsuario(userData: RegistroRequest): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(
      this.API_URL, 
      userData, 
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Iniciar sesión
   * @param loginData Datos de login (correo y password)
   * @returns Observable con la respuesta del servidor
   */
  login(loginData: LoginDTO): Observable<LoginApiResponse> {
    console.log('Intentando login con:', { correo: loginData.correo });
    
    return this.http.post<LoginApiResponse>(
      `${this.AUTH_URL}/login`,
      loginData,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Verificar código de activación de usuario
   * @param email Email del usuario
   * @param codigo Código de verificación
   * @returns Observable con la respuesta del servidor
   */
  verificarCodigoActivacion(email: string, codigo: string): Observable<VerificacionResponse> {
    const codigoDTO: CodigoDTO = { codigo };
    
    // NO codificar el email para que el @ se mantenga
    const emailLimpio = email.trim();
    
    console.log('URL completa:', `${this.API_URL}/${emailLimpio}/verificarCodigoActivacionUsuario`);
    console.log('Datos enviados:', codigoDTO);
    
    return this.http.put<VerificacionResponse>(
      `${this.API_URL}/${emailLimpio}/verificarCodigoActivacionUsuario`,
      codigoDTO,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reenviar código de activación (si tienes este endpoint)
   * @param email Email del usuario
   */
  reenviarCodigoActivacion(email: string): Observable<MensajeDTO<string>> {
    const encodedEmail = encodeURIComponent(email);
    
    return this.http.post<MensajeDTO<string>>(
      `${this.API_URL}/${encodedEmail}/reenviarCodigoActivacion`,
      {},
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar usuario (para futuras funcionalidades)
   * @param id ID del usuario
   * @param userData Datos actualizados
   */
  actualizarUsuario(id: string, userData: Partial<RegistroRequest>): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, userData, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Manejo centralizado de errores
   * @param error Error de la petición HTTP
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Datos de entrada inválidos. Verifica la información ingresada.';
          break;
        case 401:
          errorMessage = 'Email o contraseña incorrectos.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 409:
          errorMessage = 'El email electrónico ya está registrado. Usa otro email.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
          break;
        case 0:
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
          break;
        default:
          // Si el backend devuelve un MensajeDTO con error
          if (error.error?.error && error.error?.mensaje) {
            errorMessage = error.error.mensaje;
          } else {
            errorMessage = `Error del servidor: ${error.status}`;
          }
      }
    }

    console.error('Error en UsuarioService:', error);
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error
    } as ApiError));
  };
}