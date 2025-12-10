import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // =================================================================
  // --- URLs de Web Services PHP ---
  // =================================================================

  /**
   * Punto único de configuración para los endpoints PHP.
   * En desarrollo usamos el proxy (phpBaseUrl = '/php-api').
   */
  private readonly phpBaseUrl = environment.phpBaseUrl || 'http://localhost/consultorio';

  private buildUrl(path: string): string {
    // Evita dobles barras y mantiene compatibilidad con el proxy local.
    return `${this.phpBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }

  // 1. MÓDULO PACIENTES/LOGIN
  // Nota: el backend de login se expone como n.php en XAMPP
  private loginUrl = this.buildUrl('/login.php');
  private registerUrl = this.buildUrl('/registro_paciente.php'); // CREATE Paciente

  // 2. GESTIÓN DE CITAS Y DISPONIBILIDAD (Base de Operaciones)
  private getDisponibilidadUrl = this.buildUrl('/get_disponibilidad.php'); // READ Disponibilidad para Paciente
  private insertCitaUrl = this.buildUrl('/insert_cita.php'); // CREATE Cita
  private getCitasMedicoUrl = this.buildUrl('/get_citas_medico.php'); // READ Citas Pendientes (Médico)
  private updateCitaUrl = this.buildUrl('/update_cita_estado.php'); // UPDATE Estado de Cita (Médico)

  // 3. SISTEMA: CRUD DE CITAS ADMINISTRATIVO
  private getAllCitasUrl = this.buildUrl('/get_all_citas.php'); // READ Todas las Citas
  private updateCitaAdminUrl = this.buildUrl('/update_cita_admin.php'); // UPDATE Completo de Cita (Admin)
  private deleteCitaUrl = this.buildUrl('/delete_cita.php'); // DELETE Cita

  // 4. SISTEMA: GESTIÓN DE DISPONIBILIDAD
  private createDisponibilidadUrl = this.buildUrl('/create_disponibilidad.php'); // CREATE Disponibilidad
  private getDisponibilidadMedicoUrl = this.buildUrl('/get_disponibilidad_medico.php'); // READ Bloques de Disponibilidad
  private updateDisponibilidadUrl = this.buildUrl('/update_disponibilidad.php'); // UPDATE Disponibilidad
  private deleteDisponibilidadUrl = this.buildUrl('/delete_disponibilidad.php'); // DELETE Disponibilidad

  // 5. SISTEMA: GESTIÓN DE USUARIOS Y MÉDICOS (CRUD Administrativo)
  private getStatsUrl = this.buildUrl('/get_stats.php'); // READ Estadísticas

  // CRUD de Médicos
  private getMedicosUrl = this.buildUrl('/get_medicos.php'); // READ Médicos
  private createMedicoUrl = this.buildUrl('/create_medico.php'); // CREATE Médico
  private updateMedicoUrl = this.buildUrl('/update_medico.php'); // UPDATE Médico
  private deleteMedicoUrl = this.buildUrl('/delete_medico.php'); // DELETE Médico

  // CRUD de Usuarios de Acceso (Login)
  private getAllUsuariosUrl = this.buildUrl('/get_all_usuarios.php'); // READ Usuarios
  private createSistemaUserUrl = this.buildUrl('/create_sistema_user.php'); // CREATE Usuario Sistema
  private updateUsuarioUrl = this.buildUrl('/update_usuario.php'); // UPDATE Usuario
  private deleteUsuarioUrl = this.buildUrl('/delete_usuario.php'); // DELETE Usuario


  // Opciones HTTP
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  // =================================================================
  // --- MÓDULO 1: AUTENTICACIÓN Y PACIENTES ---
  // =================================================================
  login(credenciales: any): Observable<any> {
    return this.http.post(this.loginUrl, credenciales, this.httpOptions);
  }

  registerPatient(pacienteData: any): Observable<any> {
    return this.http.post(this.registerUrl, pacienteData, this.httpOptions);
  }

  // =================================================================
  // --- MÓDULO 2: GESTIÓN DE CITAS Y DISPONIBILIDAD (PACIENTE Y MÉDICO) ---
  // =================================================================
  getDisponibilidad(fecha: string, id_medico?: number | null): Observable<any> {
    const params = new URLSearchParams({ fecha });
    if (id_medico) {
      params.append('id_medico', String(id_medico));
    }
    return this.http.get(`${this.getDisponibilidadUrl}?${params.toString()}`);
  }

  agendarCita(citaData: any): Observable<any> {
    return this.http.post(this.insertCitaUrl, citaData, this.httpOptions);
  }
  
  getCitasPendientes(id_medico: number): Observable<any> {
    return this.http.post(this.getCitasMedicoUrl, { id_medico: id_medico }, this.httpOptions);
  }
  
  updateCitaEstado(data: { id_cita: number, id_estado: number }): Observable<any> {
    return this.http.post(this.updateCitaUrl, data, this.httpOptions);
  }
  
  // =================================================================
  // --- MÓDULO 3: SISTEMA (GESTIÓN ADMINISTRATIVA) ---
  // =================================================================
  
  // CONSULTAS GENERALES
  getSystemStats(): Observable<any> {
    return this.http.get(this.getStatsUrl);
  }
  
  // GESTIÓN DE CITAS ADMINISTRATIVA
  getAllCitas(): Observable<any> {
    return this.http.get(this.getAllCitasUrl);
  }
  
  updateCitaAdmin(citaData: any): Observable<any> {
    return this.http.post(this.updateCitaAdminUrl, citaData, this.httpOptions);
  }
  
  deleteCita(id_cita: number): Observable<any> {
    return this.http.post(this.deleteCitaUrl, { id_cita: id_cita }, this.httpOptions);
  }

  // GESTIÓN DE DISPONIBILIDAD
  createDisponibilidad(dispData: any): Observable<any> {
    return this.http.post(this.createDisponibilidadUrl, dispData, this.httpOptions);
  }

  getDisponibilidadByMedico(id_medico: number): Observable<any> {
    return this.http.post(this.getDisponibilidadMedicoUrl, { id_medico: id_medico }, this.httpOptions);
  }

  updateDisponibilidad(disponibilidadData: any): Observable<any> {
    return this.http.post(this.updateDisponibilidadUrl, disponibilidadData, this.httpOptions);
  }

  deleteDisponibilidad(id_disponibilidad: number): Observable<any> {
    return this.http.post(this.deleteDisponibilidadUrl, { id_disponibilidad: id_disponibilidad }, this.httpOptions);
  }
  
  // GESTIÓN DE MÉDICOS
  getMedicos(): Observable<any> {
    return this.http.get(this.getMedicosUrl);
  }
  
  createMedico(medicoData: any): Observable<any> {
    return this.http.post(this.createMedicoUrl, medicoData, this.httpOptions);
  }
  
  updateMedico(medicoData: any): Observable<any> {
    return this.http.post(this.updateMedicoUrl, medicoData, this.httpOptions);
  }
  
  deleteMedico(data: { id_medico: number, id_usuario: number }): Observable<any> {
    return this.http.post(this.deleteMedicoUrl, data, this.httpOptions);
  }
  
  // GESTIÓN DE USUARIOS DE ACCESO
  getAllUsuarios(): Observable<any> {
    return this.http.get(this.getAllUsuariosUrl);
  }
  
  createSistemaUser(credenciales: any): Observable<any> {
    return this.http.post(this.createSistemaUserUrl, credenciales, this.httpOptions);
  }
  
  updateUsuario(userData: any): Observable<any> {
    return this.http.post(this.updateUsuarioUrl, userData, this.httpOptions);
  }
  
  deleteUsuario(id_usuario: number): Observable<any> {
    return this.http.post(this.deleteUsuarioUrl, { id_usuario: id_usuario }, this.httpOptions);
  }
}
