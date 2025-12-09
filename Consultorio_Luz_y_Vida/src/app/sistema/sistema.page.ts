import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-sistema',
  templateUrl: './sistema.page.html',
  styleUrls: ['./sistema.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
  ]
})
export class SistemaPage implements OnInit {
  
  isLoading: boolean = false;
  stats = {
    total_medicos: 0,
    total_citas: 0,
    medicos_disponibles_hoy: 0
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadSystemStats();
  }

  // --- Consulta de Estadísticas (Semana 7: Web Service/Consulta) ---
  
  loadSystemStats() {
    this.isLoading = true;
    
    this.authService.getSystemStats().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success' && res.data) {
          this.stats = res.data;
        } else {
          this.presentToast('Error al cargar estadísticas.', 'warning');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error de conexión con el WS de stats:', err);
        this.presentToast('Error de conexión con el servidor.', 'danger');
      }
    });
  }

  // --- Funciones de Navegación Administrativa (Routers, Semana 6) ---

  // Navegación con parámetro 'accion' para sub-páginas de gestión
  
  goToGestionMedicos(accion: string) {
    this.router.navigate(['/gestion-medicos', { accion: accion }]);
  }
  
  goToGestionCitas(accion: string) {
    this.router.navigate(['/gestion-citas-admin', { accion: accion }]);
  }
  
  goToGestionDisponibilidad(accion: string) {
    this.router.navigate(['/gestion-disponibilidad-admin', { accion: accion }]);
  }
  
  goToGestionLogin(accion: string) {
    // Gestión de usuarios de sistema y médicos (login)
    this.router.navigate(['/gestion-login', { accion: accion }]); 
  }

  // --- Logout ---
  async logout() {
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('rol_usuario');
    this.router.navigate(['/login']);
  }
  
  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}
