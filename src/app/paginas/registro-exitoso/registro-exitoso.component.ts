import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-exitoso',
  standalone: true,
  templateUrl: './registro-exitoso.component.html',
  styleUrls: ['./registro-exitoso.component.css'],
})
export class RegistroExitosoComponent {
  constructor(private router: Router) {}

  irALogin(): void {
    this.router.navigate(['/login']);
  }
}

