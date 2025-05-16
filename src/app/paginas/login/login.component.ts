import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],  // Importa ReactiveFormsModule y CommonModule
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginForm!: FormGroup;


  /**
   *
  constructor(private formBuilder: FormBuilder) {
    
    this.crearFormulario(); 
  } 
   */

    constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  iniciarSesion() {
    if (this.loginForm.valid) {
      const datosLogin = this.loginForm.value;
      console.log('Login exitoso:', datosLogin);
      // Aquí va la lógica para autenticar contra backend
    } else {
      console.log('Formulario inválido');
      this.loginForm.markAllAsTouched();
    }
  }
   
}
   
  
