import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './agendar-cita.page.html',
  styleUrls: ['./agendar-cita.page.scss'],
})
export class AgendarCitaPage implements OnInit {
  // Modelo para agendar la cita
  cita = {
    cedula_paciente: '', // Se usa si viene de la ruta
    id_medico: null as number | null,
    fecha_cita: '',
    hora_cita: '',
    motivo: '',
  };

  medicos: any[] = []; // Lista de médicos disponibles para el select
  disponibilidad: any[] = []; // Bloques de horas disponibles (ej: 09:00, 10:00)
  disponibilidadDias: Set<string> = new Set();
  calendarioDias: {
    date: Date;
    iso: string;
    label: number;
    inMonth: boolean;
    status: 'available' | 'unavailable' | 'past';
  }[] = [];
  semanasCalendario: {
    date: Date;
    iso: string;
    label: number;
    inMonth: boolean;
    status: 'available' | 'unavailable' | 'past';
  }[][] = [];
  mesActual: Date = startOfMonth(new Date());
  selectedDate: string | null = null;

  isLoading = false;
  isSaving = false;
  message: string | null = null;
  error: string | null = null;
  today: Date = new Date();

  get mesActualLabel(): string {
    return format(this.mesActual, 'LLLL yyyy');
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute, // Para obtener la cédula si viene de la página de registro
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.checkCedulaFromRoute();
    this.loadMedicosList();
    this.actualizarCalendario();
  }

  // =================================================================
  // --- CARGA INICIAL ---
  // =================================================================

  /**
   * Revisa si se recibió la cédula del paciente desde la ruta
   * (Esto ocurre si el paciente acaba de registrarse).
   */
  checkCedulaFromRoute() {
    this.route.paramMap.subscribe((params) => {
      const cedula = params.get('cedula');
      if (cedula) {
        this.cita.cedula_paciente = cedula;
        this.presentToast('Cédula de paciente registrada automáticamente.', 'success');
      }
    });
  }

