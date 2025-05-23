/**
 * import { Injectable } from '@angular/core';
import { ReporteDTO } from '../dto/reporte-dto';


@Injectable({
 providedIn: 'root'
})
export class ReportesService {


 reportes: ReporteDTO[];


 constructor() {
   this.reportes;
   this.crearReportesPrueba();
 }


 public listar() {
   return this.reportes;
 }


 public crear(crearReporteDTO: ReporteDTO) {
   this.reportes.push(crearReporteDTO);
 }


 public obtener(id: string): ReporteDTO | undefined {
   return this.reportes.find(reporte => reporte.id == id);
 }


 public eliminar(id: String) {
   this.reportes = this.reportes.filter(reporte => reporte.id != id);
 }


 public editar(id: string, editarReporteDTO: ReporteDTO) {
   const indice = this.reportes.findIndex(reporte => reporte.id == id);
   if (indice != -1) {
     this.reportes[indice] = editarReporteDTO;
   }
 }

 public crearReportesPrueba() {
 this.reportes.push({
   id: '1',
   titulo: 'Reporte 1',
   descripcion: 'Descripción del reporte 1',
   fecha: new Date(),
   categoria: 'Alumbrado Público',
   ubicacion: {
     latitud: 4.532223167514729,
     longitud: -75.67406052559213
   },
   ciudad: 'Armenia',
   imagen: 'https://picsum.photos/300?random=1',
   estadoActual: 'Pendiente'
 });


 this.reportes.push({
   id: '2',
   titulo: 'Reporte 2',
   descripcion: 'Descripción del reporte 2',
   fecha: new Date(),
   categoria: 'Robo',
   ubicacion: {
     latitud: 4.532028280084418,
     longitud: -75.67143334464234
   },
   ciudad: 'Pereira',
   imagen: 'https://picsum.photos/300?random=2',
   estadoActual: 'Verificado'
 });


 this.reportes.push({
   id: '3',
   titulo: 'Reporte 3',
   descripcion: 'Descripción del reporte 3',
   fecha: new Date(),
   categoria: 'Mascota Perdida',
   ubicacion: {
     latitud: 4.533043571849234,
     longitud: -75.67568963143513
   },
   ciudad: 'Armenia',
   imagen: 'https://picsum.photos/300?random=3',
   estadoActual: 'Pendiente'
 });


}




}


 */