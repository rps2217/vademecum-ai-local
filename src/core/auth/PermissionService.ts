/**
 * Permission Service
 * 
 * Sistema de roles y permisos para la aplicación.
 * Define qué acciones puede realizar cada tipo de usuario.
 */

import type { UserRole } from '@/db/schema';
import { logger } from '@/lib/logger';

// ============================================
// PERMISOS
// ============================================

export type Permission =
  // Pacientes
  | 'patients.read'
  | 'patients.create'
  | 'patients.update'
  | 'patients.delete'
  | 'patients.allergies.manage'
  | 'patients.conditions.manage'
  | 'patients.medications.manage'
  // Consultas
  | 'consultations.read'
  | 'consultations.create'
  | 'consultations.update'
  | 'consultations.end'
  // Productos y recomendaciones
  | 'products.read'
  | 'recommendations.create'
  | 'recommendations.accept'
  | 'recommendations.reject'
  // Prescripciones
  | 'prescriptions.create'
  | 'prescriptions.read'
  // Base de conocimiento
  | 'kb.read'
  | 'kb.create'
  | 'kb.update'
  | 'kb.delete'
  | 'kb.approve'
  // Administración
  | 'admin.users.manage'
  | 'admin.roles.manage'
  | 'admin.backup.manage'
  | 'admin.settings.manage'
  // Auditoría
  | 'audit.read'
  // Sync
  | 'sync.manage';

// ============================================
// MAPA DE PERMISOS POR ROL
// ============================================

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin_farmacia: [
    'patients.read', 'patients.create', 'patients.update', 'patients.delete',
    'patients.allergies.manage', 'patients.conditions.manage', 'patients.medications.manage',
    'consultations.read', 'consultations.create', 'consultations.update', 'consultations.end',
    'products.read', 'recommendations.create', 'recommendations.accept', 'recommendations.reject',
    'prescriptions.create', 'prescriptions.read',
    'kb.read', 'kb.create', 'kb.update', 'kb.delete', 'kb.approve',
    'admin.users.manage', 'admin.roles.manage', 'admin.backup.manage', 'admin.settings.manage',
    'audit.read', 'sync.manage',
  ],

  farmaceutico: [
    'patients.read', 'patients.create', 'patients.update',
    'patients.allergies.manage', 'patients.conditions.manage', 'patients.medications.manage',
    'consultations.read', 'consultations.create', 'consultations.update', 'consultations.end',
    'products.read', 'recommendations.create', 'recommendations.accept', 'recommendations.reject',
    'prescriptions.create', 'prescriptions.read',
    'kb.read', 'sync.manage',
  ],

  asistente: [
    'patients.read', 'consultations.read', 'products.read', 'kb.read',
  ],

  readonly_auditor: [
    'patients.read', 'consultations.read', 'products.read', 'prescriptions.read', 'kb.read', 'audit.read',
  ],
};

// ============================================
// ROL INFO
// ============================================

export interface RoleInfo {
  id: UserRole;
  name: string;
  description: string;
  color: string;
}

const ROLE_INFO: Record<UserRole, RoleInfo> = {
  admin_farmacia: {
    id: 'admin_farmacia',
    name: 'Administrador de Farmacia',
    description: 'Acceso completo a todas las funcionalidades',
    color: 'red',
  },
  farmaceutico: {
    id: 'farmaceutico',
    name: 'Farmacéutico',
    description: 'Gestiona pacientes, consultas y recomendaciones. No puede modificar la KB ni administrar usuarios.',
    color: 'blue',
  },
  asistente: {
    id: 'asistente',
    name: 'Asistente',
    description: 'Solo puede consultar información. No puede crear ni modificar datos.',
    color: 'gray',
  },
  readonly_auditor: {
    id: 'readonly_auditor',
    name: 'Auditor',
    description: 'Acceso de solo lectura al sistema, incluyendo logs de auditoría.',
    color: 'yellow',
  },
};

// ============================================
// PERMISSION SERVICE
// ============================================

export class PermissionService {
  private static instance: PermissionService | null = null;
  private currentRole: UserRole = 'asistente';

  private constructor() {}

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  setCurrentRole(role: UserRole): void {
    this.currentRole = role;
    logger.log('[PermissionService] Rol establecido:', role);
  }

  getCurrentRole(): UserRole {
    return this.currentRole;
  }

  getRoleInfo(role: UserRole): RoleInfo {
    return ROLE_INFO[role];
  }

  getAllRoles(): RoleInfo[] {
    return Object.values(ROLE_INFO);
  }

  hasPermission(permission: Permission): boolean {
    return ROLE_PERMISSIONS[this.currentRole].includes(permission);
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  getCurrentPermissions(): Permission[] {
    return [...ROLE_PERMISSIONS[this.currentRole]];
  }

  getPermissionsForRole(role: UserRole): Permission[] {
    return [...ROLE_PERMISSIONS[role]];
  }

  can(action: string): boolean {
    const actionMap: Record<string, Permission[]> = {
      'patient.view': ['patients.read'],
      'patient.create': ['patients.create'],
      'patient.edit': ['patients.update'],
      'patient.delete': ['patients.delete'],
      'consultation.start': ['consultations.create'],
      'consultation.view': ['consultations.read'],
      'consultation.end': ['consultations.end'],
      'recommendation.add': ['recommendations.create'],
      'recommendation.accept': ['recommendations.accept'],
      'prescription.create': ['prescriptions.create'],
      'kb.view': ['kb.read'],
      'kb.edit': ['kb.update', 'kb.create'],
      'admin.users': ['admin.users.manage'],
      'admin.roles': ['admin.roles.manage'],
      'audit.view': ['audit.read'],
      'sync.trigger': ['sync.manage'],
    };

    const requiredPermissions = actionMap[action];
    if (!requiredPermissions) {
      logger.warn('[PermissionService] Acción desconocida:', action);
      return false;
    }

    return this.hasAnyPermission(requiredPermissions);
  }

  getAccessLevel(): 'none' | 'read' | 'write' | 'admin' {
    if (this.currentRole === 'readonly_auditor') return 'read';
    if (this.currentRole === 'asistente') return 'read';
    if (this.currentRole === 'farmaceutico') return 'write';
    if (this.currentRole === 'admin_farmacia') return 'admin';
    return 'none';
  }
}

export const permissionService = PermissionService.getInstance();

// ============================================
// HOOK PARA REACT
// ============================================

import { useCallback } from 'react';

/**
 * Hook para usar permisos en componentes React
 */
export function usePermissions() {
  const hasPermission = useCallback((permission: Permission): boolean => {
    return permissionService.hasPermission(permission);
  }, []);

  const hasAll = useCallback((permissions: Permission[]): boolean => {
    return permissionService.hasAllPermissions(permissions);
  }, []);

  const hasAny = useCallback((permissions: Permission[]): boolean => {
    return permissionService.hasAnyPermission(permissions);
  }, []);

  const can = useCallback((action: string): boolean => {
    return permissionService.can(action);
  }, []);

  return {
    role: permissionService.getCurrentRole(),
    roleInfo: permissionService.getRoleInfo(permissionService.getCurrentRole()),
    permissions: permissionService.getCurrentPermissions(),
    hasPermission,
    hasAll,
    hasAny,
    can,
    isAdmin: permissionService.getCurrentRole() === 'admin_farmacia',
    isPharmacist: permissionService.getCurrentRole() === 'farmaceutico',
    isReadOnly: permissionService.getCurrentRole() === 'readonly_auditor' || 
                permissionService.getCurrentRole() === 'asistente',
    accessLevel: permissionService.getAccessLevel(),
  };
}
