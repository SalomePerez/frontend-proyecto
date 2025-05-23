import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';  // Importa RouterModule

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,  
  imports: [
    RouterModule  // Agrega RouterModule aquí para usar routerLink en la plantilla
  ]
})
export class HeaderComponent {
  title = 'Alertas App';  // Declaras la variable title con el valor pedido
}
