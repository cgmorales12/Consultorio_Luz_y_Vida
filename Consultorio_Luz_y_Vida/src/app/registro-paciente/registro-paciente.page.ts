import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-registro-paciente',
  templateUrl: './registro-paciente.page.html',
  styleUrls: ['./registro-paciente.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonicModule,
    CommonModule,
  ]
})
export class RegistroPacientePage implements OnInit {

  paciente = {
    cedula: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '', // Se usa con ion-datetime
    telefono: '',
    email: '',
    direccion: ''
  };

  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
  }

  // 🛠️ FUNCIÓN DE CORRECCIÓN AÑADIDA
  // Resuelve el error TS2339 y limita el calendario para que no permita fechas futuras.
  getMaxDate(): string {
    // Devuelve la fecha de hoy en formato YYYY-MM-DD
    return new Date().toISOString().split('T')[0];
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  onRegister() {
    this.isLoading = true;
    this.error = null;

    if (!this.paciente.fecha_nacimiento) {
      this.isLoading = false;
      this.error = 'La fecha de nacimiento es obligatoria.';
      this.presentToast(this.error, 'danger');
      return;
    }

    // El formato de la fecha de ion-datetime debe ser compatible con MySQL (YYYY-MM-DD)
    // Usamos .slice(0, 10) para obtener 'YYYY-MM-DD' del string ISO8601 completo.
    const fechaFormateada = this.paciente.fecha_nacimiento.slice(0, 10);
    const dataToSend = { ...this.paciente, fecha_nacimiento: fechaFormateada };

    // Llama al servicio para registrar el paciente
    this.authService.registerPatient(dataToSend).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.status === 'success') {
          this.presentToast('¡Registro exitoso! Ahora puedes agendar tu cita.');
          
          // Redirecciona a paciente registrado para que pueda tomar la cita
          this.router.navigate(['/agendar-cita', this.paciente.cedula]);
          
        } else {
          // Muestra el error del servidor (ej. cédula duplicada)
          this.error = res.message; 
          this.presentToast(`Error: ${res.message}`, 'danger');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error de conexión con el WS:', err);
        this.error = 'Error de conexión con el servidor. Verifique XAMPP y el Web Service.';
        this.presentToast(this.error, 'danger');
      }
    });
  }
}