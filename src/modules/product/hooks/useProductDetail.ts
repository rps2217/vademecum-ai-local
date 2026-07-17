import { useState, useEffect } from 'react';
import { Product } from '../../../core/types';
import { historyService } from '../../../services/HistoryService';
import { dataService } from '../../../services/DataService';
import { geminiService } from '../../../services/GeminiService';
import { synergyBackgroundService } from '../../../services/SynergyBackgroundService';
import { logger } from '../../../services/LoggerService';
import { useAuth } from '../../../context/AuthContext';

export const useProductDetail = (initialProduct: Product, onUpdate?: (p: Product) => void) => {
  const { user, isAdmin } = useAuth();
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isForcingSynergy, setIsForcingSynergy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'info' | 'error' | 'success' } | null>(null);

  // Permisos basados en rol
  const canEdit = isAdmin || user !== null;
  const canVerify = isAdmin;

  useEffect(() => {
    if (product) {
      historyService.trackView(product);
    }
  }, [product.sku]);

  useEffect(() => {
    const handleDbUpdate = async () => {
      const updated = await dataService.getProductBySku(product.sku);
      if (updated) {
        setProduct(updated);
        if (onUpdate) onUpdate(updated);
      }
    };

    window.addEventListener('db_updated', handleDbUpdate);
    return () => window.removeEventListener('db_updated', handleDbUpdate);
  }, [product.sku, onUpdate]);

  const showStatus = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setIsSuccess(false);
    try {
      const updatedProduct = await geminiService.reanalyzeProduct(product);
      if (updatedProduct) {
        await dataService.saveProduct(updatedProduct);
        setProduct(updatedProduct);
        if (onUpdate) onUpdate(updatedProduct);
        setIsSuccess(true);
        showStatus('Producto reanalizado con éxito', 'success');
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        showStatus('No se pudo reanalizar el producto.', 'error');
      }
    } catch (error) {
      logger.error('Error reanalizando:', error);
      showStatus('Error al conectar con la IA.', 'error');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleForceSynergy = async () => {
    setIsForcingSynergy(true);
    logger.info('Análisis forzado', 'Sinergia', { sku: product.sku });
    try {
      const started = await synergyBackgroundService.forceAnalyze(product);
      if (!started) {
        showStatus('Motor ocupado.', 'info');
      } else {
        showStatus('Análisis iniciado...', 'success');
      }
    } catch (error) {
      logger.error('Error sinergia', error);
      showStatus('Error al iniciar análisis.', 'error');
    } finally {
      setIsForcingSynergy(false);
    }
  };

  const handleSaveEdit = async (updatedProduct: Product) => {
    try {
      await dataService.saveProduct(updatedProduct);
      setProduct(updatedProduct);
      if (onUpdate) onUpdate(updatedProduct);
      setIsEditing(false);
      showStatus('Cambios guardados', 'success');
      window.dispatchEvent(new CustomEvent('db_updated'));
    } catch (error) {
      logger.error('Error guardando:', error);
      showStatus('Error al guardar', 'error');
    }
  };

  const handleStartEdit = () => {
    if (!canEdit) {
      showStatus('Inicia sesión para editar productos', 'error');
      return;
    }
    setIsEditing(true);
  };

  const handleStartVerify = () => {
    if (!canVerify) {
      showStatus('Solo los administradores pueden verificar productos', 'error');
      return;
    }
    handleSaveEdit({
      ...product,
      is_verified: true,
      verified_at: Date.now(),
      verified_by: user?.email || 'Administrador'
    });
  };

  return {
    product,
    setProduct,
    isReanalyzing,
    isSuccess,
    isForcingSynergy,
    isEditing,
    setIsEditing,
    isVerifying,
    setIsVerifying,
    canEdit,
    canVerify,
    statusMessage,
    handleReanalyze,
    handleForceSynergy,
    handleSaveEdit,
    handleStartEdit,
    handleStartVerify,
    showStatus
  };
};
