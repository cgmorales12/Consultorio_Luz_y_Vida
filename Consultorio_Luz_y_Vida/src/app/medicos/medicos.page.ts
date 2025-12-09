import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth'; // Asegúrate que esta ruta a 'auth.ts' sea correcta
import { IonicModule, ToastController, AlertController } from '@ionic/angular'; // Para mostrar mensajes

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './medicos.page.html',
  styleUrls: ['./medicos.page.scss'],
})
export class MedicosPage implements OnInit {
  
  idMedico: number | null = null;
  citasPendientes: any[] = [];
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastController: ToastController, // Se agrega para notificaciones
    private alertController: AlertController // Se agrega para confirmaciones
  ) { }

  ngOnInit() {
    // Al cargar la página, cargamos la ID del médico de la sesión y las citas
    this.loadMedicoIdAndCitas();
  }

  // --- Lógica de Sesión y Carga Inicial (Semana 6 y 7) ---
  
  async loadMedicoIdAndCitas() {
    this.isLoading = true;
    
    // Obtener ID del médico de la sesión (localStorage)
    const idValue = localStorage.getItem('id_usuario');

    if (idValue) {
      this.idMedico = parseInt(idValue);
      this.loadCitasPendientes(); // Cargar citas si el ID es válido
    } else {
      // Si no hay ID, es un acceso no autorizado. Redireccionar al login.
      this.presentToast('Sesión expirada. Por favor, ingrese nuevamente.', 'danger');
      this.logout();
    }
  }

  loadCitasPendientes() {
    if (!this.idMedico) {
        this.isLoading = false;
        return;
    }
    
    this.authService.getCitasPendientes(this.idMedico).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success') {
          // Asume que si 'data' está vacío o no existe, no hay citas.
          this.citasPendientes = res.citas || []; 
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar citas:', err);
        this.presentToast('Error de conexión al cargar las citas.', 'danger');
      }
    });
  }
  
  // --- Funciones de Acción Rápida (Aprobación, CRUD Update) ---

  async aprobarCitaRapida(idCita: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar Aprobación',
      message: '¿Está seguro de que desea **confirmar** esta cita?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Confirmar', 
          handler: () => {
            this.updateCitaEstado(idCita, 2, 'Cita aprobada.'); // 2 = Cita confirmada
          }
        }
      ]
    });
    await alert.present();
  }

  updateCitaEstado(idCita: number, idEstado: number, successMessage: string) {
    const data = { 
      id_cita: idCita, 
      id_estado: idEstado 
    };
    
    this.authService.updateCitaEstado(data).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.presentToast(successMessage, 'success');
          this.loadCitasPendientes(); // Recargar la lista para quitar la cita aprobada
        } else {
          this.presentToast(res.message, 'danger');
        }
      },
      error: (err) => {
        this.presentToast('Error al actualizar el estado de la cita.', 'danger');
        console.error('Error al actualizar cita:', err);
      }
    });
  }

  // --- Funciones de Navegación (Routers, Semana 6) ---

  goToCrearCita() {
    this.router.navigate(['/crear-cita-medico']); 
  }
  
  goToAprobarCita() {
    this.router.navigate(['/gestion-citas', { gestion: 'aprobacion' }]);
  }

  goToModificarCita() {
    this.router.navigate(['/gestion-citas', { gestion: 'modificacion' }]);
  }

  goToEliminarCita() {
    this.router.navigate(['/gestion-citas', { gestion: 'eliminacion' }]);
  }

  goToGestionDisponibilidad() {
    this.router.navigate(['/gestion-disponibilidad-medico']); 
  }

  // --- Utilidades ---
  
  async logout() {
    // Eliminar variables de sesión (localStorage)
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('rol_usuario');
    
    // Redireccionar al login
    this.router.navigate(['/login']);
  }
  
  // FUNCIÓN FALTANTE: Causa del error TS2339
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
