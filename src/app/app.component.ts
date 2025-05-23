import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './componentes/header/header.component';
import { FooterComponent } from './componentes/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'my-app';
  footer = 'Universidad del Quindío - 2025-1';

  constructor(public router: Router) {}

  mostrarHeaderFooter(): boolean {
    const rutasSinHeaderFooter = ['/login', '/registro', '/recuperar-contrasenia', '/activar-cuenta'];
    return !rutasSinHeaderFooter.includes(this.router.url);
  }
}
