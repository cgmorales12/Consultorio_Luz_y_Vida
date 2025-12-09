import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { format } from 'date-fns';

@Component({
  selector: 'app-gestion-disponibilidad-medico',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './gestion-disponibilidad-medico.page.html',
  styleUrls: ['./gestion-disponibilidad-medico.page.scss'],
})
export class GestionDisponibilidadMedicoPage implements OnInit {
  
  idMedico: number | null = null;
  // minDate asegura que no se pueda seleccionar una fecha anterior a hoy
  minDate: string = format(new Date(), 'yyyy-MM-dd'); 

  // Modelo para la creación de nuevos bloques
  nuevaDisponibilidad = {
    id_medico: 0,
    fecha_dia: '',
    hora_inicio: '',
    hora_fin: ''
  };

  bloqueEnEdicion: any = null;
  modoFormulario: 'crear' | 'editar' = 'crear';

  disponibilidadExistente: any[] = [];
  
  isLoading: boolean = false; // Para la carga inicial
  isSaving: boolean = false; // Para las operaciones de Create/Delete
  message: string | null = null;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loadMedicoIdAndDisponibilidad();
  }

  // --- Lógica de Carga Inicial (Obtener ID del Médico) ---
  /**
   * Determina el ID del médico a gestionar (desde URL o Storage)
   * y luego llama a la función de consulta.
   */
  async loadMedicoIdAndDisponibilidad() {
    this.isLoading = true;
    
    // 1. Intentar obtener el ID desde la ruta (Modo Admin)
    const idParam = this.route.snapshot.paramMap.get('id_medico_admin');
    
    if (idParam) {
        this.idMedico = parseInt(idParam);
    } else {
        // 2. Obtener el ID desde la sesión (Modo Médico)
    const idValue = localStorage.getItem('id_usuario');
    if (idValue) {
        this.idMedico = parseInt(idValue);
        }
    }
    
    if (this.idMedico) {
        this.nuevaDisponibilidad.id_medico = this.idMedico;
        this.loadDisponibilidadExistente(); 
    } else {
        this.isLoading = false;
        this.message = 'Error: ID de médico no encontrado. Por favor, inicie sesión.';
        this.error = true;
    }
  }

  // --- Consulta de Disponibilidad (CRUD: Read) ---
  loadDisponibilidadExistente() {
    if (!this.idMedico) return;

    this.isLoading = true;
    this.message = 'Cargando horarios registrados...';
    this.error = false;

    this.authService.getDisponibilidadByMedico(this.idMedico).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success') {
          this.disponibilidadExistente = res.data || [];
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
        console.error('Error al cargar disponibilidad:', err);
      }
    });
  }

  // --- Creación de Disponibilidad (CRUD: Create) ---
  onSubmitDisponibilidad() {
    if (this.modoFormulario === 'editar') {
      this.onUpdateDisponibilidad();
      return;
    }

    if (!this.idMedico) return;

    this.isSaving = true;
    this.message = 'Registrando horario...';
    this.error = false;

    this.authService.createDisponibilidad(this.nuevaDisponibilidad).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.message = 'Bloque de horario creado.';
          this.error = false;
          this.presentToast(res.message, 'success');
          this.resetForm();
          this.loadDisponibilidadExistente(); // Recargar la lista
          this.message = null;
        } else {
          this.message = res.message;
          this.error = true;
          this.presentToast(res.message, 'danger');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.message = 'Error de conexión con el WS de creación.';
        this.error = true;
        console.error('Error al crear disponibilidad:', err);
      }
    });
  }

  // --- Actualización de Disponibilidad (CRUD: Update) ---
  onEditDisponibilidad(bloque: any) {
    this.bloqueEnEdicion = { ...bloque };
    this.modoFormulario = 'editar';
    this.nuevaDisponibilidad = {
      id_medico: this.idMedico || 0,
      fecha_dia: format(new Date(bloque.fecha_dia), 'yyyy-MM-dd'),
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
    };
    this.message = null;
    this.error = false;
  }

  onUpdateDisponibilidad() {
    if (!this.bloqueEnEdicion) return;

    this.isSaving = true;
    this.message = 'Actualizando horario...';
    this.error = false;

    const payload = {
      id_disponibilidad: this.bloqueEnEdicion.id_disponibilidad,
      ...this.nuevaDisponibilidad,
    };

    this.authService.updateDisponibilidad(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.presentToast(res.message, 'success');
          this.resetForm();
          this.loadDisponibilidadExistente();
          this.message = null;
        } else {
          this.message = res.message;
          this.error = true;
          this.presentToast(res.message, 'danger');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.message = 'Error de conexión con el WS de actualización.';
        this.error = true;
        console.error('Error al actualizar disponibilidad:', err);
      }
    });
  }
  
  // --- Eliminación de Disponibilidad (CRUD: Delete) ---
  async onDeleteDisponibilidad(idDisponibilidad: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `ADVERTENCIA: ¿Está seguro de eliminar este bloque de horario? Si hay citas confirmadas o pendientes, la eliminación fallará.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          cssClass: 'danger',
          handler: () => {
            this.executeDeleteDisponibilidad(idDisponibilidad);
          }
        }
      ]
    });
    await alert.present();
  }
  
  executeDeleteDisponibilidad(idDisponibilidad: number) {
    this.isSaving = true;
    this.message = 'Eliminando horario...';
    this.error = false;

    this.authService.deleteDisponibilidad(idDisponibilidad).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.presentToast(res.message, 'success');
          this.loadDisponibilidadExistente(); // Recargar la lista
          this.message = null;
        } else {
          this.message = res.message;
          this.error = true;
          this.presentToast(res.message, 'danger');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.message = 'Error de conexión con el WS de eliminación.';
        this.error = true;
        console.error('Error al eliminar disponibilidad:', err);
      }
    });
  }


  // --- Utilidades ---
  resetForm() {
    this.nuevaDisponibilidad.fecha_dia = '';
    this.nuevaDisponibilidad.hora_inicio = '';
    this.nuevaDisponibilidad.hora_fin = '';
    this.bloqueEnEdicion = null;
    this.modoFormulario = 'crear';
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
