import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

// ===== PÁGINAS DE AUTENTICACIÓN Y REGISTRO =====
import { InicioComponent } from './paginas/inicio/inicio.component';
import { InicioSesionComponent } from './paginas/inicio-sesion/inicio-sesion.component';
import { RegistroComponent } from './paginas/registro/registro.component';
import { ActivarCuentaComponent } from './paginas/activar-cuenta/activar-cuenta.component';
import { RecuperarContraseniaComponent } from './paginas/recuperar-contrasenia/recuperar-contrasenia.component';
import { ModificarContraseniaComponent } from './paginas/modificar-contrasenia/modificar-contrasenia.component';
import { ModificarContraseniaExitosoComponent } from './paginas/modificar-contrasenia-exitoso/modificar-contrasenia-exitoso.component';
import { CambiarContraseniaComponent } from './paginas/cambiar-contrasenia/cambiar-contrasenia.component';

// ===== DASHBOARDS Y VISTAS PRINCIPALES =====
import { HomeComponent } from './paginas/home/home.component';
import { InicioAdminComponent } from './paginas/inicio-admin/inicio-admin.component';
import { InicioClienteComponent } from './paginas/inicio-cliente/inicio-cliente.component';
import { PrincipalClienteComponent } from './paginas/principal-cliente/principal-cliente.component';

// ===== GESTIÓN DE REPORTES =====
import { CrearReporteComponent } from './paginas/crear-reporte/crear-reporte.component';
import { EditarReporteComponent } from './paginas/editar-reporte/editar-reporte.component';
import { DetalleReporteComponent } from './paginas/detalle-reporte/detalle-reporte.component';
import { MisReportesComponent } from './paginas/mis-reportes/mis-reportes.component';
import { GestionarReportesComponent } from './paginas/gestionar-reportes/gestionar-reportes.component';
import { HistorialReporteComponent } from './paginas/historial-reporte/historial-reporte.component';
import { VerificarReporteComponent } from './paginas/verificar-reporte/verificar-reporte.component';
import { RechazarReporteComponent } from './paginas/rechazar-reporte/rechazar-reporte.component';
import { RevisionReporteComponent } from './paginas/revision-reporte/revision-reporte.component';
import { NotificacionesComponent } from './paginas/notificaciones/notificaciones.component';

// ===== PERFILES DE USUARIO =====
import { PerfilAdministradorComponent } from './paginas/perfil-administrador/perfil-administrador.component';
import { PerfilClienteComponent } from './paginas/perfil-cliente/perfil-cliente.component';
import { EditarPerfilUsuarioComponent } from './paginas/editar-perfil-usuario/editar-perfil-usuario.component';
import { EliminarCuentaComponent } from './paginas/eliminar-cuenta/eliminar-cuenta.component';
import { EliminarAdministradorComponent } from './paginas/eliminar-administrador/eliminar-administrador.component';

// ===== INFORMES Y REPORTES =====
import { GenerarInformesComponent } from './paginas/generar-informes/generar-informes.component';
import { InformesPorCategoriaComponent } from './paginas/informes-por-categoria/informes-por-categoria.component';
import { InformesPorZonaComponent } from './paginas/informes-por-zona/informes-por-zona.component';
import { FiltrarPorPrioridadComponent } from './paginas/filtrar-por-prioridad/filtrar-por-prioridad.component';
import { FiltrarPorUbicacionComponent } from './paginas/filtrar-por-ubicacion/filtrar-por-ubicacion.component';

// ===== CONFIGURACIÓN Y ADMINISTRACIÓN =====
import { CategoriasComponent } from './paginas/categorias/categorias.component';

export const routes: Routes = [
  
  // ===== RUTA RAÍZ =====
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ===== RUTAS PÚBLICAS (SIN PROTECCIÓN) =====
  { path: 'login', component: InicioSesionComponent },
  { path: 'inicio', component: InicioComponent },
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

  // ===== DASHBOARDS - PROTEGIDOS POR ROL =====
  { 
    path: 'home', 
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'inicio-admin', 
    component: InicioAdminComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'inicio-cliente', 
    component: InicioClienteComponent,
    canActivate: [AuthGuard],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'principal-cliente', 
    component: PrincipalClienteComponent,
    canActivate: [AuthGuard],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'dashboard', 
    component: PrincipalClienteComponent,
    canActivate: [AuthGuard],
    data: { role: 'CLIENTE' }
  },

  // ===== GESTIÓN DE REPORTES - PROTEGIDAS =====
  { 
    path: 'crear-reporte', 
    component: CrearReporteComponent,
    canActivate: [AuthGuard],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'editar-reporte', 
    component: EditarReporteComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'detalle-reporte', 
    component: DetalleReporteComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'mis-reportes', 
    component: MisReportesComponent,
    canActivate: [AuthGuard],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'gestionar-reportes', 
    component: GestionarReportesComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'historial-reporte', 
    component: HistorialReporteComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'verificar-reporte', 
    component: VerificarReporteComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'rechazar-reporte', 
    component: RechazarReporteComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'revision-reporte', 
    component: RevisionReporteComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'notificaciones', 
    component: NotificacionesComponent,
    canActivate: [AuthGuard]
  },

  // ===== PERFILES DE USUARIO - PROTEGIDOS =====
  { 
    path: 'perfil-administrador', 
    component: PerfilAdministradorComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'perfil-cliente', 
    component: PerfilClienteComponent,
    canActivate: [AuthGuard],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'editar-perfil-usuario', 
    component: EditarPerfilUsuarioComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'eliminar-cuenta', 
    component: EliminarCuentaComponent,
    canActivate: [AuthGuard],
    data: { role: 'CLIENTE' }
  },
  { 
    path: 'eliminar-administrador', 
    component: EliminarAdministradorComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },

  // ===== INFORMES Y ANÁLISIS - SOLO ADMINISTRADORES =====
  { 
    path: 'generar-informes', 
    component: GenerarInformesComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'informes-por-categoria', 
    component: InformesPorCategoriaComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'informes-por-zona', 
    component: InformesPorZonaComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'filtrar-por-prioridad', 
    component: FiltrarPorPrioridadComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },
  { 
    path: 'filtrar-por-ubicacion', 
    component: FiltrarPorUbicacionComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },

  // ===== CONFIGURACIÓN Y ADMINISTRACIÓN - SOLO ADMINISTRADORES =====
  { 
    path: 'categorias', 
    component: CategoriasComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMINISTRADOR' }
  },

  // ===== RUTA WILDCARD (DEBE IR AL FINAL) =====
  { path: '**', redirectTo: '/login' }
];
