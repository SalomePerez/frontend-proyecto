import { Routes } from '@angular/router';

// Páginas de autenticación y registro
import { InicioComponent } from './paginas/inicio/inicio.component';
import { LoginComponent } from './paginas/login/login.component';
import { RegistroComponent } from './paginas/registro/registro.component';
import { ActivarCuentaComponent } from './paginas/activar-cuenta/activar-cuenta.component';
import { RecuperarContraseniaComponent } from './paginas/recuperar-contrasenia/recuperar-contrasenia.component';
import { CambiarContraseniaComponent } from './paginas/cambiar-contrasenia/cambiar-contrasenia.component';

// Home y vistas generales
import { HomeComponent } from './paginas/home/home.component';
import { InicioAdminComponent } from './paginas/inicio-admin/inicio-admin.component';
import { InicioClienteComponent } from './paginas/inicio-cliente/inicio-cliente.component';

// Reportes
import { CrearReporteComponent } from './paginas/crear-reporte/crear-reporte.component';
import { EditarReporteComponent } from './paginas/editar-reporte/editar-reporte.component';
import { DetalleReporteComponent } from './paginas/detalle-reporte/detalle-reporte.component';
import { GestionarReportesComponent } from './paginas/gestionar-reportes/gestionar-reportes.component';
import { HistorialReporteComponent } from './paginas/historial-reporte/historial-reporte.component';
import { MisReportesComponent } from './paginas/mis-reportes/mis-reportes.component';
import { NotificacionesComponent } from './paginas/notificaciones/notificaciones.component';
import { VerificarReporteComponent } from './paginas/verificar-reporte/verificar-reporte.component';
import { RechazarReporteComponent } from './paginas/rechazar-reporte/rechazar-reporte.component';
import { RevisionReporteComponent } from './paginas/revision-reporte/revision-reporte.component';

// Usuario
import { PerfilAdministradorComponent } from './paginas/perfil-administrador/perfil-administrador.component';
import { PerfilClienteComponent } from './paginas/perfil-cliente/perfil-cliente.component';
import { EditarPerfilUsuarioComponent } from './paginas/editar-perfil-usuario/editar-perfil-usuario.component';
import { EliminarCuentaComponent } from './paginas/eliminar-cuenta/eliminar-cuenta.component';
import { EliminarAdministradorComponent } from './paginas/eliminar-administrador/eliminar-administrador.component';

// Informes y filtros
import { GenerarInformesComponent } from './paginas/generar-informes/generar-informes.component';
import { InformesPorCategoriaComponent } from './paginas/informes-por-categoria/informes-por-categoria.component';
import { InformesPorZonaComponent } from './paginas/informes-por-zona/informes-por-zona.component';
import { FiltrarPorPrioridadComponent } from './paginas/filtrar-por-prioridad/filtrar-por-prioridad.component';
import { FiltrarPorUbicacionComponent } from './paginas/filtrar-por-ubicacion/filtrar-por-ubicacion.component';

// Categorías
import { CategoriasComponent } from './paginas/categorias/categorias.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'activar-cuenta', component: ActivarCuentaComponent },
  { path: 'recuperar-contrasenia', component: RecuperarContraseniaComponent },
  { path: 'cambiar-contrasenia', component: CambiarContraseniaComponent },
  { path: 'home', component: HomeComponent },
  { path: 'inicio-admin', component: InicioAdminComponent },
  { path: 'inicio-cliente', component: InicioClienteComponent },
  { path: 'crear-reporte', component: CrearReporteComponent },
  { path: 'editar-reporte', component: EditarReporteComponent },
  { path: 'detalle-reporte', component: DetalleReporteComponent },
  { path: 'gestionar-reportes', component: GestionarReportesComponent },
  { path: 'historial-reporte', component: HistorialReporteComponent },
  { path: 'mis-reportes', component: MisReportesComponent },
  { path: 'notificaciones', component: NotificacionesComponent },
  { path: 'verificar-reporte', component: VerificarReporteComponent },
  { path: 'rechazar-reporte', component: RechazarReporteComponent },
  { path: 'revision-reporte', component: RevisionReporteComponent },
  { path: 'perfil-administrador', component: PerfilAdministradorComponent },
  { path: 'perfil-cliente', component: PerfilClienteComponent },
  { path: 'editar-perfil-usuario', component: EditarPerfilUsuarioComponent },
  { path: 'eliminar-cuenta', component: EliminarCuentaComponent },
  { path: 'eliminar-administrador', component: EliminarAdministradorComponent },
  { path: 'generar-informes', component: GenerarInformesComponent },
  { path: 'informes-por-categoria', component: InformesPorCategoriaComponent },
  { path: 'informes-por-zona', component: InformesPorZonaComponent },
  { path: 'filtrar-por-prioridad', component: FiltrarPorPrioridadComponent },
  { path: 'filtrar-por-ubicacion', component: FiltrarPorUbicacionComponent },
  { path: 'categorias', component: CategoriasComponent },
  { path: '**', pathMatch: 'full', redirectTo: '' }
];
