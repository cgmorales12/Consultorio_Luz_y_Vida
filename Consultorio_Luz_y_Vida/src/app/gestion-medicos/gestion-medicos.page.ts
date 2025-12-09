import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-gestion-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './gestion-medicos.page.html',
  styleUrls: ['./gestion-medicos.page.scss'],
})
export class GestionMedicosPage implements OnInit {

  accion: string = ''; // Recibe 'crear', 'modificar', 'eliminar'
  pageTitle: string = '';

  // Modelo de datos para la Creación/Modificación
  medico = {
    id_medico: 0,
    id_usuario: 0,
    usuario: '',
    clave: '', // Solo se usa para crear o cambiar
    nombres: '',
    apellidos: '',
    especialidad: '',
    cedula_profesional: '',
    telefono: ''
  };

  listaMedicos: any[] = [];
  isLoading: boolean = false;
  message: string | null = null;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.accion = this.route.snapshot.paramMap.get('accion') || 'crear';
    this.setPageTitle(this.accion);

    // Cargar lista si la acción es de consulta/modificación/eliminación
    if (this.accion === 'modificar' || this.accion === 'eliminar' || this.accion === 'editar-form') {
      this.loadMedicosList();
    }
  }

  setPageTitle(accion: string) {
    switch(accion) {
      case 'crear':
        this.pageTitle = 'CREAR MÉDICOS';
        break;
      case 'modificar':
        this.pageTitle = 'Modificar médico existente';
        break;
      case 'editar-form': // Modo de edición
        this.pageTitle = 'Editar médico seleccionado';
        break;
      case 'eliminar':
        this.pageTitle = 'Eliminar médico';
        break;
      default:
        this.pageTitle = 'Gestión de médicos';
    }
  }

  // --- CRUD: Read (Consultar lista) ---
  loadMedicosList() {
    this.isLoading = true;
    this.message = 'Cargando lista de médicos...';
    this.error = false;

    this.authService.getMedicos().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success') {
          this.listaMedicos = res.data || [];
          this.message = res.data.length > 0 ? null : res.message;
        } else {
          this.message = res.message;
          this.error = true;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.message = 'Error de conexión con el servidor. No se pudo cargar la lista.';
        this.error = true;
        console.error('Error al cargar médicos:', err);
      }
    });
  }

  // --- CRUD: Create/Update (Envío del formulario) ---
  onSubmitMedico() {
    if (this.accion === 'crear') {
        this.createMedico();
    } else if (this.accion === 'editar-form') {
        this.updateMedico();
    }
  }

  // Lógica de Creación (Llama a create_medico.php)
  createMedico() {
    this.isLoading = true;
    this.message = 'Guardando médico...';
    this.error = false;

    this.authService.createMedico(this.medico).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success') {
          this.message = res.message;
          this.error = false;
          this.resetForm();
          this.presentToast('Médico creado exitosamente.', 'success');
          this.loadMedicosList();
        } else {
          this.message = res.message;
          this.error = true;
          this.presentToast(res.message, 'danger');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.message = 'Error de conexión con el servidor. Verifique XAMPP y el WS.';
        this.error = true;
        console.error('Error al crear médico:', err);
      }
    });
  }

  // Lógica de Actualización (Llama a update_medico.php)
  updateMedico() {
    this.isLoading = true;
    this.message = 'Actualizando médico...';
    this.error = false;

    const dataToSend = this.medico;

    this.authService.updateMedico(dataToSend).subscribe({
        next: (res: any) => {
            this.isLoading = false;
            if (res.status === 'success') {
                this.message = res.message;
                this.error = false;
                this.presentToast('Actualización exitosa.', 'success');
                this.accion = 'modificar';
                this.setPageTitle(this.accion);
                this.resetForm();
                this.loadMedicosList();
            } else {
                this.message = res.message;
                this.error = true;
                this.presentToast(res.message, 'danger');
            }
        },
        error: (err) => {
            this.isLoading = false;
            this.message = 'Error de conexión con el servidor. No se pudo actualizar.';
            this.error = true;
            console.error('Error al actualizar médico:', err);
        }
    });
  }

  // Carga los datos del médico seleccionado en el formulario
  onEdit(medico: any) {
    this.accion = 'editar-form';
    this.setPageTitle('editar-form'); // Actualiza el título

    // Mapear los datos al modelo 'medico'
    this.medico.id_medico = medico.id_medico;
    this.medico.id_usuario = medico.id_usuario;
    this.medico.usuario = medico.usuario;
    this.medico.nombres = medico.nombres;
    this.medico.apellidos = medico.apellidos;
    this.medico.especialidad = medico.especialidad;
    this.medico.cedula_profesional = medico.cedula_profesional;
    this.medico.telefono = medico.telefono;
    this.medico.clave = ''; // Deja la clave vacía por seguridad
  }

  cancelEdit() {
    this.resetForm();
    this.accion = 'modificar';
    this.setPageTitle(this.accion);
    this.message = null;
  }

  // --- CRUD: Delete (Eliminación) ---
  async onDelete(medico: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¡ALERTA! ¿Está seguro de eliminar permanentemente al Dr(a). ${medico.nombres} ${medico.apellidos}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: () => {
            this.deleteMedico(medico.id_medico, medico.id_usuario);
          }
        }
      ]
    });
    await alert.present();
  }

  deleteMedico(idMedico: number, idUsuario: number) {
    this.isLoading = true;
    this.message = 'Eliminando médico...';
    this.error = false;

    const data = {
        id_medico: idMedico,
        id_usuario: idUsuario
    };

    this.authService.deleteMedico(data).subscribe({
        next: (res: any) => {
            this.isLoading = false;
            if (res.status === 'success') {
                this.message = res.message;
                this.error = false;
                this.presentToast('Médico eliminado.', 'success');
                this.loadMedicosList(); // Recargar la lista
            } else {
                this.message = res.message;
                this.error = true;
                this.presentToast(res.message, 'danger');
            }
        },
        error: (err) => {
            this.isLoading = false;
            this.message = 'Error de conexión con el servidor.';
            this.error = true;
            console.error('Error al eliminar médico:', err);
        }
    });
  }

  // --- Utilidades ---

  resetForm() {
    this.medico = {
      id_medico: 0, id_usuario: 0, usuario: '', clave: '',
      nombres: '', apellidos: '', especialidad: '',
      cedula_profesional: '', telefono: ''
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
