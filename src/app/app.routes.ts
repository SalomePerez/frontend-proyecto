import { Routes } from '@angular/router';

// ===== PÁGINAS DE AUTENTICACIÓN Y REGISTRO =====
import { InicioSesionComponent } from './paginas/inicio-sesion/inicio-sesion.component';
import { RegistroComponent } from './paginas/registro/registro.component';
import { RegistroExitosoComponent } from './paginas/registro-exitoso/registro-exitoso.component';
import { ActivarCuentaComponent } from './paginas/activar-cuenta/activar-cuenta.component';
import { RecuperarContraseniaComponent } from './paginas/recuperar-contrasenia/recuperar-contrasenia.component';
import { ModificarContraseniaComponent } from './paginas/modificar-contrasenia/modificar-contrasenia.component';
import { ModificarContraseniaExitosoComponent } from './paginas/modificar-contrasenia-exitoso/modificar-contrasenia-exitoso.component';
import { CambiarContraseniaComponent } from './paginas/cambiar-contrasenia/cambiar-contrasenia.component';

// ===== DASHBOARDS Y VISTAS PRINCIPALES =====
import { HomeComponent } from './paginas/home/home.component';
import { PrincipalClienteComponent } from './paginas/principal-cliente/principal-cliente.component';
// Cambia esta línea para usar tu componente admin actual
import { PrincipalAdministradorComponent } from './paginas/principal-administrador/principal-administrador.component';

// ===== GESTIÓN DE REPORTES =====
import { CrearReporteComponent } from './paginas/crear-reporte/crear-reporte.component';
import { DetalleReporteComponent } from './paginas/detalle-reporte/detalle-reporte.component';
import { MisReportesComponent } from './paginas/mis-reportes/mis-reportes.component';
import { ReportesPropiosComponent } from './paginas/reportes-propios/reportes-propios.component';
import { EditarReporteComponent } from './paginas/editar-reporte/editar-reporte.component';

export const routes: Routes = [
  
  // ===== RUTA RAÍZ =====
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // ===== RUTAS PÚBLICAS =====
  { path: 'home', component: HomeComponent },
  
  // ===== AUTENTICACIÓN =====
  { path: 'login', component: InicioSesionComponent },
  { path: 'inicio-sesion', component: InicioSesionComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'registro-exitoso', component: RegistroExitosoComponent },
  { path: 'activar-cuenta', component: ActivarCuentaComponent },
  { path: 'recuperar-contrasenia', component: RecuperarContraseniaComponent },
  { path: 'modificar-contrasenia', component: ModificarContraseniaComponent },
  { path: 'modificar-contrasenia-exitoso', component: ModificarContraseniaExitosoComponent },
  { path: 'cambiar-contrasenia', component: CambiarContraseniaComponent },

  // ===== DASHBOARDS =====
  { path: 'principal-cliente', component: PrincipalClienteComponent },
  { path: 'dashboard', component: PrincipalClienteComponent },
  { path: 'admin', component: PrincipalAdministradorComponent },
  { path: 'principal-admin', component: PrincipalAdministradorComponent }, // Sin guard por ahora
  
  // ===== GESTIÓN DE REPORTES =====
  { path: 'crear-reporte', component: CrearReporteComponent },
  { path: 'mis-reportes', component: MisReportesComponent },
  { path: 'detalle-reporte', component: DetalleReporteComponent },
  { path: 'editar-reporte', component: EditarReporteComponent },
  { path: 'reportes-propios', component: ReportesPropiosComponent },
  
  // ===== DASHBOARDS - PROTEGIDOS POR ROL =====
  { 
    path: 'principal-cliente', 
    component: PrincipalClienteComponent,
    canActivate: ['AuthGuard'],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'dashboard', 
    component: PrincipalClienteComponent,
    canActivate: ['AuthGuard'],
    data: { role: 'CLIENTE' }
  },

  // ===== GESTIÓN DE REPORTES - PROTEGIDAS =====
  { 
    path: 'crear-reporte', 
    component: CrearReporteComponent,
    canActivate: ['AuthGuard'],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'detalle-reporte', 
    component: DetalleReporteComponent,
    canActivate: ['AuthGuard'],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'mis-reportes', 
    component: MisReportesComponent,
    canActivate: ['AuthGuard'],
    data: { role: 'CLIENTE' }
  },
  {
    path: 'editar-reporte',
    component: EditarReporteComponent,
    canActivate: ['AuthGuard'],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'reportes-propios', 
    component: ReportesPropiosComponent,
    canActivate: ['AuthGuard'],
    data: { role: 'CLIENTE' }
  },

  // ===== RUTA WILDCARD (DEBE IR AL FINAL) =====
  { path: '**', redirectTo: '/home' }
];