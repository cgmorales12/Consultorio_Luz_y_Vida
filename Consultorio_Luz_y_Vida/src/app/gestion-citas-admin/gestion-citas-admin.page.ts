import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { format } from 'date-fns'; // Necesario para formatear fechas

@Component({
  selector: 'app-gestion-citas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './gestion-citas-admin.page.html',
  styleUrls: ['./gestion-citas-admin.page.scss'],
})
export class GestionCitasAdminPage implements OnInit {
  
  listaCitas: any[] = [];
  estadosCita: any[] = []; // Para llenar el selector de estado
  listaMedicos: any[] = []; // Para llenar el selector de médico

  nuevaCita = {
    cedula_paciente: '',
    id_medico: null as number | null,
    fecha_cita: '',
    hora_cita: '',
    motivo: '',
  };

  // Modelo para la edición (se llena al hacer click en 'Editar')
  citaEnEdicion: any = null;
  
  isLoading: boolean = false;
  message: string | null = null;
  error: boolean = false;
  isSaving: boolean = false;
  isCreating: boolean = false;

  constructor(
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadCitasList();
    this.loadMetadata(); // Cargar estados de cita y lista de médicos
  }
  
  // --- Carga de Metadatos (FALTA CREAR WS get_metadata.php) ---
  loadMetadata() {
    // Por simplicidad, simularemos los datos que vendrían de un WS (get_metadata.php)
    this.estadosCita = [
      { id: 1, nombre: 'Pendiente de aprobación' },
      { id: 2, nombre: 'Cita confirmada' },
      { id: 3, nombre: 'Cita rechazada' },
      { id: 4, nombre: 'Cita modificada Confirmada' },
      { id: 5, nombre: 'Cita modificada Rechazada' }
    ];
    this.loadMedicosList();
  }

  loadMedicosList() {
    this.authService.getMedicos().subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.listaMedicos = res.data || [];
        }
      },
      error: (err) => {
        console.error('Error al cargar médicos:', err);
      }
    });
  }

  // --- Consulta de Citas (CRUD: Read) ---
  loadCitasList() {
    this.isLoading = true;
    this.message = 'Cargando lista de citas...';
    this.error = false;

    this.authService.getAllCitas().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success') {
          this.listaCitas = res.data || [];
          this.message = res.data.length > 0 ? null : res.message;
        } else {
          this.message = res.message; 
          this.error = true;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.message = 'Error de conexión con el servidor.';
        this.error = true;
        console.error('Error al cargar citas:', err);
      }
    });
  }

  // --- Edición de Cita (CRUD: Update) ---
  onEdit(cita: any) {
    // 1. Mostrar el formulario de edición.
    // 2. Mapear los datos de la cita seleccionada al modelo de edición.
    this.citaEnEdicion = {
      id_cita: cita.id_cita,
      id_paciente: cita.id_paciente, // Necesario si se necesita actualizar el paciente
      id_medico: cita.id_medico,
      id_estado: cita.id_estado,
      fecha_cita: format(new Date(cita.fecha_cita), 'yyyy-MM-dd'), // Formato para ion-datetime
      hora_cita: cita.hora_cita,
      motivo: cita.motivo
    };
    this.message = null;
    this.error = false;
  }

  // --- Creación de Cita (CRUD: Create) ---
  onCreateCita() {
    this.isCreating = true;
    this.message = 'Creando cita...';
    this.error = false;

    this.authService.agendarCita(this.nuevaCita).subscribe({
      next: (res: any) => {
        this.isCreating = false;
        if (res.status === 'success') {
          this.presentToast(res.message, 'success');
          this.resetNuevaCita();
          this.loadCitasList();
          this.message = null;
        } else {
          this.message = res.message;
          this.error = true;
          this.presentToast(res.message, 'danger');
        }
      },
      error: (err) => {
        this.isCreating = false;
        this.message = 'Error de conexión con el servidor al crear la cita.';
        this.error = true;
        console.error('Error al crear cita:', err);
      }
    });
  }
  
  onUpdateCita() {
    this.isSaving = true;
    this.message = 'Guardando cambios...';
    this.error = false;

    // Enviar solo los campos necesarios (id_cita es obligatorio)
    this.authService.updateCitaAdmin(this.citaEnEdicion).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.presentToast(res.message, 'success');
          this.citaEnEdicion = null; // Cierra el formulario
          this.loadCitasList(); // Recarga la lista para ver los cambios
          this.message = null;
        } else {
          this.presentToast(res.message, 'danger');
          this.error = true;
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.message = 'Error de conexión con el servidor.';
        this.error = true;
        console.error('Error al actualizar cita:', err);
      }
    });
  }

  // --- Eliminación de Cita (CRUD: Delete) ---
  // ... (La función onDelete y deleteCita se mantienen iguales)
  async onDelete(cita: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar la cita del paciente ${cita.paciente_nombres} (${cita.fecha_cita} - ${cita.hora_cita})?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          cssClass: 'danger',
          handler: () => {
            this.deleteCita(cita.id_cita);
          }
        }
      ]
    });
    await alert.present();
  }
  
  deleteCita(idCita: number) {
    this.isLoading = true;
    this.message = 'Eliminando cita...';
    this.error = false;

    this.authService.deleteCita(idCita).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success') {
          this.presentToast(res.message, 'success');
          this.loadCitasList(); // Recargar la lista
          this.message = null;
        } else {
          this.presentToast(res.message, 'danger');
          this.error = true;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.message = 'Error de conexión con el servidor.';
        this.error = true;
        console.error('Error al eliminar cita:', err);
      }
    });
  }


  // --- Utilidades ---
  resetNuevaCita() {
    this.nuevaCita = {
      cedula_paciente: '',
      id_medico: null,
      fecha_cita: '',
      hora_cita: '',
      motivo: '',
    };
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
