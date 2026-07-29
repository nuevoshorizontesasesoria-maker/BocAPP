'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function ConfirmacionContenido() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || searchParams.get('token');
  
  const [reserva, setReserva] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  
  const [nombreComensal, setNombreComensal] = useState<string>('');
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState<string>('');
  const [entradaSeleccionada, setEntradaSeleccionada] = useState<string>('');
  
  const [estado, setEstado] = useState<string>('cargando');
  const [mensajeError, setMensajeError] = useState<string>('');

  useEffect(() => {
    if (!id) {
      setEstado('error');
      setMensajeError('Enlace de confirmación no válido.');
      return;
    }

    async function cargarDatos() {
      try {
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*, restaurants(name)')
          .eq('id', id)
          .single();

        if (resError || !resData) throw new Error('No se encontró la reserva.');
        setReserva(resData);

        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', resData.restaurant_id);

        if (menuError) throw new Error('Error al cargar la carta.');
        setMenuItems(menuData || []);

        setEstado('pendiente_eleccion');
      } catch (err: any) {
        setEstado('error');
        setMensajeError(err.message);
      }
    }

    cargarDatos();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreComensal.trim() || !bebidaSeleccionada || !entradaSeleccionada) {
      alert('Por favor, ingresa tu nombre y selecciona una bebida y una entrada.');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (updateError) throw updateError;

      const { error: preorderError } = await supabase
        .from('preorders')
        .insert([
          {
            reservation_id: id,
            menu_item_id: bebidaSeleccionada,
            guest_name: nombreComensal,
            quantity: 1
          },
          {
            reservation_id: id,
            menu_item_id: entradaSeleccionada,
            guest_name: nombreComensal,
            quantity: 1
          }
        ]);

      if (preorderError) throw preorderError;

      setEstado('exito');
    } catch (err: any) {
      alert(`Hubo un error al procesar tu selección: ${err.message}`);
    }
  };

  if (estado === 'cargando') {
    return <div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando tu reserva y menú...</div>;
  }

  if (estado === 'error') {
    return (
      <main style={{ maxWidth: '450px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Atención</h2>
        <p style={{ color: '#666' }}>{mensajeError}</p>
      </main>
    );
  }

  if (estado === 'exito') {
    return (
      <main style={{ maxWidth: '450px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#2e7d32', marginBottom: '1rem' }}>¡Todo Listo!</h2>
        <p style={{ color: '#444', lineHeight: '1.6' }}>
          Hemos confirmado tu asistencia, <strong>{nombreComensal}</strong>, y guardado tus elecciones de menú. ¡Te esperamos en <strong>{reserva?.restaurants?.name}</strong>!
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '550px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Confirma tu Asistencia</h2>
      <p style={{ color: '#666', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Estás respondiendo a la reserva a nombre de <strong>{reserva?.organizer_name}</strong> en <strong>{reserva?.restaurants?.name}</strong>.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
            Tu Nombre y Apellido:
          </label>
          <input
            type="text"
            value={nombreComensal}
            onChange={(e) => setNombreComensal(e.target.value)}
            required
            placeholder="Ej: Juan Pérez"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
            Elige tu Bebida:
          </label>
          <select
            value={bebidaSeleccionada}
            onChange={(e) => setBebidaSeleccionada(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff', boxSizing: 'border-box' }}
          >
            <option value="">-- Selecciona una bebida --</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} {item.price ? `- $${item.price}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
            Elige tu Entrada:
          </label>
          <select
            value={entradaSeleccionada}
            onChange={(e) => setEntradaSeleccionada(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff', boxSizing: 'border-box' }}
          >
            <option value="">-- Selecciona una entrada --</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} {item.price ? `- $${item.price}` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          style={{
            background: '#2e7d32',
            color: '#fff',
            padding: '0.85rem',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '1rem',
            transition: 'background 0.2s',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          Confirmar Asistencia y Menú
        </button>
      </form>
    </main>
  );
}

export default function ConfirmarReservaPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando...</div>}>
      <ConfirmacionContenido />
    </Suspense>
  );
}
