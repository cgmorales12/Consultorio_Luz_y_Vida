import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface MedicoDisponible {
  nombre: string;
  especialidad: string;
  horario: string;
  disponible: boolean;
  genero: 'M' | 'F';
}

interface CitaReciente {
  paciente: string;
  estado: string;
  detalle: string;
  color: string;
  icono: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  medicosDisponibles: MedicoDisponible[] = [
    {
      nombre: 'Sofía Almeida',
      especialidad: 'Medicina General',
      horario: 'Sáb 08:00 - 12:00',
      disponible: true,
      genero: 'F',
    },
    {
      nombre: 'Mateo Viteri',
      especialidad: 'Pediatría',
      horario: 'Sáb 12:00 - Dom 08:00',
      disponible: true,
      genero: 'M',
    },
    {
      nombre: 'Camila Roldán',
      especialidad: 'Cardiología',
      horario: 'Dom 08:00 - 16:00',
      disponible: false,
      genero: 'F',
    },
  ];

  citasRecientes: CitaReciente[] = [
    {
      paciente: 'Juan Pérez',
      estado: 'Cita confirmada',
      detalle: 'Aprobada por médico disponible',
      color: 'success',
      icono: 'checkmark-circle-outline',
    },
    {
      paciente: 'María López',
      estado: 'Cita modificada',
      detalle: 'Horario actualizado con confirmación',
      color: 'warning',
      icono: 'refresh-circle-outline',
    },
    {
      paciente: 'Carlos García',
      estado: 'Cita rechazada',
      detalle: 'Horario no disponible, reagendar',
      color: 'danger',
      icono: 'close-circle-outline',
    },
  ];

  constructor(private router: Router) { }

  ngOnInit() {
    // Lógica de inicialización
  }

  /**
   * Navega a la página de Registro de Pacientes.
   */
  goToRegistro() {
    this.router.navigate(['/registro-paciente']);
  }

  /**
   * Navega a la página de Agendar Cita.
   */
  goToAgendarCita() {
    this.router.navigate(['/agendar-cita']);
  }

  /**
   * Navega a la pantalla de login de personal.
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
