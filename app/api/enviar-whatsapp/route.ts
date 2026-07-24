import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {

  try {

    const supabase = getSupabaseAdmin();

    const { reservation_id } = await request.json();

    if (!reservation_id) {
      return NextResponse.json(
        { error: "Falta reservation_id" },
        { status: 400 }
      );
    }

    // Obtener reserva

    const { data: reserva, error } = await supabase
      .from("reservations")
      .select(`
        *,
        restaurants(name)
      `)
      .eq("id", reservation_id)
      .single();

    if (error || !reserva) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    const dominio =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://tu-dominio.com";

    const enlace =
      `${dominio}/confirmar-reserva?id=${reserva.id}`;

    const mensaje =
`Hola ${reserva.organizer_name} 👋

Te recordamos tu reserva en ${reserva.restaurants?.name}

📅 ${reserva.reservation_date}
🕒 ${reserva.reservation_time}

Confirma aquí tu asistencia:

${enlace}`;

    // Aquí irá Twilio o Evolution API

    console.log(mensaje);

    await supabase
      .from("reservations")
      .update({
        status: "whatsapp_sent"
      })
      .eq("id", reservation_id);

    return NextResponse.json({
      success: true,
      message: "WhatsApp preparado correctamente"
    });

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );

  }

}