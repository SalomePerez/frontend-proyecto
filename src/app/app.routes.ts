import { Routes } from '@angular/router';

// ===== PÁGINAS DE AUTENTICACIÓN Y REGISTRO =====
import { InicioSesionComponent } from './paginas/inicio-sesion/inicio-sesion.component';
import { RegistroComponent } from './paginas/registro/registro.component';
import { ActivarCuentaComponent } from './paginas/activar-cuenta/activar-cuenta.component';
import { RecuperarContraseniaComponent } from './paginas/recuperar-contrasenia/recuperar-contrasenia.component';
import { ModificarContraseniaComponent } from './paginas/modificar-contrasenia/modificar-contrasenia.component';
import { ModificarContraseniaExitosoComponent } from './paginas/modificar-contrasenia-exitoso/modificar-contrasenia-exitoso.component';
import { CambiarContraseniaComponent } from './paginas/cambiar-contrasenia/cambiar-contrasenia.component';

// ===== DASHBOARDS Y VISTAS PRINCIPALES =====
import { HomeComponent } from './paginas/home/home.component';
import { PrincipalClienteComponent } from './paginas/principal-cliente/principal-cliente.component';
import { MisReportesComponent } from './paginas/mis-reportes/mis-reportes.component';

// ===== GESTIÓN DE REPORTES =====
import { CrearReporteComponent } from './paginas/crear-reporte/crear-reporte.component';

export const routes: Routes = [
  
  // ===== RUTA RAÍZ =====
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ===== AUTENTICACIÓN =====
  { path: 'login', component: InicioSesionComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'activar-cuenta', component: ActivarCuentaComponent },
  { path: 'recuperar-contrasenia', component: RecuperarContraseniaComponent },
  { path: 'modificar-contrasenia', component: ModificarContraseniaComponent },
  { path: 'modificar-contrasenia-exitoso', component: ModificarContraseniaExitosoComponent },
  { path: 'cambiar-contrasenia', component: CambiarContraseniaComponent },
  { 
    path: 'registro-exitoso', 
    loadComponent: () => import('./paginas/registro-exitoso/registro-exitoso.component').then(m => m.RegistroExitosoComponent) 
  },

  // ===== DASHBOARDS PRINCIPALES =====
  { path: 'home', component: HomeComponent },
  { path: 'principal-cliente', component: PrincipalClienteComponent },
  { path: 'dashboard', component: PrincipalClienteComponent },

  // ===== GESTIÓN DE REPORTES =====
  { path: 'crear-reporte', component: CrearReporteComponent },
  { path: 'mis-reportes', component: MisReportesComponent },

  // ===== RUTA WILDCARD (DEBE IR AL FINAL) =====
  { path: '**', redirectTo: '/home' } // Cambiado para no redirigir siempre al login
];