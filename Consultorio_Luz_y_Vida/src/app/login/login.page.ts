import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { IonicModule } from '@ionic/angular';
// Se usa localStorage para variables de sesión en lugar de Capacitor Storage


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  // Modelo de datos para el formulario
  credenciales = {
    usuario: '',
    clave: ''
  };

  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router
  ) { }

  ngOnInit() {
    // Si usaste la plantilla tabs, debes importar FormsModule en el login.module.ts
  }

  // --- Función de Login (Semana 7: Web Service) ---
  onLogin() {
    this.isLoading = true;
    this.error = null;

    // Llama al método login del servicio, enviando las credenciales al Web Service PHP
    this.authService.login(this.credenciales).subscribe({
      next: async (res: any) => {
        this.isLoading = false;

        if (res.status === 'success') {
          // Login exitoso, guardar variables de sesión (Semana 6)
          await this.saveSession(res.id_usuario, res.rol);
          
          // Redireccionar según el rol (Routers, Semana 6)
          if (res.rol === 'Sistema') {
            this.router.navigate(['/sistema']);
          } else if (res.rol === 'Medico') {
            this.router.navigate(['/medicos']);
          }
        } else {
          this.error = res.message; // Muestra el mensaje de error del PHP
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error de conexión con el WS:', err);
        this.error = 'Error de conexión con el servidor. Verifique XAMPP.';
      }
    });
  }

  // --- Manejo de Variables de Sesión (Semana 6: ahora localStorage) ---
  async saveSession(id: number, rol: string) {
    localStorage.setItem('id_usuario', id.toString());
    localStorage.setItem('rol_usuario', rol);
    // Puedes también guardar la cédula, nombre, etc. aquí si el WS te los devuelve.
  }
}