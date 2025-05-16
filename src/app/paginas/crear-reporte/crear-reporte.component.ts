import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-reporte',
  templateUrl: './crear-reporte.component.html',
  styleUrls: ['./crear-reporte.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class CrearReporteComponent {
  imagenesSeleccionadas: File[] = [];
  crearReporteForm!: FormGroup;
  categorias: string[];
  ciudades: string[];


constructor(private formBuilder: FormBuilder) {
  this.crearFormulario();
  this.categorias = [
    'Mascota Perdida',
    'Robo',
    'Alumbrado público',
    'Huecos en la vía'
  ];
  this.ciudades = ['PEREIRA', 'ARMENIA', 'MEDELLIN', 'BOGOTA', 'CALI'];
}


  private crearFormulario() {
    this.crearReporteForm = this.formBuilder.group({
      titulo: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      categoria: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      ubicacion: ['', [Validators.required]],
      imagen: ['', [Validators.required]],
    });
  }

  public crearReporte() {
    console.log(this.crearReporteForm.value);
  }


public onFileChange(event: any) {
  if (event.target.files.length > 0) {
    const files: FileList = event.target.files;

    // Creamos un arreglo para almacenar los nombres de los archivos
    const nombresArchivos: string[] = [];

    // Recorremos todos los archivos seleccionados
    for (let i = 0; i < files.length; i++) {
      nombresArchivos.push(files[i].name);
    }

    // Guardamos la lista de nombres en el formulario como una cadena separada por comas
    this.crearReporteForm.get('imagen')?.setValue(nombresArchivos.join(', '));
  }
}



}




