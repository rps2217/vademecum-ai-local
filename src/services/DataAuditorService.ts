import { getDB } from '../core/database/db';
import { Product, SafetyStatus } from '../core/types/product.types';

export interface AuditIssue {
  sku: string;
  nombre: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  field: string;
}

export interface DatabaseHealthReport {
  score: number;
  totalProducts: number;
  verifiedProducts: number;
  issues: AuditIssue[];
  categoryDistribution: Record<string, number>;
  safetyCompleteness: number; // Porcentaje de productos con semáforo completo
}

export class DataAuditorService {
  static async generateReport(): Promise<DatabaseHealthReport> {
    const db = await getDB();
    const products = await db.getAll('products');
    const issues: AuditIssue[] = [];
    const categories: Record<string, number> = {};
    
    let verifiedCount = 0;
    let safetyCompleteCount = 0;

    products.forEach(p => {
      // Conteo de verificación
      if (p.is_verified) verifiedCount++;

      // Distribución de categorías
      const cat = p.categoria_principal || 'Sin Categoría';
      categories[cat] = (categories[cat] || 0) + 1;

      // Auditoría de campos críticos
      if (!p.advertencias || p.advertencias.length < 10) {
        issues.push({
          sku: p.sku,
          nombre: p.nombre_comercial,
          severity: 'critical',
          message: 'Faltan advertencias de seguridad o son muy breves.',
          field: 'advertencias'
        });
      }

      if (!p.posologia || p.posologia === 'No especificada') {
        issues.push({
          sku: p.sku,
          nombre: p.nombre_comercial,
          severity: 'warning',
          message: 'La posología no está detallada.',
          field: 'posologia'
        });
      }

      // Auditoría de Semáforo
      const safetyFields = [
        p.apto_embarazo, p.apto_lactancia, p.apto_pediatria, 
        p.apto_diabeticos, p.apto_hipertensos, p.apto_celiacos
      ];
      
      const isSafetyComplete = safetyFields.every(s => s !== undefined);
      if (isSafetyComplete) safetyCompleteCount++;
      else {
        issues.push({
          sku: p.sku,
          nombre: p.nombre_comercial,
          severity: 'critical',
          message: 'Semáforo de seguridad incompleto.',
          field: 'safety'
        });
      }

      if (!p.synergy_analyzed) {
        issues.push({
          sku: p.sku,
          nombre: p.nombre_comercial,
          severity: 'info',
          message: 'Sinergia clínica no analizada aún.',
          field: 'synergy'
        });
      }
    });

    // Cálculo de Score (0-100)
    // Penalizamos por issues críticos y falta de verificación
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const warningIssues = issues.filter(i => i.severity === 'warning').length;
    
    let score = 100;
    if (products.length > 0) {
      score -= (criticalIssues / products.length) * 50;
      score -= (warningIssues / products.length) * 20;
      score -= ((products.length - verifiedCount) / products.length) * 10;
    } else {
      score = 0;
    }

    return {
      score: Math.max(0, Math.round(score)),
      totalProducts: products.length,
      verifiedProducts: verifiedCount,
      issues: issues.slice(0, 100), // Limitamos a los primeros 100 para rendimiento
      categoryDistribution: categories,
      safetyCompleteness: products.length > 0 ? Math.round((safetyCompleteCount / products.length) * 100) : 0
    };
  }
}