  /**
   * Carga la lista de médicos para que el paciente pueda seleccionar uno.
   */
  loadMedicosList() {
    this.isLoading = true;
    this.authService.getMedicos().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success') {
          this.medicos = res.data || [];
        } else {
          this.presentToast('No se pudo cargar la lista de médicos.', 'danger');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar médicos:', err);
        this.presentToast('Error de conexión al cargar la lista de médicos.', 'danger');
      },
    });
  }

  onMedicoChange() {
    this.cita.fecha_cita = '';
    this.cita.hora_cita = '';
    this.selectedDate = null;
    this.disponibilidad = [];
    this.cargarDisponibilidadMedico();
  }

  // =================================================================
  // --- LÓGICA DE DISPONIBILIDAD ---
  // =================================================================

  /**
   * Se ejecuta cuando el paciente selecciona una fecha en el ion-datetime.
   */
  onSeleccionFecha(day: { iso: string; status: string }) {
    if (day.status !== 'available') {
      this.presentToast('Seleccione una fecha habilitada en verde.', 'warning');
      return;
    }

    this.disponibilidad = [];
    this.cita.hora_cita = '';
    this.cita.fecha_cita = day.iso;
    this.selectedDate = day.iso;
    this.loadHorasDisponibles(this.cita.fecha_cita);
  }

  /**
   * Llama al Web Service para obtener las horas que no están reservadas
   * para la fecha seleccionada.
   */
  loadHorasDisponibles(fecha: string) {
    this.isLoading = true;
    this.authService.getDisponibilidad(fecha, this.cita.id_medico ?? undefined).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success') {
          // La respuesta debe ser un arreglo de horas (ej: ["09:00", "10:00"])
          this.disponibilidad = res.data || [];
        } else {
          this.message = res.message;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar horas:', err);
        this.presentToast('Error de conexión con el servidor de disponibilidad.', 'danger');
      },
    });
  }

  cargarDisponibilidadMedico() {
    if (!this.cita.id_medico) {
      this.disponibilidadDias = new Set();
      this.actualizarCalendario();
      return;
    }

    this.isLoading = true;
    this.authService.getDisponibilidadByMedico(this.cita.id_medico).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'success') {
          const dias = (res.data || []).map((bloque: any) =>
            format(new Date(bloque.fecha_dia), 'yyyy-MM-dd')
          );
          this.disponibilidadDias = new Set(dias);
        } else {
          this.disponibilidadDias = new Set();
          this.presentToast(res.message || 'No se pudo cargar la disponibilidad del médico.', 'warning');
        }
        this.actualizarCalendario();
      },
      error: (err) => {
        this.isLoading = false;
        this.disponibilidadDias = new Set();
        console.error('Error al cargar disponibilidad del médico:', err);
        this.presentToast('Error al consultar la disponibilidad del médico.', 'danger');
        this.actualizarCalendario();
      },
    });
  }

  moverMes(delta: number) {
    this.mesActual = startOfMonth(addMonths(this.mesActual, delta));
    this.actualizarCalendario();
  }

  actualizarCalendario() {
    const inicioMes = startOfMonth(this.mesActual);
    const finMes = endOfMonth(this.mesActual);
    const inicioVista = startOfWeek(inicioMes, { weekStartsOn: 1 });
    const finVista = endOfWeek(finMes, { weekStartsOn: 1 });

    const dias: {
      date: Date;
      iso: string;
      label: number;
      inMonth: boolean;
      status: 'available' | 'unavailable' | 'past';
    }[] = [];

    let cursor = inicioVista;
    const hoy = format(new Date(), 'yyyy-MM-dd');

    while (isBefore(cursor, addDays(finVista, 1))) {
      const iso = format(cursor, 'yyyy-MM-dd');
      const inMonth = cursor.getMonth() === inicioMes.getMonth();
      const status: 'available' | 'unavailable' | 'past' = isBefore(cursor, new Date(hoy))
        ? 'past'
        : this.disponibilidadDias.has(iso)
        ? 'available'
        : 'unavailable';

      dias.push({
        date: cursor,
        iso,
        label: cursor.getDate(),
        inMonth,
        status,
      });

      cursor = addDays(cursor, 1);
    }

    this.calendarioDias = dias;
    this.semanasCalendario = [];
    for (let i = 0; i < dias.length; i += 7) {
      this.semanasCalendario.push(dias.slice(i, i + 7));
    }
  }

  // =================================================================
  // --- FUNCIÓN DE AGENDAR CITA (CREATE) ---
  // =================================================================

  onAgendarCita() {
    this.isSaving = true;
    this.error = null;

    // 1. Validaciones mínimas (ya hechas por el HTML, pero por seguridad)
    if (!this.cita.cedula_paciente || !this.cita.id_medico || !this.cita.fecha_cita || !this.cita.hora_cita) {
      this.error = 'Por favor, complete todos los campos obligatorios (*).';
      this.isSaving = false;
      return;
    }

    // 2. Envío de datos al Web Service
    this.authService.agendarCita(this.cita).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.presentToast('Cita agendada con éxito. Será revisada por el médico.', 'success');
          // Redirigir al inicio o a una página de confirmación
          this.router.navigate(['/home']);
        } else {
          const errorMsg = res.message || 'Error al agendar la cita.';
          this.error = errorMsg;
          this.presentToast(errorMsg, 'danger');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error al agendar cita:', err);
        const errorMsg = 'Error de conexión con el servidor. No se pudo agendar.';
        this.error = errorMsg;
        this.presentToast(errorMsg, 'danger');
      },
    });
  }

  // =================================================================
  // --- UTILIDADES ---
  // =================================================================

  async presentToast(message: string | null, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message ?? '',
      duration: 3000,
      color: color,
      position: 'top',
    });
    toast.present();
  }
}
