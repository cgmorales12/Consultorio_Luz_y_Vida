import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-gestion-login-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './gestion-login-usuarios.page.html',
  styleUrls: ['./gestion-login-usuarios.page.scss'],
})
export class GestionLoginUsuariosPage implements OnInit {
  
  listaUsuarios: any[] = [];
  accion: string = 'modificar'; 
  
  // Modelo para la creación de usuario de Sistema
  nuevoUsuario = {
    usuario: '',
    clave: ''
  };
  
  // Modelo para la edición de usuario 
  usuarioEnEdicion: any = null; 
  
  isLoading: boolean = false; 
  isSaving: boolean = false;  
  message: string | null = null;
  error: boolean = false;

  constructor(
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loadUsuariosList();
  }
  
  // =================================================================
  // --- CONSULTA (READ) ---
  // =================================================================
  loadUsuariosList() {
    this.isLoading = true;
    this.message = 'Cargando lista de usuarios...';
    this.error = false;

    this.authService.getAllUsuarios().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        if (res.status === 'success') {
          this.listaUsuarios = res.data || [];
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
        console.error('Error al cargar usuarios:', err);
      }
    });
  }

  // =================================================================
  // --- CREACIÓN (CREATE) ---
  // =================================================================
  onCreateSistemaUser() {
    if (this.accion !== 'crear') return;
    
    this.isSaving = true;
    this.message = 'Creando usuario...';
    this.error = false;

    this.authService.createSistemaUser(this.nuevoUsuario).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.message = res.message;
          this.error = false;
          this.presentToast('Usuario creado.', 'success');
          this.resetNuevoUsuario();
          this.loadUsuariosList();
        } else {
          this.message = res.message;
          this.error = true;
          this.presentToast(res.message, 'danger');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.message = 'Error de conexión con el servidor.';
        this.error = true;
        console.error('Error al crear usuario:', err);
      }
    });
  }


  // =================================================================
  // --- MODIFICACIÓN (UPDATE) ---
  // =================================================================
  
  onEdit(usuario: any) {
    this.usuarioEnEdicion = {
      id_usuario: usuario.id_usuario,
      usuario: usuario.usuario,
      clave: '', 
      nombre_rol: usuario.nombre_rol
    };
    this.accion = 'editar-form'; 
    this.message = null;
    this.error = false;
  }
  
  onUpdateUsuario() {
    this.isSaving = true;
    this.message = 'Actualizando usuario...';
    this.error = false;

    this.authService.updateUsuario(this.usuarioEnEdicion).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.presentToast(res.message, 'success');
          this.usuarioEnEdicion = null; 
          this.accion = 'modificar';
          this.loadUsuariosList(); 
        } else {
          this.presentToast(res.message, 'danger');
          this.error = true;
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.message = 'Error de conexión con el servidor.';
        this.error = true;
        console.error('Error al actualizar usuario:', err);
      }
    });
  }


  // =================================================================
  // --- ELIMINACIÓN (DELETE) ---
  // =================================================================
  async onDelete(usuario: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `ADVERTENCIA: ¿Está seguro de eliminar al usuario **${usuario.usuario}** (${usuario.nombre_rol})? Esto impedirá su acceso.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          cssClass: 'danger',
          handler: () => {
            this.executeDeleteUsuario(usuario.id_usuario);
          }
        }
      ]
    });
    await alert.present();
  }

  executeDeleteUsuario(idUsuario: number) {
    this.isSaving = true;
    this.message = 'Eliminando usuario...';
    this.error = false;

    this.authService.deleteUsuario(idUsuario).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.presentToast(res.message, 'success');
          this.loadUsuariosList(); 
        } else {
          this.message = res.message; 
          this.error = true;
          this.presentToast(res.message, 'danger');
        }
      },
      error: (err) => {
        this.isSaving = false;
        // La línea que causaba el error fue corregida aquí:
        this.message = 'Error de conexión con el servidor.'; 
        this.error = true;
        console.error('Error al eliminar usuario:', err);
      }
    });
  }
  
  // =================================================================
  // --- UTILIDADES (Función presentToast agregada) ---
  // =================================================================
  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
  
  /**
   * Cambia la acción y recarga la lista si no es la acción 'crear'.
   */
  onSelectAction(newAccion: string) {
    this.accion = newAccion;
    if (newAccion !== 'crear') {
      this.loadUsuariosList();
    } else {
      this.resetNuevoUsuario();
    }
    this.message = null;
    this.error = false;
    this.usuarioEnEdicion = null; // Limpiar el modelo de edición
  }

  resetNuevoUsuario() {
    this.nuevoUsuario = { usuario: '', clave: '' };
  }
}
