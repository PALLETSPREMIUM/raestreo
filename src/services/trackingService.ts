/**
 * Servicio de Rastreo de Paquetes
 * Conecta directamente con Google Sheets (Apps Script)
 */

import { TrackingResponse } from '../types/tracking';

/**
 * Buscar información de un paquete por número de rastreo
 * @param trackingNumber - Número de rastreo (ej: PP-12345)
 * @returns Promise con la información del paquete
 */
export const searchTracking = async (
  trackingNumber: string
): Promise<TrackingResponse> => {
  try {
    // URL del Web App de Google Apps Script o n8n Webhook
    const webhookUrl = (import.meta as any).env.VITE_API_URL || (import.meta as any).env.VITE_N8N_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzBWO0rYb1pqvHwEDdV8yhLkvtjJnmbMjNGWfNuxSHsvynjtdCosHtIKrjP4GVMd65KRA/exec';

    if (!webhookUrl) {
      return {
        success: false,
        error: 'Backend no configurado',
        message: 'No está configurada la VITE_API_URL en el archivo .env.local. Por favor sigue los pasos en GOOGLE_SHEET_BACKEND_SCRIPT.js',
      };
    }

    // Petición GET al Web App con fetch
    const targetUrl = `${webhookUrl}?trackingNumber=${encodeURIComponent(trackingNumber.trim().toUpperCase())}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow', // IMPORTANTE para Google Apps Script
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validar respuesta
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'No se encontró el número de rastreo',
        message: data.message || 'Verifica que el número esté correcto y exista en la Base de Datos.',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error al buscar rastreo:', error);

    return {
      success: false,
      error: 'Error de conexión',
      message: 'No se pudo conectar a la base de datos (Problema de CORS o Webhook caído). Revisa la configuración del Apps Script.',
    };
  }
};

/**
 * Buscar múltiples números de rastreo
 * @param trackingNumbers - Array de números de rastreo
 * @returns Promise con array de resultados
 */
export const searchMultipleTracking = async (
  trackingNumbers: string[]
): Promise<TrackingResponse[]> => {
  const promises = trackingNumbers.map((number) => searchTracking(number));
  return Promise.all(promises);
};

