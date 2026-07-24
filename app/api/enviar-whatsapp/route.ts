import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase usando Service Role para operaciones seguras del servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { reservation_id } = await request.json();

    if (!reservation_id) {
      return NextResponse.json({ error: 'Falta el reservation_id' }, { status: 400 });
    }

    // 1. Obtener la reserva y el restaurante
    const { data: reserva, error: resError } = await supabase
      .from('reservations')
      .select('*, restaurants(name)')
      .eq('id', reservation_id)
      .single();

    if (resError || !reserva) {
      throw new Error('Reserva no encontrada');
    }

    // 2. Construir el enlace de confirmación
    // (Usa tu dominio real de producción en Hostinger, ej: https://tu-dominio.com)
    const dominioApp = process.env.NEXT_PUBLIC_SITE_URL || 'https://tu-dominio.com';
    const enlaceConfirmacion = `${dominioApp}/confirmar-reserva?id=${reserva.id}`;

    // 3. Redactar el mensaje
    const mensaje = `¡Hola *${reserva.organizer_name}*! 🍷 Te recordamos tu reserva en *${reserva.restaurants?.name}* para el ${reserva.reservation_date} a las ${reserva.reservation_time}. Haz clic aquí para confirmar tu asistencia y elegir tu menú: ${enlaceConfirmacion}`;

    // 4. Enviar a tu proveedor de WhatsApp (Evolution API, Twilio, etc.)
    /*
    const responseWhatsApp = await fetch(process.env.WHATSAPP_API_URL || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
      },
      body: JSON.stringify({
        phone: reserva.organizer_phone,
        message: mensaje
      })
    });

    if (!responseWhatsApp.ok) throw new Error('Falló el envío de WhatsApp');
    */

    // 5. Actualizar el estado de la reserva
    await supabase
      .from('reservations')
      .update({ status: 'whatsapp_sent' })
      .eq('id', reservation_id);

    return NextResponse.json({ success: true, message: 'Recordatorio enviado con éxito' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
