'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface MesaTemporal {
  name: string;
  capacidad_minima: number;
  capacidad_maxima: number;
}

export default function NuevoRestauranteTodoJuntoPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Asegurar que solo se renderiza en el cliente (evita errores de hidratación y extensiones)
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    type: 'restaurante',
    cubiertos_totales: 50,
    minutos_rotacion: 90,
    margen_tolerancia: 15,
    hora_apertura: '13:00',
    hora_cierre: '23:30',
  });

  const [mesas, setMesas] = useState<MesaTemporal[]>([]);
  const [nombreMesa, setNombreMesa] = useState('');
  const [capMin, setCapMin] = useState(1);
  const [capMax, setCapMax] = useState(4);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const agregarMesaALaLista = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreMesa.trim()) return;

    setMesas([
      ...mesas,
      { name: nombreMesa, capacidad_minima: capMin, capacidad_maxima: capMax }
    ]);
    
    setNombreMesa('');
    setCapMin(1);
    setCapMax(4);
  };

  const eliminarMesa = (index: number) => {
    setMesas(mesas.filter((_, i) => i !== index));
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mesas.length === 0) {
      setMensaje('Error: Debes agregar al menos una mesa física para controlar el aforo.');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const { data: newRest, error: restError } = await supabase
        .from('restaurants')
        .insert([
          {
            name: formData.name,
            city: formData.city,
            type: formData.type,
            cubiertos_totales: parseInt(String(formData.cubiertos_totales)),
            minutos_rotacion: parseInt(String(formData.minutos_rotacion)),
            margen_tolerancia: parseInt(String(formData.margen_tolerancia)),
            hora_apertura: formData.hora_apertura,
            hora_cierre: formData.hora_cierre,
          },
        ])
        .select()
        .single();

      if (restError) throw restError;

      const mesasParaInsertar = mesas.map(m => ({
        restaurant_id: newRest.id,
        name: m.name,
        capacidad_minima: m.capacidad_minima,
        capacidad_maxima: m.capacidad_maxima
      }));

      const { error: tablesError } = await supabase
        .from('tables')
        .insert(mesasParaInsertar);

      if (tablesError) throw tablesError;

      setMensaje('¡Restaurante e inventario de mesas creados con éxito!');
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error: any) {
      console.error(error);
      setMensaje(`Hubo un error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Si no ha montado en el cliente, no renderiza nada para evitar conflictos con extensiones
  if (!isClient) return null;

  const cubiertosAgregados = mesas.reduce((acc, m) => acc + m.capacidad_maxima, 0);

  return (
    <main style={{ maxWidth: '750px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>BocAPP - Alta Completa de Establecimiento</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Configura los datos del local y define sus mesas físicas en un solo paso.</p>

      {mensaje && (
        <div style={{ padding: '1rem', marginBottom: '1.5rem', background: mensaje.includes('Error') ? '#ffebee' : '#e8f5e9', color: mensaje.includes('Error') ? '#c62828' : '#2e7d32', borderRadius: '6px', fontWeight: 500 }}>
          {mensaje}
        </div>
      )}

      <section style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>1. Configuración del Local</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Nombre</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Pompei" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Ciudad</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ej. San Fernando" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Tipo</label>
            <select name="type" value={formData.type} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}>
              <option value="restaurante">Restaurante</option>
              <option value="brunch">Brunch / Café</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Aforo Cubiertos Totales</label>
            <input type="number" name="cubiertos_totales" value={formData.cubiertos_totales} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Rotación (min)</label>
            <input type="number" name="minutos_rotacion" value={formData.minutos_rotacion} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Tolerancia (min)</label>
            <input type="number" name="margen_tolerancia" value={formData.margen_tolerancia} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Hora Apertura</label>
            <input type="time" name="hora_apertura" value={formData.hora_apertura} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Hora Cierre</label>
            <input type="time" name="hora_cierre" value={formData.hora_cierre} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '2.5rem', background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee' }}>
        <h3 style={{ marginBottom: '1rem' }}>2. Inventario Físico de Mesas</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.75rem', alignItems: 'end', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Identificador</label>
            <input type="text" value={nombreMesa} onChange={(e) => setNombreMesa(e.target.value)} placeholder="Mesa 1, Barra..." style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Min Pax</label>
            <input type="number" min="1" value={capMin} onChange={(e) => setCapMin(Number(e.target.value))} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Max Pax</label>
            <input type="number" min="1" value={capMax} onChange={(e) => setCapMax(Number(e.target.value))} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }} />
          </div>
          <button type="button" onClick={agregarMesaALaLista} style={{ padding: '0.65rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            + Añadir
          </button>
        </div>

        {mesas.length > 0 && (
          <div style={{ background: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #ddd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#2e7d32' }}>
              <span>Mesas preparadas: <strong>{mesas.length}</strong></span>
              <span>Cubiertos totales asignados: <strong>{cubiertosAgregados} / {formData.cubiertos_totales}</strong></span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {mesas.map((m, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f9f9f9', border: '1px solid #eee', borderRadius: '4px', fontSize: '0.9rem' }}>
                  <span><strong>{m.name}</strong> (Capacidad: {m.capacidad_minima} - {m.capacidad_maxima} pax)</span>
                  <button type="button" onClick={() => eliminarMesa(index)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={handleSubmitFinal}
        disabled={loading}
        style={{
          width: '100%',
          padding: '1rem',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          cursor: 'pointer',
        }}
      >
        {loading ? 'Procesando alta e inventario...' : 'Finalizar Registro Completo'}
      </button>
    </main>
  );
}
